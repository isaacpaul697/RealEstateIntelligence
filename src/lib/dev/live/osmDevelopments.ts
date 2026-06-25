import { UA, DAY, memo } from "./http";
import type { Development, PropertyType } from "../types";

/**
 * OpenStreetMap Overpass — universal "developments" source for cities WITHOUT
 * a connected permit portal. We pull tagged building footprints near a center,
 * classify each to a property type, and estimate floor area from the real
 * footprint polygon × levels. Everything derived here (cost, etc.) is modeled
 * from these live geometry/tags and badged "estimated" downstream. No portal,
 * so there are no declared valuations, permit dates, or developer names —
 * those degrade to modeled / "not reported" rather than fake values.
 */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type OsmTags = Record<string, string>;
interface OsmEl {
  type: "way" | "relation" | "node";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: OsmTags;
}

/** Building types we treat as "developments" (skip sheds/garages/etc.). */
const BUILDING_RX =
  "apartments|residential|dormitory|commercial|retail|office|industrial|" +
  "warehouse|mixed_use|hotel|hospital|civic|public|government|college|university";

/** Assumed floor count when a building lacks building:levels, by type. */
const DEFAULT_LEVELS: Record<PropertyType, number> = {
  multifamily: 4,
  office: 6,
  "mixed-use": 4,
  retail: 1,
  industrial: 1,
  "single-family": 2,
  other: 2,
};

function classifyOsm(tags: OsmTags): PropertyType {
  const b = (tags.building || "").toLowerCase();
  const lu = (tags.landuse || "").toLowerCase();
  const use = (tags["building:use"] || "").toLowerCase();
  if (b === "mixed_use" || use === "mixed") return "mixed-use";
  if (tags.office || b === "office") return "office";
  if (b === "industrial" || b === "warehouse" || lu === "industrial") return "industrial";
  if (b === "retail" || b === "supermarket" || b === "kiosk" || tags.shop) return "retail";
  if (b === "apartments" || b === "residential" || b === "dormitory") return "multifamily";
  if (["house", "detached", "semidetached_house", "terrace", "bungalow"].includes(b)) return "single-family";
  if (b === "commercial") return "office";
  return "other";
}

/** Footprint area in m² from a closed lat/lng polygon (planar approximation). */
function footprintM2(geom: Array<{ lat: number; lon: number }>): number {
  if (!geom || geom.length < 3) return 0;
  const lat0 = (geom[0].lat * Math.PI) / 180;
  const mLat = 110_574;
  const mLng = 111_320 * Math.cos(lat0);
  let s = 0;
  for (let i = 0; i < geom.length; i++) {
    const a = geom[i];
    const b = geom[(i + 1) % geom.length];
    s += a.lon * mLng * (b.lat * mLat) - b.lon * mLng * (a.lat * mLat);
  }
  return Math.abs(s) / 2;
}

function centroid(geom: Array<{ lat: number; lon: number }>): { lat: number; lng: number } | null {
  if (!geom || geom.length === 0) return null;
  let la = 0, lo = 0;
  for (const p of geom) {
    la += p.lat;
    lo += p.lon;
  }
  return { lat: la / geom.length, lng: lo / geom.length };
}

function intTag(tags: OsmTags, key: string): number | null {
  const v = parseInt(tags[key] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** Pull a 4-digit construction year from any of the date-ish tags → ISO Jan 1. */
function startDate(tags: OsmTags): string | null {
  const raw = tags.start_date || tags["building:start_date"] || tags.construction || "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const yr = raw.match(/\b(19|20)\d{2}\b/);
  return yr ? `${yr[0]}-01-01` : null;
}

function composeAddress(tags: OsmTags): string | null {
  const num = tags["addr:housenumber"];
  const street = tags["addr:street"];
  if (num && street) return `${num} ${street}`;
  if (street) return street;
  return tags.name || tags["addr:housename"] || null;
}

const TYPE_LABEL_SHORT: Record<PropertyType, string> = {
  multifamily: "Apartment / residential building",
  office: "Office building",
  "mixed-use": "Mixed-use building",
  retail: "Retail building",
  industrial: "Industrial / warehouse",
  "single-family": "House",
  other: "Building",
};

/** Map one OSM element (way with geometry) to a normalized Development. */
function mapElement(el: OsmEl, citySlug: string): Development | null {
  const tags = el.tags ?? {};
  if (!tags.building && !tags["building:part"]) return null;

  let lat: number | null = null;
  let lng: number | null = null;
  let sqft: number | null = null;
  const type = classifyOsm(tags);

  if (el.geometry && el.geometry.length >= 3) {
    const c = centroid(el.geometry);
    if (!c) return null;
    lat = c.lat;
    lng = c.lng;
    const m2 = footprintM2(el.geometry);
    if (m2 >= 60) {
      const levels = intTag(tags, "building:levels") ?? DEFAULT_LEVELS[type];
      sqft = Math.round(m2 * levels * 10.7639);
    }
  } else if (el.center) {
    lat = el.center.lat;
    lng = el.center.lon;
  } else if (el.lat != null && el.lon != null) {
    lat = el.lat;
    lng = el.lon;
  }
  if (lat == null || lng == null) return null;

  const units = intTag(tags, "building:units") ?? intTag(tags, "building:flats");
  const name = tags.name || tags["addr:housename"] || null;

  return {
    id: `${citySlug}:${el.type}-${el.id}`,
    city: citySlug,
    permitNumber: `${el.type}-${el.id}`,
    type,
    rawType: tags.building || tags.landuse || "building",
    description: name || TYPE_LABEL_SHORT[type],
    address: composeAddress(tags) ?? name ?? "n/a",
    lat,
    lng,
    declaredValue: null, // OSM carries no valuation — cost is modeled, badged estimated
    issueDate: startDate(tags),
    completeDate: null,
    status: tags.construction ? "Under construction" : null,
    developer: tags.operator || tags.brand || null,
    sqft,
    units,
  };
}

export interface OsmFetch {
  ok: boolean;
  developments: Development[];
  error?: string;
}

async function runOverpass(query: string): Promise<OsmEl[] | null> {
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        next: { revalidate: DAY },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OsmEl[] };
      return json.elements ?? [];
    } catch {
      /* try next mirror */
    }
  }
  return null;
}

/**
 * Fetch developments (tagged building footprints) near a point. Returns the
 * largest ~600 by floor area so the map surfaces real developments rather than
 * an arbitrary slice. Heavily cached.
 */
export async function fetchOsmDevelopments(
  lat: number,
  lng: number,
  radiusM: number,
  citySlug: string,
): Promise<OsmFetch> {
  return memo(`osmdev:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusM}`, DAY, async () => {
    const q =
      `[out:json][timeout:50];` +
      `(` +
      `way(around:${radiusM},${lat},${lng})["building"~"${BUILDING_RX}"];` +
      `way(around:${radiusM},${lat},${lng})["building"]["name"];` +
      `);out geom 1400;`;

    const els = await runOverpass(q);
    if (els == null) return { ok: false, developments: [], error: "OpenStreetMap (Overpass) was unavailable." };

    const seen = new Set<string>();
    const devs: Development[] = [];
    for (const el of els) {
      if (el.type !== "way") continue;
      const d = mapElement(el, citySlug);
      if (d && !seen.has(d.id)) {
        seen.add(d.id);
        devs.push(d);
      }
    }
    // Largest floor area first — surfaces meaningful developments.
    devs.sort((a, b) => (b.sqft ?? 0) - (a.sqft ?? 0));
    return { ok: devs.length > 0, developments: devs.slice(0, 600) };
  }, (r) => r.ok);
}

/** Re-fetch a single OSM element by type+id for the development detail page. */
export async function fetchOsmElement(
  osmType: string,
  osmId: number,
  citySlug: string,
): Promise<Development | null> {
  return memo(`osmel:${osmType}:${osmId}`, DAY, async () => {
    const q = `[out:json][timeout:25];${osmType}(${osmId});out geom 1;`;
    const els = await runOverpass(q);
    if (!els || els.length === 0) return null;
    return mapElement(els[0], citySlug);
  }, (r) => r != null);
}

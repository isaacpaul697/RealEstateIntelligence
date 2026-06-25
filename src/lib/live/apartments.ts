import type { Apartment } from "../types";
import type { HudFmr } from "./hud";
import type { CensusData } from "./census";
import { DAY, UA, milesBetween } from "./http";

const ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/**
 * Whole-unit regional base rents (monthly). Student housing leases by the bed,
 * so these get divided by the average beds/unit to derive a per-bed fallback.
 */
const REGIONAL_BASE_RENT: Record<string, number> = {
  West: 1800,
  Northeast: 1500,
  Midwest: 1000,
  South: 1100,
};

/**
 * Average leasable beds per unit for near-campus apartments. Student housing is
 * leased by the bed (each bedroom in a shared unit is its own lease), so beds,
 * not units, drive revenue. OSM has no bedroom data, so we apply this average to
 * the unit count. Conservative blended estimate for mixed near-campus stock.
 */
const BEDS_PER_UNIT = 2;

/** Per-bed monthly rent used to model revenue, plus where it came from. */
export interface RentInfo {
  rent: number | null;
  source: string;
}

/**
 * Resolve a real, county-level PER-BED rent for the revenue model.
 * Student housing leases by the bed, so we want a per-bedroom figure, derived
 * from HUD's per-bedroom Fair Market Rents (whole-unit FMR ÷ bedroom count).
 * Priority: HUD FMR (official, government-published) -> Census ACS median gross
 * rent (÷ beds/unit) -> null (caller falls back to a regional per-bed estimate).
 */
export function pickCountyRent(fmr?: HudFmr, census?: CensusData): RentInfo {
  if (fmr) {
    // Higher-bedroom units divided by their bed count best mirror the per-bed
    // economics of shared student units; fall back down the bedroom ladder.
    const perBed =
      (fmr.fourBed && fmr.fourBed / 4) ||
      (fmr.threeBed && fmr.threeBed / 3) ||
      (fmr.twoBed && fmr.twoBed / 2) ||
      (fmr.oneBed && fmr.oneBed) ||
      (fmr.efficiency && fmr.efficiency) ||
      0;
    if (perBed > 0) {
      return { rent: Math.round(perBed), source: `HUD ${fmr.year ?? ""} FMR (per bed)`.replace(/\s+/g, " ").trim() };
    }
  }
  if (census?.medianRent && census.medianRent > 0) {
    return { rent: Math.round(census.medianRent / BEDS_PER_UNIT), source: "Census ACS median rent (per bed)" };
  }
  return { rent: null, source: "Regional estimate" };
}

type LatLon = { lat: number; lon: number };

/**
 * Footprint area in m² from an OSM way's polygon geometry (returned by Overpass
 * `out geom`). Uses an equirectangular projection around the polygon's latitude
 * plus the shoelace formula - accurate enough for a single building's footprint.
 */
function polygonAreaSqm(geom: LatLon[] | undefined): number {
  if (!geom || geom.length < 3) return 0;
  const R = 6378137; // earth radius (m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat0 = toRad(geom[0].lat);
  const pts = geom.map((p) => ({
    x: R * toRad(p.lon) * Math.cos(lat0),
    y: R * toRad(p.lat),
  }));
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

/** Centroid of a polygon (simple vertex average - fine for picking a map pin). */
function centroid(geom: LatLon[] | undefined): LatLon | null {
  if (!geom || geom.length === 0) return null;
  let lat = 0, lon = 0;
  for (const p of geom) { lat += p.lat; lon += p.lon; }
  return { lat: lat / geom.length, lon: lon / geom.length };
}

type BuildingKind = "student" | "apartments" | "residential";

function classifyBuilding(tags: Record<string, string>): BuildingKind {
  if (tags.building === "dormitory" || tags.amenity === "student_accommodation") return "student";
  if (tags.building === "residential") return "residential";
  return "apartments";
}

// Typical number of floors when OSM has no building:levels, by building kind.
const DEFAULT_FLOORS: Record<BuildingKind, number> = { student: 5, apartments: 4, residential: 2 };
// Last-resort unit count when there's no footprint geometry and no levels.
const DEFAULT_UNITS: Record<BuildingKind, number> = { student: 80, apartments: 30, residential: 10 };
// Gross built area (m²) per leasable unit, including hallways/common areas.
// Student units pack more, smaller bedrooms per floor than market-rate flats.
const GROSS_SQM_PER_UNIT: Record<BuildingKind, number> = { student: 70, apartments: 100, residential: 120 };

/**
 * Estimate the number of units. Priority:
 *  1. Explicit OSM unit count (building:flats / building:apartments).
 *  2. Footprint area × floors ÷ gross-area-per-unit - varied & defensible.
 *  3. Levels-only fallback (nodes have no geometry): levels × 8.
 *  4. Type-based default constant.
 */
function estimateUnits(tags: Record<string, string>, areaSqm: number, kind: BuildingKind): number {
  const flats = parseInt(tags["building:flats"] || tags["building:apartments"] || "", 10);
  if (flats > 0) return flats;

  const levels = parseInt(tags["building:levels"] || "", 10);
  const floors = levels > 0 ? levels : DEFAULT_FLOORS[kind];

  if (areaSqm > 0) {
    const units = Math.round((areaSqm * floors) / GROSS_SQM_PER_UNIT[kind]);
    return Math.max(4, Math.min(1500, units));
  }
  if (levels > 0) return levels * 8;
  return DEFAULT_UNITS[kind];
}

const STUDENT_BRANDS = ["lark", "hub", "oliv", "the collective", "the standard", "the retreat", "the province", "the cottages", "the pointe", "the edge", "the flats", "ion ", "the mark", "the vue", "the verge"];

/**
 * Reject names that aren't real, recognizable apartment names: single letters or
 * numbers (OSM building labels like "A", "B", "12"), bare punctuation, or names
 * with no alphabetic content. Requires at least 3 characters and 2+ letters.
 */
function isValidName(raw: string): boolean {
  const name = raw.trim();
  if (name.length < 3) return false;
  const letters = (name.match(/[a-zA-Z]/g) || []).length;
  if (letters < 2) return false;
  // Reject single-token labels like "Building A" reduced to just "A", or "Block 3".
  if (/^(building|block|bldg|unit|apt|apartment)\s+\w{1,2}$/i.test(name)) return false;
  return true;
}

function isExcluded(tags: Record<string, string>): boolean {
  const name = (tags.name || "").toLowerCase();
  const amenity = tags.amenity || "";
  if (["fraternity", "sorority"].includes(amenity)) return true;
  if (/\b(fraternity|sorority)\b/.test(name)) return true;
  if (/\bresidence hall\b/.test(name)) return true;
  if (tags.building === "dormitory") {
    if (tags["building:flats"] || amenity === "student_accommodation") return false;
    if (STUDENT_BRANDS.some((b) => name.includes(b))) return false;
    return true;
  }
  const skip = ["hotel", "motel", "hostel", "hospital", "church", "school", "office", "museum", "library"];
  if (skip.some((s) => name.includes(s))) return true;
  return false;
}

/**
 * Real apartment buildings near a campus, from OpenStreetMap (Overpass).
 * Broad query: apartments, residential buildings, and student accommodation
 * within ~3 mi, nearest first, with website links and estimated capacity.
 */
export async function fetchApartments(
  lat: number,
  lng: number,
  region: string = "South",
  rentInfo?: RentInfo,
  radius = 5000,
): Promise<Apartment[]> {
  const around = `around:${radius},${lat},${lng}`;
  const q =
    `[out:json][timeout:30];(` +
    `way["building"="apartments"]["name"](${around});` +
    `node["building"="apartments"]["name"](${around});` +
    `way["building"="residential"]["name"](${around});` +
    `way["building"="dormitory"]["name"](${around});` +
    `way["amenity"="student_accommodation"]["name"](${around});` +
    `node["amenity"="student_accommodation"]["name"](${around});` +
    `way["building"]["name"]["building:flats"](${around});` +
    `);out geom 300;`;
  // Per-bed rent: use the real county figure when we have it; otherwise fall
  // back to a coarse regional constant (÷ beds/unit) and label it as such.
  const realRent = rentInfo?.rent && rentInfo.rent > 0 ? rentInfo.rent : null;
  const perBedRent = realRent ?? Math.round((REGIONAL_BASE_RENT[region] ?? 1200) / BEDS_PER_UNIT);
  const rentSource = realRent ? rentInfo!.source : "Regional estimate (per bed)";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: { elements?: any[] } = {};
    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "data=" + encodeURIComponent(q),
          next: { revalidate: DAY },
        });
        if (res.ok) { json = await res.json(); break; }
      } catch { continue; }
    }
    const seen = new Set<string>();
    const out: Apartment[] = [];
    for (const el of json.elements ?? []) {
      const t = el.tags ?? {};
      const name: string | undefined = t.name;
      if (!name) continue;
      if (!isValidName(name)) continue;
      if (isExcluded(t)) continue;
      const geom: LatLon[] | undefined = el.geometry;
      const c = centroid(geom);
      const aLat = el.lat ?? el.center?.lat ?? c?.lat;
      const aLng = el.lon ?? el.center?.lon ?? c?.lon;
      if (aLat == null || aLng == null) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const dist = milesBetween(lat, lng, aLat, aLng);
      if (dist > 3.1) continue;
      const street = [t["addr:housenumber"], t["addr:street"]]
        .filter(Boolean)
        .join(" ");
      const kind = classifyBuilding(t);
      const areaSqm = polygonAreaSqm(geom);
      const units = estimateUnits(t, areaSqm, kind);
      const beds = units * BEDS_PER_UNIT;
      const directUrl = t.website || t["contact:website"] || null;
      const city = t["addr:city"] || "";
      const searchFallback = directUrl
        ? null
        : `https://www.google.com/search?q=${encodeURIComponent(name + " apartments " + city)}`;

      out.push({
        id: `${el.type}/${el.id}`,
        name,
        lat: aLat,
        lng: aLng,
        website: directUrl,
        searchUrl: searchFallback,
        street: street || city || null,
        distanceMi: Math.round(dist * 100) / 100,
        estUnits: units,
        estBeds: beds,
        estMonthlyRent: perBedRent,
        estAnnualRevenue: beds * perBedRent * 12,
        rentSource,
      });
    }
    return out.sort((a, b) => a.distanceMi - b.distanceMi);
  } catch {
    return [];
  }
}

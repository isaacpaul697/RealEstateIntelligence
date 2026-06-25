import { UA, DAY, memo } from "./http";

/**
 * OpenStreetMap Overpass — characterize an area's existing built mix.
 * Keyless. We tally land-use polygons + tagged buildings near a point to
 * estimate the current share of residential / commercial / industrial /
 * retail / office land. This feeds the supply-gap model as the
 * "what's already here" baseline.
 */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export interface LandUseMix {
  available: boolean;
  total: number;
  residential: number;
  commercial: number;
  industrial: number;
  retail: number;
  office: number;
  /** Normalized shares (0..1). */
  shares: Record<"residential" | "commercial" | "industrial" | "retail" | "office", number>;
}

function classify(tags: Record<string, string>): keyof LandUseMix["shares"] | null {
  const lu = tags.landuse;
  const b = tags.building;
  const amenity = tags.shop;
  if (lu === "residential" || b === "apartments" || b === "residential" || b === "house") return "residential";
  if (lu === "industrial" || b === "industrial" || b === "warehouse") return "industrial";
  if (lu === "retail" || b === "retail" || amenity) return "retail";
  if (lu === "commercial" || b === "commercial") return "commercial";
  if (b === "office") return "office";
  return null;
}

export async function fetchLandUse(lat: number, lng: number, radiusM = 4000): Promise<LandUseMix> {
  const empty: LandUseMix = {
    available: false, total: 0, residential: 0, commercial: 0, industrial: 0,
    retail: 0, office: 0, shares: { residential: 0, commercial: 0, industrial: 0, retail: 0, office: 0 },
  };

  return memo(`overpass:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusM}`, DAY, async () => {
    const q =
      `[out:json][timeout:25];` +
      `(` +
      `way(around:${radiusM},${lat},${lng})["landuse"~"residential|commercial|industrial|retail"];` +
      `way(around:${radiusM},${lat},${lng})["building"~"apartments|residential|industrial|warehouse|commercial|retail|office"];` +
      `);out tags 3000;`;

    for (const ep of ENDPOINTS) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(q)}`,
          next: { revalidate: DAY },
        });
        if (!res.ok) continue;
        const json = (await res.json()) as { elements?: Array<{ tags?: Record<string, string> }> };
        const els = json.elements ?? [];
        const counts = { residential: 0, commercial: 0, industrial: 0, retail: 0, office: 0 };
        for (const el of els) {
          const cat = el.tags ? classify(el.tags) : null;
          if (cat) counts[cat]++;
        }
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (total === 0) return empty;
        const shares = Object.fromEntries(
          Object.entries(counts).map(([k, v]) => [k, v / total]),
        ) as LandUseMix["shares"];
        return { available: true, total, ...counts, shares };
      } catch {
        /* try next mirror */
      }
    }
    return empty;
  });
}

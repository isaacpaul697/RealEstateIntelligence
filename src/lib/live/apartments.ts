import type { Apartment } from "../types";
import { DAY, UA, milesBetween } from "./http";

const ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REGIONAL_BASE_RENT: Record<string, number> = {
  West: 1800,
  Northeast: 1500,
  Midwest: 1000,
  South: 1100,
};

function estimateUnits(tags: Record<string, string>): number {
  const flats = parseInt(tags["building:flats"] || tags["building:apartments"] || "", 10);
  if (flats > 0) return flats;
  const levels = parseInt(tags["building:levels"] || "", 10);
  if (levels > 0) return levels * 8;
  return 30;
}

const STUDENT_BRANDS = ["lark", "hub", "oliv", "the collective", "the standard", "the retreat", "the province", "the cottages", "the pointe", "the edge", "the flats", "ion ", "the mark", "the vue", "the verge"];

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
    `);out center 300;`;
  const baseRent = REGIONAL_BASE_RENT[region] ?? 1200;
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
      if (isExcluded(t)) continue;
      const aLat = el.lat ?? el.center?.lat;
      const aLng = el.lon ?? el.center?.lon;
      if (aLat == null || aLng == null) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const dist = milesBetween(lat, lng, aLat, aLng);
      if (dist > 3.1) continue;
      const street = [t["addr:housenumber"], t["addr:street"]]
        .filter(Boolean)
        .join(" ");
      const units = estimateUnits(t);
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
        estMonthlyRent: baseRent,
        estAnnualRevenue: units * baseRent * 12,
      });
    }
    return out.sort((a, b) => a.distanceMi - b.distanceMi);
  } catch {
    return [];
  }
}

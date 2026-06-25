import { geocode, type GeoPlace } from "./live/nominatim";
import { fetchOsmDevelopments } from "./live/osmDevelopments";
import { fetchDemandForPoint } from "./live/demand";
import { fetchLandUse } from "./live/overpass";
import { fetchFred } from "./live/fred";
import { cityKpis } from "./aggregate";
import { computeGap } from "./gap";
import type { CityBundle } from "./bundle";
import type { CityConfig } from "./types";

const STATE_NAME_TO_POSTAL: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "area";
}

/** Pretty city/area name + 2-letter state from a Nominatim display name. */
function parsePlace(displayName: string): { name: string; state: string } {
  const lower = displayName.toLowerCase();
  const entry = Object.entries(STATE_NAME_TO_POSTAL).find(([n]) => lower.includes(n));
  const name = displayName.split(",")[0].trim();
  return { name, state: entry?.[1] ?? "US" };
}

/** Derive a query radius (m) from the geocoded bounding box, clamped sanely. */
function radiusFromBbox(bbox: [number, number, number, number], lat: number): number {
  const [south, north, west, east] = bbox;
  const mLat = (north - south) * 111_000;
  const mLng = (east - west) * 111_000 * Math.cos((lat * Math.PI) / 180);
  const half = Math.max(mLat, mLng) / 2;
  return Math.round(Math.min(9000, Math.max(2500, half)));
}

export interface AreaResult {
  place: GeoPlace | null;
  bundle: CityBundle | null;
}

/**
 * Build an OSM-backed CityBundle for a known center point. Shared by both the
 * free-text area search and registry cities that lack a permit portal, so they
 * all render through the same Austin-style CityView.
 */
export async function buildOsmBundle(city: CityConfig, radius: number): Promise<CityBundle> {
  const { lat, lng } = city;
  const fred = await fetchFred();
  const [osm, demand, landUse] = await Promise.all([
    fetchOsmDevelopments(lat, lng, radius, city.id),
    fetchDemandForPoint(lat, lng),
    fetchLandUse(lat, lng, Math.min(6000, radius)),
  ]);
  const developments = osm.developments;
  return {
    city,
    mode: "osm",
    ok: osm.ok,
    error: osm.error,
    developments,
    kpis: cityKpis(developments, fred.costMultiplier),
    gap: computeGap(developments, demand, landUse),
    demand,
    landUse,
    developers: [],
    fred,
  };
}

/**
 * Build a city-style bundle for ANY geocodable U.S. place, backed by
 * OpenStreetMap building footprints. Mirrors getCityBundle's shape so the
 * shared CityView renders it identically. Developer leaderboard is omitted
 * (OSM has no reliable developer attribution).
 */
export async function getAreaBundle(query: string): Promise<AreaResult> {
  const place = await geocode(query);
  if (!place) return { place: null, bundle: null };

  const { lat, lng } = place;
  const slug = slugify(`${place.displayName.split(",").slice(0, 2).join("-")}`);
  const { name, state } = parsePlace(place.displayName);
  const radius = radiusFromBbox(place.bbox, lat);
  const city: CityConfig = { id: slug, name, state, lat, lng, zoom: 12 };

  const bundle = await buildOsmBundle(city, radius);
  return { place, bundle };
}

/** Turn an OSM city slug (e.g. "denver-colorado") back into a readable query. */
export function slugToQuery(slug: string): string {
  return slug.replace(/-/g, " ");
}

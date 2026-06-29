import { UA, DAY, HOUR, memo } from "./http";

/**
 * OpenStreetMap Nominatim geocoder: turn a typed city/area into a center + bbox.
 * Keyless; requires a descriptive User-Agent. Heavily cached.
 */
export interface GeoPlace {
  displayName: string;
  lat: number;
  lng: number;
  /** [south, north, west, east] */
  bbox: [number, number, number, number];
}

export interface PlaceSuggestion {
  /** Full label, e.g. "Boise, Ada County, Idaho, United States". */
  label: string;
  /** Compact "City, ST"-style label for the input value. */
  short: string;
  lat: number;
  lng: number;
}

/** Trim Nominatim's verbose display name to a compact "first, second" label. */
function shorten(displayName: string): string {
  return displayName.split(",").map((s) => s.trim()).slice(0, 2).join(", ");
}

/**
 * Typeahead suggestions for the area search box. Returns up to `limit` US
 * places matching the partial query. Cached briefly per term so repeated
 * keystrokes don't hammer Nominatim.
 */
export async function suggestPlaces(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return memo(`suggest:${q.toLowerCase()}`, HOUR, async () => {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}&format=json&limit=${limit}&countrycodes=us&addressdetails=0&dedupe=1`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: HOUR },
      });
      if (!res.ok) return [];
      const arr = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
      const seen = new Set<string>();
      const out: PlaceSuggestion[] = [];
      for (const r of arr) {
        const short = shorten(r.display_name);
        if (seen.has(short)) continue;
        seen.add(short);
        out.push({ label: r.display_name, short, lat: Number(r.lat), lng: Number(r.lon) });
      }
      return out;
    } catch {
      return [];
    }
  }, (v) => v.length > 0);
}

export async function geocode(query: string): Promise<GeoPlace | null> {
  const q = query.trim();
  if (!q) return null;
  return memo(`geocode:${q.toLowerCase()}`, DAY, async () => {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=us&addressdetails=0`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: DAY },
      });
      if (!res.ok) return null;
      const arr = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        boundingbox: [string, string, string, string];
      }>;
      if (!arr.length) return null;
      const r = arr[0];
      const bb = r.boundingbox.map(Number) as [number, number, number, number];
      return {
        displayName: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
        bbox: bb, // Nominatim order: [south, north, west, east]
      };
    } catch {
      return null;
    }
  });
}

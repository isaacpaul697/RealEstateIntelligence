import { UA, DAY, memo } from "./http";

/**
 * OpenStreetMap Nominatim — geocode a typed city/area into a center + bbox.
 * Keyless; requires a descriptive User-Agent. Heavily cached.
 */
export interface GeoPlace {
  displayName: string;
  lat: number;
  lng: number;
  /** [south, north, west, east] */
  bbox: [number, number, number, number];
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

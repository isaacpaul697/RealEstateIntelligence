import { UA, DAY, memo } from "./http";

/**
 * Census Geocoder (keyless) — resolve a lat/lng to its county FIPS so the
 * ACS demand model works for ANY geocoded place, not just the registry
 * cities. Returns null on failure; callers degrade gracefully.
 */
export interface CountyFips {
  state: string; // 2-digit state FIPS
  county: string; // 3-digit county FIPS
  name?: string;
}

export async function countyFromLatLng(lat: number, lng: number): Promise<CountyFips | null> {
  return memo(`fips:${lat.toFixed(3)}:${lng.toFixed(3)}`, DAY, async () => {
    const url =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current` +
      `&format=json&layers=Counties`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: DAY } });
      if (!res.ok) return null;
      const j = (await res.json()) as {
        result?: { geographies?: Record<string, Array<{ STATE?: string; COUNTY?: string; BASENAME?: string }>> };
      };
      const c = j?.result?.geographies?.["Counties"]?.[0];
      if (!c?.STATE || !c?.COUNTY) return null;
      return { state: c.STATE, county: c.COUNTY, name: c.BASENAME };
    } catch {
      return null;
    }
  });
}

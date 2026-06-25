import { UA, DAY } from "./http";

/**
 * Census API key - get one free at https://api.census.gov/data/key_signup.html
 * Set CENSUS_API_KEY env var. Without a key, Census data gracefully returns nulls.
 */
const CENSUS_KEY = process.env.CENSUS_API_KEY || "";

export interface CensusData {
  population: number | null;
  medianAge: number | null;
  renterPct: number | null; // renter / (renter + owner) * 100
  medianRent: number | null;
  medianIncome: number | null;
}

const VARS = [
  "NAME",
  "B01003_001E", // total population
  "B01002_001E", // median age
  "B25003_002E", // owner-occupied units
  "B25003_003E", // renter-occupied units
  "B25064_001E", // median gross rent
  "B19013_001E", // median household income
].join(",");

function num(v: string | null | undefined): number | null {
  if (v == null || v === "" || v === "-") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetch Census ACS 5-year data for a list of counties.
 * Batches by state so each unique state requires only one API call.
 * No API key needed (500 requests/day limit). Cached for a day.
 */
export async function fetchCensusData(
  fipsCodes: string[],
): Promise<Map<string, CensusData>> {
  const out = new Map<string, CensusData>();
  if (fipsCodes.length === 0 || !CENSUS_KEY) return out;

  // Group FIPS codes by state (first 2 digits)
  const byState = new Map<string, string[]>();
  for (const fips of fipsCodes) {
    const state = fips.slice(0, 2);
    const county = fips.slice(2);
    const existing = byState.get(state);
    if (existing) {
      if (!existing.includes(county)) existing.push(county);
    } else {
      byState.set(state, [county]);
    }
  }

  // One request per state, all counties batched
  const fetches = Array.from(byState.entries()).map(
    async ([state, counties]) => {
      const countyParam = counties.join(",");
      const url =
        `https://api.census.gov/data/2022/acs/acs5` +
        `?get=${VARS}&for=county:${countyParam}&in=state:${state}&key=${CENSUS_KEY}`;

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA },
          next: { revalidate: DAY },
        });
        if (!res.ok) return;
        const rows: string[][] = await res.json();
        if (!rows || rows.length < 2) return;

        // First row is headers; remaining rows are data
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          // Columns: NAME, B01003_001E, B01002_001E, B25003_002E, B25003_003E,
          //          B25064_001E, B19013_001E, state, county
          const stCode = r[7];
          const coCode = r[8];
          const fips5 = `${stCode}${coCode}`;

          const owner = num(r[3]);
          const renter = num(r[4]);
          let renterPct: number | null = null;
          if (owner != null && renter != null && owner + renter > 0) {
            renterPct = (renter / (renter + owner)) * 100;
          }

          out.set(fips5, {
            population: num(r[1]),
            medianAge: num(r[2]),
            renterPct,
            medianRent: num(r[5]),
            medianIncome: num(r[6]),
          });
        }
      } catch {
        /* leave entries missing; callers handle nulls */
      }
    },
  );

  await Promise.all(fetches);
  return out;
}

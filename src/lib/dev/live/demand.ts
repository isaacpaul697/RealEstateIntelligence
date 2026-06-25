import { UA, DAY, num, memo } from "./http";
import { countyFromLatLng } from "./census-geo";

/**
 * Census ACS 5-year — demand-side inputs for the supply-gap model.
 * Free key (CENSUS_API_KEY); without it, returns null and the gap model
 * degrades to supply-only signals (clearly noted in the UI).
 */
const KEY = process.env.CENSUS_API_KEY || "";

/** Each supported city maps to the county FIPS that make up its core. */
export const CITY_COUNTIES: Record<string, { state: string; counties: string[] }> = {
  austin: { state: "48", counties: ["453"] }, // Travis
  chicago: { state: "17", counties: ["031"] }, // Cook
  nyc: { state: "36", counties: ["061", "047", "081", "005", "085"] }, // 5 boroughs
  seattle: { state: "53", counties: ["033"] }, // King
  sf: { state: "06", counties: ["075"] }, // San Francisco
  la: { state: "06", counties: ["037"] }, // Los Angeles
  neworleans: { state: "22", counties: ["071"] }, // Orleans Parish
};

const VARS = [
  "B01003_001E", // population
  "B25002_001E", // housing units (occupancy universe)
  "B25002_002E", // occupied
  "B25002_003E", // vacant
  "B25003_001E", // occupied (tenure universe)
  "B25003_003E", // renter-occupied
  "B19013_001E", // median household income
  "B25064_001E", // median gross rent
  "B11001_001E", // households
].join(",");

export interface DemandData {
  available: boolean;
  population: number | null;
  households: number | null;
  housingUnits: number | null;
  vacancyPct: number | null;
  renterPct: number | null;
  medianIncome: number | null;
  medianRent: number | null;
  /** % change vs the 5-yr ACS from 5 years earlier. */
  popGrowthPct: number | null;
  householdGrowthPct: number | null;
}

async function fetchAcsYear(
  year: number,
  state: string,
  counties: string[],
): Promise<{ pop: number; hh: number; rows: number[][] } | null> {
  const url =
    `https://api.census.gov/data/${year}/acs/acs5` +
    `?get=NAME,${VARS}&for=county:${counties.join(",")}&in=state:${state}&key=${KEY}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: DAY } });
    if (!res.ok) return null;
    const raw: string[][] = await res.json();
    if (!raw || raw.length < 2) return null;
    // Sum numeric vars across counties (column 0 is NAME).
    const rows = raw.slice(1).map((r) => r.slice(1, 1 + 9).map((v) => num(v) ?? 0));
    const pop = rows.reduce((s, r) => s + r[0], 0);
    const hh = rows.reduce((s, r) => s + r[8], 0);
    return { pop, hh, rows };
  } catch {
    return null;
  }
}

const EMPTY: DemandData = {
  available: false, population: null, households: null, housingUnits: null,
  vacancyPct: null, renterPct: null, medianIncome: null, medianRent: null,
  popGrowthPct: null, householdGrowthPct: null,
};

/** Core builder: pull ACS for a set of counties (now + 5yr prior for growth). */
async function buildDemand(state: string, counties: string[]): Promise<DemandData> {
  const [now, then] = await Promise.all([
    fetchAcsYear(2022, state, counties),
    fetchAcsYear(2017, state, counties),
  ]);
  if (!now) return EMPTY;

  const sum = (i: number) => now.rows.reduce((s, r) => s + r[i], 0);
  // For medians, take a population-weighted-ish simple average across counties.
  const avg = (i: number) => {
    const vals = now.rows.map((r) => r[i]).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const housingUnits = sum(1);
  const vacant = sum(3);
  const occupiedTenure = sum(4);
  const renter = sum(5);

  return {
    available: true,
    population: now.pop || null,
    households: now.hh || null,
    housingUnits: housingUnits || null,
    vacancyPct: housingUnits ? (vacant / housingUnits) * 100 : null,
    renterPct: occupiedTenure ? (renter / occupiedTenure) * 100 : null,
    medianIncome: avg(6),
    medianRent: avg(7),
    popGrowthPct: then && then.pop ? ((now.pop - then.pop) / then.pop) * 100 : null,
    householdGrowthPct: then && then.hh ? ((now.hh - then.hh) / then.hh) * 100 : null,
  };
}

/** Demand for a registry city (mapped to its core counties). */
export async function fetchDemand(cityId: string): Promise<DemandData> {
  const cfg = CITY_COUNTIES[cityId];
  if (!cfg || !KEY) return EMPTY;
  return memo(`demand:${cityId}`, DAY, () => buildDemand(cfg.state, cfg.counties));
}

/** Demand for any geocoded point — resolves the containing county via Census Geocoder. */
export async function fetchDemandForPoint(lat: number, lng: number): Promise<DemandData> {
  if (!KEY) return EMPTY;
  const fips = await countyFromLatLng(lat, lng);
  if (!fips) return EMPTY;
  return memo(`demand:pt:${fips.state}:${fips.county}`, DAY, () =>
    buildDemand(fips.state, [fips.county]),
  );
}

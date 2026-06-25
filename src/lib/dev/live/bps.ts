import { UA, DAY, num, memo } from "./http";
import type { BpsStateRow } from "../types";

/**
 * U.S. Census Building Permits Survey — annual state files.
 * Keyless CSV at https://www2.census.gov/econ/bps/State/stYYYYa.txt
 * Two header rows; columns are (Bldgs,Units,Value) groups per structure type
 * (1-unit, 2-units, 3-4 units, 5+ units), then "reported" variants. Value is
 * in thousands of USD. We read the imputed (first) set.
 */

const BASE = "https://www2.census.gov/econ/bps/State";

const FIPS_TO_POSTAL: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY",
};

/** Approx state centroids for the national map. */
export const STATE_CENTROID: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.8, lng: -86.8 }, AK: { lat: 64.2, lng: -149.5 }, AZ: { lat: 34.2, lng: -111.7 },
  AR: { lat: 34.9, lng: -92.4 }, CA: { lat: 37.2, lng: -119.5 }, CO: { lat: 39, lng: -105.5 },
  CT: { lat: 41.6, lng: -72.7 }, DE: { lat: 39, lng: -75.5 }, DC: { lat: 38.9, lng: -77 },
  FL: { lat: 28.6, lng: -82.4 }, GA: { lat: 32.6, lng: -83.4 }, HI: { lat: 20.3, lng: -156.4 },
  ID: { lat: 44.4, lng: -114.6 }, IL: { lat: 40, lng: -89.2 }, IN: { lat: 39.9, lng: -86.3 },
  IA: { lat: 42, lng: -93.5 }, KS: { lat: 38.5, lng: -98.4 }, KY: { lat: 37.5, lng: -85.3 },
  LA: { lat: 31, lng: -92 }, ME: { lat: 45.4, lng: -69.2 }, MD: { lat: 39, lng: -76.8 },
  MA: { lat: 42.3, lng: -71.8 }, MI: { lat: 44.3, lng: -85.4 }, MN: { lat: 46.3, lng: -94.3 },
  MS: { lat: 32.7, lng: -89.7 }, MO: { lat: 38.4, lng: -92.5 }, MT: { lat: 47, lng: -109.6 },
  NE: { lat: 41.5, lng: -99.8 }, NV: { lat: 39.3, lng: -116.6 }, NH: { lat: 43.7, lng: -71.6 },
  NJ: { lat: 40.2, lng: -74.7 }, NM: { lat: 34.4, lng: -106.1 }, NY: { lat: 42.9, lng: -75.5 },
  NC: { lat: 35.6, lng: -79.4 }, ND: { lat: 47.5, lng: -100.5 }, OH: { lat: 40.3, lng: -82.8 },
  OK: { lat: 35.6, lng: -97.5 }, OR: { lat: 44, lng: -120.6 }, PA: { lat: 40.9, lng: -77.7 },
  RI: { lat: 41.7, lng: -71.6 }, SC: { lat: 33.9, lng: -80.9 }, SD: { lat: 44.4, lng: -100.2 },
  TN: { lat: 35.9, lng: -86.4 }, TX: { lat: 31.5, lng: -99.3 }, UT: { lat: 39.3, lng: -111.7 },
  VT: { lat: 44.1, lng: -72.7 }, VA: { lat: 37.5, lng: -78.9 }, WA: { lat: 47.4, lng: -120.5 },
  WV: { lat: 38.6, lng: -80.6 }, WI: { lat: 44.6, lng: -89.9 }, WY: { lat: 43, lng: -107.6 },
};

function parseAnnual(text: string): BpsStateRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: BpsStateRow[] = [];
  for (const line of lines) {
    const c = line.split(",");
    // Data lines start with a 6-digit date code like 202499
    if (!/^\d{6}$/.test(c[0])) continue;
    const fips = c[1];
    const postal = FIPS_TO_POSTAL[fips];
    if (!postal) continue;
    const units1 = num(c[6]) ?? 0;
    const units2 = num(c[9]) ?? 0;
    const units34 = num(c[12]) ?? 0;
    const units5 = num(c[15]) ?? 0;
    const value =
      (num(c[7]) ?? 0) + (num(c[10]) ?? 0) + (num(c[13]) ?? 0) + (num(c[16]) ?? 0);
    rows.push({
      state: postal,
      fips,
      units1, units2, units34, units5,
      totalUnits: units1 + units2 + units34 + units5,
      valueThousands: value,
    });
  }
  return rows;
}

async function fetchYear(year: number): Promise<BpsStateRow[] | null> {
  try {
    const res = await fetch(`${BASE}/st${year}a.txt`, {
      headers: { "User-Agent": UA },
      next: { revalidate: DAY },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseAnnual(text);
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

export interface BpsNational {
  year: number;
  states: BpsStateRow[];
  /** National totals per year for the trend chart. */
  trend: { year: number; totalUnits: number; units5: number; units1: number; valueThousands: number }[];
}

const CURRENT = new Date().getUTCFullYear();

export async function fetchBps(): Promise<BpsNational | null> {
  return memo("bps:national", DAY, async () => {
    // Find the most recent year with data (current year file may not exist yet).
    let latestYear = 0;
    let latestStates: BpsStateRow[] | null = null;
    for (let y = CURRENT; y >= CURRENT - 2; y--) {
      const rows = await fetchYear(y);
      if (rows) {
        latestYear = y;
        latestStates = rows;
        break;
      }
    }
    if (!latestStates) return null;

    // Build a national trend over the prior several years.
    const years: number[] = [];
    for (let y = latestYear - 7; y <= latestYear; y++) years.push(y);
    const trendRows = await Promise.all(
      years.map(async (y) => {
        const rows = y === latestYear ? latestStates! : await fetchYear(y);
        if (!rows) return null;
        return {
          year: y,
          totalUnits: rows.reduce((s, r) => s + r.totalUnits, 0),
          units5: rows.reduce((s, r) => s + r.units5, 0),
          units1: rows.reduce((s, r) => s + r.units1, 0),
          valueThousands: rows.reduce((s, r) => s + r.valueThousands, 0),
        };
      }),
    );

    return {
      year: latestYear,
      states: latestStates.sort((a, b) => b.totalUnits - a.totalUnits),
      trend: trendRows.filter((t): t is NonNullable<typeof t> => t != null),
    };
  });
}

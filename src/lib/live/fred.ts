import { UA, DAY } from "./http";

const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

const STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

type StateCode = (typeof STATE_CODES)[number];

/* ------------------------------------------------------------------ */
/*  CSV helpers                                                        */
/* ------------------------------------------------------------------ */

/** Fetch a FRED CSV and return rows split into string[][] (skipping header). */
async function fetchCsv(url: string): Promise<{ header: string[]; rows: string[][] }> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`FRED ${res.status}: ${url}`);

  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) throw new Error("FRED CSV had no data rows");

  const header = lines[0].split(",");
  const rows = lines.slice(1).map((l) => l.split(","));
  return { header, rows };
}

/** Return the last non-"." value for a given column index, scanning bottom-up. */
function latestValue(rows: string[][], colIdx: number): number | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const v = rows[i][colIdx]?.trim();
    if (v && v !== ".") {
      const n = parseFloat(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Mortgage rate                                                      */
/* ------------------------------------------------------------------ */

async function fetchMortgageRate(): Promise<number | null> {
  try {
    const { rows } = await fetchCsv(`${FRED_CSV}?id=MORTGAGE30US`);
    return latestValue(rows, 1);
  } catch (e) {
    console.error("[fred] mortgage rate fetch failed:", e);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  State HPI                                                          */
/* ------------------------------------------------------------------ */

async function fetchStateHpi(): Promise<Map<StateCode, number | null>> {
  const map = new Map<StateCode, number | null>();

  try {
    // Build a single multi-series request for all 50 states
    const seriesIds = STATE_CODES.map((st) => `${st}STHPI`).join(",");
    const { header, rows } = await fetchCsv(`${FRED_CSV}?id=${seriesIds}`);

    // header: ["DATE", "ALSTHPI", "AKSTHPI", ...]
    for (const st of STATE_CODES) {
      const colName = `${st}STHPI`;
      const colIdx = header.indexOf(colName);
      map.set(st, colIdx === -1 ? null : latestValue(rows, colIdx));
    }
  } catch (e) {
    console.error("[fred] state HPI fetch failed:", e);
    // Fill all states with null on total failure
    for (const st of STATE_CODES) map.set(st, null);
  }

  return map;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface FredData {
  mortgageRate: number | null;
  stateHpi: Map<StateCode, number | null>;
}

export async function fetchFredData(): Promise<FredData> {
  const [mortgageRate, stateHpi] = await Promise.all([
    fetchMortgageRate(),
    fetchStateHpi(),
  ]);
  return { mortgageRate, stateHpi };
}

import { UA, DAY } from "./http";

const BLS_URL = "https://api.bls.gov/publicAPI/v1/timeseries/data/";
const BATCH_SIZE = 25; // BLS v1 limit per request

function seriesId(fips5: string): string {
  return `LAUCN${fips5}0000000003`;
}

function fipsFromSeriesId(sid: string): string {
  // LAUCN{5-digit FIPS}0000000003
  return sid.slice(5, 10);
}

/**
 * Fetch county-level unemployment rates from BLS LAUS.
 * Batches 25 series per POST (BLS v1 limit). No API key needed.
 * Returns a Map keyed by 5-digit FIPS → unemployment rate (%), or null.
 * Cached for a day.
 */
export async function fetchBlsData(
  fipsCodes: string[],
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (fipsCodes.length === 0) return out;

  // Deduplicate FIPS codes
  const unique = [...new Set(fipsCodes)];

  // Split into batches of 25
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    batches.push(unique.slice(i, i + BATCH_SIZE));
  }

  const fetches = batches.map(async (batch) => {
    const seriesIds = batch.map(seriesId);

    try {
      const res = await fetch(BLS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": UA,
        },
        body: JSON.stringify({ seriesid: seriesIds }),
        next: { revalidate: DAY },
      });
      if (!res.ok) return;
      const json = await res.json();

      if (json.status !== "REQUEST_SUCCEEDED") return;

      for (const series of json.Results?.series ?? []) {
        const fips5 = fipsFromSeriesId(series.seriesID);
        let rate: number | null = null;

        // Take the most recent entry with a valid numeric value
        for (const entry of series.data ?? []) {
          if (entry.value != null && entry.value !== "") {
            const n = Number(entry.value);
            if (Number.isFinite(n)) {
              rate = n;
              break;
            }
          }
        }

        out.set(fips5, rate);
      }
    } catch {
      /* leave entries missing; callers handle nulls */
    }
  });

  await Promise.all(fetches);

  // Ensure every requested FIPS has an entry (null if not fetched)
  for (const fips of unique) {
    if (!out.has(fips)) out.set(fips, null);
  }

  return out;
}

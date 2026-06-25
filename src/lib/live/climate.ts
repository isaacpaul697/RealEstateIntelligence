import { unstable_cache } from "next/cache";
import { DAY } from "./http";

/**
 * Open-Meteo Historical Weather API.
 * https://open-meteo.com/en/docs/historical-weather-api
 *
 * Free, no account/key, generous limits. We pull the prior full calendar
 * year of daily data for each campus and reduce it to three climate normals:
 * annual mean temperature (°F), total sunshine (hours), and total
 * precipitation (inches) - a real "what's it like to live here" signal.
 *
 * The archive endpoint accepts comma-separated coordinates and returns an
 * array of per-location objects, so we fetch in coordinate batches rather
 * than one request per campus.
 */

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

export interface Climate {
  avgTempF: number | null;
  sunHours: number | null;
  precipIn: number | null;
}

type Ref = { id: string; lat: number; lng: number };
type Entry = [string, Climate];

interface DailyBlock {
  temperature_2m_mean?: (number | null)[];
  precipitation_sum?: (number | null)[];
  sunshine_duration?: (number | null)[];
}
interface LocationResult {
  daily?: DailyBlock;
}

function priorYear(): { start: string; end: string } {
  const y = new Date().getFullYear() - 1;
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

function avg(xs: (number | null)[] | undefined): number | null {
  if (!xs) return null;
  let sum = 0;
  let n = 0;
  for (const x of xs) {
    if (x != null && Number.isFinite(x)) {
      sum += x;
      n++;
    }
  }
  return n ? sum / n : null;
}

function total(xs: (number | null)[] | undefined): number | null {
  if (!xs) return null;
  let sum = 0;
  let any = false;
  for (const x of xs) {
    if (x != null && Number.isFinite(x)) {
      sum += x;
      any = true;
    }
  }
  return any ? sum : null;
}

function reduce(loc: LocationResult | undefined): Climate {
  const d = loc?.daily;
  const t = avg(d?.temperature_2m_mean);
  const sun = total(d?.sunshine_duration); // seconds
  const precip = total(d?.precipitation_sum); // inches (precipitation_unit=inch)
  return {
    avgTempF: t != null ? Math.round(t) : null,
    sunHours: sun != null ? Math.round(sun / 3600) : null,
    precipIn: precip != null ? Math.round(precip * 10) / 10 : null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Open-Meteo weights each request by location-count × days × variables and
 * throttles (HTTP 429) over ~600 weight/minute. A shared gate spaces request
 * starts ~140ms apart (≈430/min) so a cold fan-out over every campus stays
 * comfortably under the cap.
 */
const MIN_GAP_MS = 140;
let nextSlot = 0;
async function rateGate(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_GAP_MS;
  const wait = slot - now;
  if (wait > 0) await sleep(wait);
}

const MAX_RETRIES = 4;

async function fetchOne(ref: Ref): Promise<Entry | null> {
  const { start, end } = priorYear();
  const url =
    `${ARCHIVE_URL}?latitude=${ref.lat}&longitude=${ref.lng}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_mean,precipitation_sum,sunshine_duration` +
    `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateGate();
    try {
      const res = await fetch(url, { next: { revalidate: DAY } });
      if (res.status === 429 || res.status >= 500) {
        if (attempt < MAX_RETRIES) { await sleep(1500 * 2 ** attempt); continue; }
        return null;
      }
      if (!res.ok) return null;
      const loc = (await res.json()) as LocationResult;
      return [ref.id, reduce(loc)];
    } catch {
      if (attempt < MAX_RETRIES) { await sleep(1500 * 2 ** attempt); continue; }
      return null;
    }
  }
  return null;
}

async function fetchClimateEntries(refs: Ref[]): Promise<Entry[]> {
  const out: Entry[] = [];
  const CONCURRENCY = 4;
  let cursor = 0;
  async function worker() {
    while (cursor < refs.length) {
      const ref = refs[cursor++];
      const result = await fetchOne(ref);
      if (result) out.push(result);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, refs.length) }, worker),
  );
  return out;
}

const cachedClimateEntries = unstable_cache(fetchClimateEntries, ["open-meteo-climate-v3"], {
  revalidate: DAY,
});

export async function fetchClimateData(
  refs: Ref[],
): Promise<Map<string, Climate>> {
  if (refs.length === 0) return new Map();
  const entries = await cachedClimateEntries(refs);
  return new Map(entries);
}

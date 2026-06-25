import { unstable_cache } from "next/cache";
import { DAY } from "./http";

/**
 * HUD USER Fair Market Rents (FMR) API.
 * https://www.huduser.gov/hudapi/public/fmr
 *
 * Gives official, government-published Fair Market Rents per county - the
 * 40th-percentile gross rent HUD uses to set housing-assistance payments.
 * This is a real, live rent benchmark, so markets that have it no longer
 * need the "estimated" rent label.
 *
 * Endpoint is one county per request (county entityId = countyFIPS + "99999"),
 * so we fan out with limited concurrency rather than a single batched query.
 */

const FMR_URL = "https://www.huduser.gov/hudapi/public/fmr/data";

export interface HudFmr {
  /** Fair Market Rents (monthly, USD) by bedroom count. */
  efficiency: number | null;
  oneBed: number | null;
  twoBed: number | null;
  threeBed: number | null;
  fourBed: number | null;
  /** HUD FMR area label (e.g. "Iowa City, IA HUD Metro FMR Area"). */
  areaName: string | null;
  year: string | null;
}

interface FmrRow {
  Efficiency?: number;
  "One-Bedroom"?: number;
  "Two-Bedroom"?: number;
  "Three-Bedroom"?: number;
  "Four-Bedroom"?: number;
  zip_code?: string;
  year?: string;
}

interface FmrResponse {
  data?: {
    area_name?: string;
    year?: string;
    basicdata?: FmrRow | FmrRow[];
  };
  error?: string;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * HUD throttles at roughly 60 requests/minute and returns HTTP 429 over it.
 * A shared gate spaces request *starts* ~1.1s apart across all workers so we
 * stay under the limit on a cold (uncached) fetch.
 */
const MIN_GAP_MS = 1100;
let nextSlot = 0;
async function rateGate(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_GAP_MS;
  const wait = slot - now;
  if (wait > 0) await sleep(wait);
}

/**
 * Small-area metros return `basicdata` as an array of ZIP-level rows with a
 * leading "MSA level" summary row; non-metro counties return a single object.
 * Either way we want the area/county-level figures.
 */
function pickAreaRow(basicdata: FmrRow | FmrRow[] | undefined): FmrRow | null {
  if (!basicdata) return null;
  if (Array.isArray(basicdata)) {
    return (
      basicdata.find((r) => r.zip_code === "MSA level") ?? basicdata[0] ?? null
    );
  }
  return basicdata;
}

const MAX_RETRIES = 4;

async function fetchOne(
  fips: string,
  token: string,
): Promise<[string, HudFmr] | null> {
  const entityId = `${fips}99999`;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateGate();
    try {
      // no-store: we never want a transient 429/5xx cached. Caching happens
      // once, at the assembled-result level, via unstable_cache below.
      const res = await fetch(`${FMR_URL}/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      // Back off and retry on throttle (429) or transient server errors.
      if (res.status === 429 || res.status >= 500) {
        if (attempt < MAX_RETRIES) {
          await sleep(2000 * 2 ** attempt); // 2s, 4s, 8s, 16s
          continue;
        }
        return null;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as FmrResponse;
      if (json.error || !json.data) return null;
      const row = pickAreaRow(json.data.basicdata);
      if (!row) return null;
      return [
        fips,
        {
          efficiency: num(row.Efficiency),
          oneBed: num(row["One-Bedroom"]),
          twoBed: num(row["Two-Bedroom"]),
          threeBed: num(row["Three-Bedroom"]),
          fourBed: num(row["Four-Bedroom"]),
          areaName: json.data.area_name ?? null,
          year: row.year ?? json.data.year ?? null,
        },
      ];
    } catch {
      if (attempt < MAX_RETRIES) {
        await sleep(2000 * 2 ** attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

type Entry = [string, HudFmr];

/**
 * Limited-concurrency fan-out over county FIPS codes. Returns a plain array
 * (not a Map) so the result is serializable by unstable_cache. The shared
 * rateGate keeps us under HUD's ~60/min limit; retries cover the rest.
 */
async function fetchHudEntries(fipsCodes: string[]): Promise<Entry[]> {
  const token = process.env.HUD_API_TOKEN;
  if (!token) return [];

  const unique = Array.from(new Set(fipsCodes.filter(Boolean)));
  if (unique.length === 0) return [];

  const out: Entry[] = [];
  const CONCURRENCY = 6;
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const fips = unique[cursor++];
      const result = await fetchOne(fips, token!);
      if (result) out.push(result);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker),
  );
  return out;
}

/**
 * Caches the assembled FMR set for a day, keyed by the FIPS list. Because the
 * underlying fetches are no-store, a transient 429 is never persisted - only
 * a fully assembled result is cached.
 */
const cachedHudEntries = unstable_cache(fetchHudEntries, ["hud-fmr"], {
  revalidate: DAY,
});

export async function fetchHudData(
  fipsCodes: string[],
): Promise<Map<string, HudFmr>> {
  const entries = await cachedHudEntries(fipsCodes);
  return new Map(entries);
}

/** Sent on every external request, per data-source etiquette. */
export const UA =
  "RealEstateDevIntel/1.0 (real-estate development research; ipaul@fiatwm.com)";

export const DAY = 86400;
export const HALF_DAY = 43200;
export const HOUR = 3600;
export const HALF_HOUR = 1800;

/** Optional Socrata app token raises rate limits; absent = anonymous (fine). */
export const SOCRATA_TOKEN = process.env.SOCRATA_APP_TOKEN || "";

/** Haversine distance in miles. */
export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

/** Parse a possibly-dirty numeric string to a finite number or null. */
export function num(v: unknown): number | null {
  if (v == null || v === "" || v === "-" || v === ".") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Small awaitable delay used to space out fan-out requests. */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Per-process memo cache for expensive aggregations (survives within a server instance). */
const g = globalThis as unknown as { __redCache?: Map<string, { exp: number; v: unknown }> };
const store = (g.__redCache ??= new Map());

export async function memo<T>(
  key: string,
  ttlSec: number,
  fn: () => Promise<T>,
  shouldCache?: (v: T) => boolean,
): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && hit.exp > now) return hit.v as T;
  const v = await fn();
  // Don't poison the cache with transient failures (e.g. an Overpass timeout)
  // — a failed result would otherwise stick for the full TTL.
  if (!shouldCache || shouldCache(v)) store.set(key, { exp: now + ttlSec * 1000, v });
  return v;
}

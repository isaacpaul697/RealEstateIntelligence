export const UA =
  "CampusCapital/1.0 (student-housing acquisitions research; ipaul@fiatwm.com)";

export const DAY = 86400;
export const HALF_DAY = 43200;
export const HALF_HOUR = 1800;

/**
 * Resolve a promise but never wait longer than `ms`; on timeout (or rejection)
 * resolve with `fallback` instead. Live data is best-effort and aggregated from
 * many independent public sources, so one slow or unreachable upstream must
 * never stall the whole request: the missing source shows as unavailable while
 * everything else still loads. Used by getLiveMarkets to cap total latency.
 */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      () => { clearTimeout(timer); resolve(fallback); },
    );
  });
}

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

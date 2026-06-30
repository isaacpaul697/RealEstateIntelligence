import { NextResponse } from "next/server";
import { UNIVERSITIES } from "@/lib/universities";
import { fetchApartments, pickCountyRent } from "@/lib/live/apartments";
import { fetchHudData } from "@/lib/live/hud";
import { fetchCensusData } from "@/lib/live/census";
import { withTimeout } from "@/lib/live/http";
import type { Apartment } from "@/lib/types";

export const dynamic = "force-dynamic"; // too slow for build-time pre-render

const BATCH = 10;
const TTL = 12 * 60 * 60 * 1000; // serve a snapshot without refresh for 12h
// Per-school Overpass budget. The query allows up to 30s server-side; cap each
// call so one slow campus degrades to "no buildings" instead of stalling the
// whole 100-school rebuild.
const PER_SCHOOL_MS = 12_000;
// Bump when the Apartment shape changes so stale cached objects are discarded.
const CACHE_VERSION = 4;

// Use globalThis so the cache (and the in-flight guard) survive Turbopack
// module re-evaluation in dev and are shared across all requests.
const g = globalThis as unknown as {
  __allAptCache?: { data: Record<string, Apartment[]>; ts: number; v?: number };
  __allAptInflight?: Promise<Record<string, Apartment[]>>;
};

function totalApartments(data: Record<string, Apartment[]>): number {
  let n = 0;
  for (const k in data) n += data[k]?.length ?? 0;
  return n;
}

async function buildAll(): Promise<Record<string, Apartment[]>> {
  const out: Record<string, Apartment[]> = {};
  const allFips = UNIVERSITIES.map((u) => u.countyFips);
  const [hud, census] = await Promise.all([
    fetchHudData(allFips),
    fetchCensusData(allFips),
  ]);
  for (let i = 0; i < UNIVERSITIES.length; i += BATCH) {
    const batch = UNIVERSITIES.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((u) =>
        withTimeout(
          fetchApartments(
            u.lat,
            u.lng,
            u.region,
            pickCountyRent(hud.get(u.countyFips), census.get(u.countyFips)),
          ),
          PER_SCHOOL_MS,
          [],
        ),
      ),
    );
    results.forEach((apts, j) => {
      out[batch[j].id] = apts;
    });
  }
  return out;
}

// Single-flight rebuild: concurrent cold callers share one fan-out instead of
// each hammering Overpass for 100 schools. Only caches a non-empty result so a
// total upstream outage doesn't pin a blank snapshot for the full TTL.
function refreshAll(): Promise<Record<string, Apartment[]>> {
  if (g.__allAptInflight) return g.__allAptInflight;
  g.__allAptInflight = (async () => {
    try {
      const data = await buildAll();
      if (totalApartments(data) > 0) g.__allAptCache = { data, ts: Date.now(), v: CACHE_VERSION };
      return data;
    } finally {
      g.__allAptInflight = undefined;
    }
  })();
  return g.__allAptInflight;
}

export async function GET() {
  const cache = g.__allAptCache;
  const valid = cache && cache.v === CACHE_VERSION;
  const fresh = valid && Date.now() - cache!.ts < TTL;

  let data: Record<string, Apartment[]>;
  let fetchedAt: string;
  if (valid) {
    // Stale snapshots are served instantly; a background refresh runs only when
    // the TTL has lapsed so a user never blocks on the slow path twice.
    if (!fresh) void refreshAll();
    data = cache!.data;
    fetchedAt = new Date(cache!.ts).toISOString();
  } else {
    data = await refreshAll();
    fetchedAt = new Date().toISOString();
  }

  return NextResponse.json(
    { apartments: data, fetchedAt },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=43200" } },
  );
}

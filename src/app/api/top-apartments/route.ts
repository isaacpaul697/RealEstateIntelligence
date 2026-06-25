import { NextResponse } from "next/server";
import { UNIVERSITIES } from "@/lib/universities";
import { fetchApartments, pickCountyRent } from "@/lib/live/apartments";
import { fetchHudData } from "@/lib/live/hud";
import { fetchCensusData } from "@/lib/live/census";

export const dynamic = "force-dynamic"; // too slow for build-time pre-render

const BATCH = 10;
const TTL = 12 * 60 * 60 * 1000; // 12 hours
// Bump when the Apartment shape changes so stale cached objects are discarded.
const CACHE_VERSION = 4;

type TaggedApt = Awaited<ReturnType<typeof fetchApartments>>[number] & {
  marketId: string;
  marketName: string;
  marketState: string;
};

// Use globalThis so the cache survives Turbopack module re-evaluation in dev
const g = globalThis as unknown as { __topAptCache?: { data: TaggedApt[]; ts: number; v?: number } };

async function buildNational(): Promise<TaggedApt[]> {
  const all: TaggedApt[] = [];
  const allFips = UNIVERSITIES.map((u) => u.countyFips);
  const [hud, census] = await Promise.all([
    fetchHudData(allFips),
    fetchCensusData(allFips),
  ]);
  for (let i = 0; i < UNIVERSITIES.length; i += BATCH) {
    const batch = UNIVERSITIES.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((u) =>
        fetchApartments(
          u.lat,
          u.lng,
          u.region,
          pickCountyRent(hud.get(u.countyFips), census.get(u.countyFips)),
        ),
      ),
    );
    results.forEach((apts, j) => {
      const u = batch[j];
      for (const apt of apts) {
        all.push({ ...apt, marketId: u.id, marketName: u.shortName, marketState: u.state });
      }
    });
  }
  all.sort((a, b) => b.estAnnualRevenue - a.estAnnualRevenue);
  return all.slice(0, 50);
}

export async function GET() {
  if (g.__topAptCache && g.__topAptCache.v === CACHE_VERSION && Date.now() - g.__topAptCache.ts < TTL) {
    return NextResponse.json({ apartments: g.__topAptCache.data, fetchedAt: new Date(g.__topAptCache.ts).toISOString() });
  }
  const data = await buildNational();
  g.__topAptCache = { data, ts: Date.now(), v: CACHE_VERSION };
  return NextResponse.json({ apartments: data, fetchedAt: new Date().toISOString() });
}

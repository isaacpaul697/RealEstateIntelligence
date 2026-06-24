import { NextResponse } from "next/server";
import { UNIVERSITIES } from "@/lib/universities";
import { fetchApartments } from "@/lib/live/apartments";
import type { Apartment } from "@/lib/types";

export const dynamic = "force-dynamic"; // too slow for build-time pre-render

const BATCH = 10;
const TTL = 12 * 60 * 60 * 1000; // 12 hours

// Use globalThis so the cache survives Turbopack module re-evaluation in dev
const g = globalThis as unknown as { __allAptCache?: { data: Record<string, Apartment[]>; ts: number } };

async function buildAll(): Promise<Record<string, Apartment[]>> {
  const out: Record<string, Apartment[]> = {};
  for (let i = 0; i < UNIVERSITIES.length; i += BATCH) {
    const batch = UNIVERSITIES.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((u) => fetchApartments(u.lat, u.lng, u.region)),
    );
    results.forEach((apts, j) => {
      out[batch[j].id] = apts;
    });
  }
  return out;
}

export async function GET() {
  if (g.__allAptCache && Date.now() - g.__allAptCache.ts < TTL) {
    return NextResponse.json({ apartments: g.__allAptCache.data, fetchedAt: new Date(g.__allAptCache.ts).toISOString() });
  }
  const data = await buildAll();
  g.__allAptCache = { data, ts: Date.now() };
  return NextResponse.json({ apartments: data, fetchedAt: new Date().toISOString() });
}

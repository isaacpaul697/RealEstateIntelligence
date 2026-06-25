import { unstable_cache } from "next/cache";
import { DAY, UA } from "./http";

/**
 * USGS Earthquake Catalog (FDSN web service).
 * https://earthquake.usgs.gov/fdsnws/event/1/
 *
 * Free, no account/key. We use the lightweight `count` method to get the
 * number of magnitude-3.0+ earthquakes within 100 km of each campus over the
 * last 25 years - a real seismic-exposure signal that complements FEMA's
 * composite hazard index.
 *
 * One request per campus; we fan out with limited concurrency.
 */

const COUNT_URL = "https://earthquake.usgs.gov/fdsnws/event/1/count";

type Ref = { id: string; lat: number; lng: number };
type Entry = [string, number];

function startDate(): string {
  const y = new Date().getFullYear() - 25;
  return `${y}-01-01`;
}

async function fetchOne(ref: Ref): Promise<Entry | null> {
  const url =
    `${COUNT_URL}?format=text` +
    `&latitude=${ref.lat}&longitude=${ref.lng}&maxradiuskm=100` +
    `&minmagnitude=3&starttime=${startDate()}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: DAY },
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    const n = parseInt(text, 10);
    if (!Number.isFinite(n)) return null;
    return [ref.id, n];
  } catch {
    return null;
  }
}

async function fetchSeismicEntries(refs: Ref[]): Promise<Entry[]> {
  const out: Entry[] = [];
  const CONCURRENCY = 8;
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

const cachedSeismicEntries = unstable_cache(fetchSeismicEntries, ["usgs-seismic"], {
  revalidate: DAY,
});

export async function fetchSeismicData(
  refs: Ref[],
): Promise<Map<string, number>> {
  if (refs.length === 0) return new Map();
  const entries = await cachedSeismicEntries(refs);
  return new Map(entries);
}

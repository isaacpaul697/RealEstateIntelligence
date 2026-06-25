import { unstable_cache } from "next/cache";
import { DAY, UA } from "./http";

/**
 * Wikipedia REST API - page summary endpoint.
 * https://en.wikipedia.org/api/rest_v1/
 *
 * Free, no account/key. Gives a one-paragraph encyclopedic blurb plus a
 * representative campus photo for each university, which we use to make the
 * market pages and the showcase landing feel real and grounded.
 *
 * One request per page title; we fan out with limited concurrency.
 */

export interface WikiInfo {
  summary: string | null;
  thumb: string | null;
  url: string | null;
}

interface WikiSummaryResponse {
  extract?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

type Ref = { id: string; title: string };
type Entry = [string, WikiInfo];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Many university Wikipedia pages return a seal, crest, logo, or coat of arms
 * as the summary thumbnail instead of a real campus photo. Those are almost
 * always a square graphic on a flat white background, which renders as a jarring
 * "white box" in the campus-photo slot. Reject them so the page falls back to the
 * branded logo tile instead. Real campus photos are raster (.jpg/.jpeg) images.
 */
function isCampusPhoto(url: string | null | undefined): boolean {
  if (!url) return false;
  return !/seal|crest|logo|wordmark|emblem|insignia|coat[_-]?of[_-]?arms|\.svg/i.test(url);
}

async function fetchOne(ref: Ref): Promise<Entry | null> {
  const url =
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ref.title)}` +
    `?redirect=true`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: DAY },
      });
      // Retry transient throttle/server errors; a 404 is a real miss.
      if (res.status === 429 || res.status >= 500) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as WikiSummaryResponse;
      const summary = json.extract?.trim() || null;
      const rawThumb = json.thumbnail?.source ?? json.originalimage?.source ?? null;
      const thumb = isCampusPhoto(rawThumb) ? rawThumb : null;
      const page = json.content_urls?.desktop?.page ?? null;
      if (!summary && !thumb) return null;
      return [ref.id, { summary, thumb, url: page }];
    } catch {
      await sleep(600 * (attempt + 1));
    }
  }
  return null;
}

async function fetchWikiEntries(refs: Ref[]): Promise<Entry[]> {
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

const cachedWikiEntries = unstable_cache(fetchWikiEntries, ["wikipedia-summary-v3"], {
  revalidate: DAY,
});

export async function fetchWikiData(
  refs: Ref[],
): Promise<Map<string, WikiInfo>> {
  if (refs.length === 0) return new Map();
  const entries = await cachedWikiEntries(refs);
  return new Map(entries);
}

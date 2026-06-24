import { NextResponse } from "next/server";
import { UNIVERSITIES } from "@/lib/universities";
import { fetchNews, housingQuery } from "@/lib/live/news";

export const revalidate = 43200; // 12 hours

const BATCH = 20;

export async function GET() {
  const lists: Awaited<ReturnType<typeof fetchNews>>[] = new Array(UNIVERSITIES.length);

  for (let i = 0; i < UNIVERSITIES.length; i += BATCH) {
    const batch = UNIVERSITIES.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((u) => fetchNews(housingQuery(u.shortName), 2)),
    );
    results.forEach((r, j) => { lists[i + j] = r; });
  }

  const merged = UNIVERSITIES.flatMap((u, i) =>
    lists[i].map((a) => ({ ...a, marketId: u.id, marketName: u.shortName, brandColor: u.brandColor })),
  )
    .filter((a) => a.published)
    .sort((a, b) => +new Date(b.published) - +new Date(a.published))
    .slice(0, 30);

  return NextResponse.json({ articles: merged });
}

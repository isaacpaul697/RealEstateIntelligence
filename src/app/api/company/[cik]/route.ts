import { NextResponse } from "next/server";
import { fetchFilings, fetchCompanyProfile } from "@/lib/dev/live/edgar";
import { fetchNews } from "@/lib/live/news";

export const revalidate = 43200; // 12 hours

/**
 * Live company intel for a major-player firm, assembled on demand when a user
 * opens a company in any "major players" view. Everything is live and
 * unfabricated: the profile facts and recent SEC moves come straight from the
 * EDGAR submissions file, and the recent developments / acquisitions feed is a
 * company-scoped Google News query. The firm name is passed through so the news
 * query can be precise; the CIK drives the SEC lookups.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ cik: string }> },
) {
  const { cik } = await params;
  const cikInt = Number(cik);
  if (!Number.isFinite(cikInt) || cikInt <= 0) {
    return NextResponse.json({ error: "invalid cik" }, { status: 400 });
  }

  const name = new URL(req.url).searchParams.get("name")?.trim() || "";
  const newsQuery = name
    ? `"${name}" (acquisition OR development OR construction OR project OR merger OR portfolio OR lease OR earnings)`
    : "";

  const [profile, filings, news] = await Promise.all([
    fetchCompanyProfile(cikInt),
    fetchFilings(cikInt, 12),
    newsQuery ? fetchNews(newsQuery, 8) : Promise.resolve([]),
  ]);

  return NextResponse.json({ cik: cikInt, profile, filings, news });
}

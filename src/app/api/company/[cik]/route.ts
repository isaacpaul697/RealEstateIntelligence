import { NextResponse } from "next/server";
import { fetchFilings, fetchCompanyProfile, fetchCompanyFinancials } from "@/lib/dev/live/edgar";
import { fetchNews } from "@/lib/live/news";

export const revalidate = 43200; // 12 hours

/**
 * Live company intel for a major-player firm, assembled on demand when a user
 * opens a company in any "major players" view. Everything is live and
 * unfabricated: the profile facts, reported financials, and recent SEC moves
 * come straight from EDGAR, and the recent developments / acquisitions feed is
 * a company-scoped Google News query. The firm name is passed through so the
 * news query can be precise; the CIK drives the SEC lookups.
 *
 * Privately-held firms have no SEC registration, so a non-positive CIK is not an
 * error: we skip EDGAR entirely and return the live news feed on its own.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ cik: string }> },
) {
  const { cik } = await params;
  const cikInt = Number(cik);

  const name = new URL(req.url).searchParams.get("name")?.trim() || "";
  const newsQuery = name
    ? `"${name}" (acquisition OR development OR construction OR project OR merger OR portfolio OR lease OR earnings)`
    : "";

  if (!Number.isFinite(cikInt) || cikInt <= 0) {
    const news = newsQuery ? await fetchNews(newsQuery, 8) : [];
    return NextResponse.json({ cik: null, profile: null, filings: [], financials: [], news });
  }

  const [profile, filings, financials, news] = await Promise.all([
    fetchCompanyProfile(cikInt),
    fetchFilings(cikInt, 12),
    fetchCompanyFinancials(cikInt),
    newsQuery ? fetchNews(newsQuery, 8) : Promise.resolve([]),
  ]);

  return NextResponse.json({ cik: cikInt, profile, filings, financials, news });
}

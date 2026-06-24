import { NextResponse } from "next/server";
import { uniById } from "@/lib/universities";
import { fetchApartments } from "@/lib/live/apartments";
import { fetchNews, housingQuery } from "@/lib/live/news";
import { fetchScorecard } from "@/lib/live/scorecard";

export const revalidate = 43200; // 12 hours

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const u = uniById(id);
  if (!u) return NextResponse.json({ error: "unknown market" }, { status: 404 });

  const scores = await fetchScorecard();
  const sc = scores.get(u.scorecardId);
  const lat = sc?.lat ?? u.lat;
  const lng = sc?.lng ?? u.lng;

  const [apartments, articles] = await Promise.all([
    fetchApartments(lat, lng, u.region),
    fetchNews(housingQuery(u.shortName), 12),
  ]);

  return NextResponse.json({ id, lat, lng, apartments, articles });
}

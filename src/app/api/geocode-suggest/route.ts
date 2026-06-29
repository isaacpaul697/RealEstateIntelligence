import { NextResponse } from "next/server";
import { suggestPlaces } from "@/lib/dev/live/nominatim";

export const revalidate = 3600; // 1 hour

/** Typeahead endpoint for the area-search box: GET /api/geocode-suggest?q=boi */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ suggestions: [] });
  const suggestions = await suggestPlaces(q, 6);
  return NextResponse.json({ suggestions });
}

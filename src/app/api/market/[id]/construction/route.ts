import { NextResponse } from "next/server";
import { uniById } from "@/lib/universities";
import { fetchNews } from "@/lib/live/news";

export const revalidate = 43200; // 12 hours

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const school = uniById(id);
  if (!school)
    return NextResponse.json({ error: "unknown market" }, { status: 404 });

  const query =
    `"${school.shortName}" (construction OR "new building" OR "new development" OR "under construction" OR "being built" OR "recently built" OR "student housing development" OR "apartment complex" OR "mixed-use")`;

  const articles = await fetchNews(query, 15);

  return NextResponse.json({ articles });
}

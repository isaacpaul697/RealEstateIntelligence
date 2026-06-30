import { NextResponse } from "next/server";
import { getMarketsSnapshot } from "@/lib/live/markets";

export const dynamic = "force-dynamic"; // too slow to pre-render at build time

export async function GET() {
  // Served from a per-process stale-while-revalidate cache: only the first cold
  // request pays the full aggregation cost, everyone after gets it instantly.
  const { markets, fetchedAt } = await getMarketsSnapshot();
  return NextResponse.json(
    { markets, fetchedAt },
    {
      headers: {
        // Let the browser/CDN reuse the response and refresh in the background.
        "Cache-Control": "public, max-age=300, stale-while-revalidate=43200",
      },
    },
  );
}

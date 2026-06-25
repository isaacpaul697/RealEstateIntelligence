import { NextResponse } from "next/server";
import { getLiveMarkets } from "@/lib/live/markets";

export const dynamic = "force-dynamic"; // too slow for build-time pre-render

export async function GET() {
  const markets = await getLiveMarkets();
  return NextResponse.json({ markets, fetchedAt: new Date().toISOString() });
}

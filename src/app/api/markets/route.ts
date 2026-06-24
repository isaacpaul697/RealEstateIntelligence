import { NextResponse } from "next/server";
import { getLiveMarkets } from "@/lib/live/markets";

export const revalidate = 43200; // 12 hours

export async function GET() {
  const markets = await getLiveMarkets();
  return NextResponse.json({ markets, fetchedAt: new Date().toISOString() });
}

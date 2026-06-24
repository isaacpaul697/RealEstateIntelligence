"use client";

import { useMemo } from "react";
import { useLiveMarkets } from "./live/provider";
import { useSettings } from "./settings";
import { scoreMarket, type Weights } from "./scoring";
import type { LiveMarket, ScoreResult } from "./types";

export interface ScoredMarket {
  market: LiveMarket;
  score: ScoreResult;
}

export function scoreAll(markets: LiveMarket[], weights: Weights): ScoredMarket[] {
  return markets
    .map((market) => ({ market, score: scoreMarket(market, weights) }))
    .sort((a, b) => b.score.score - a.score.score);
}

/** Scored, ranked markets plus live-fetch status. */
export function useScoredMarkets() {
  const { markets, loading, error } = useLiveMarkets();
  const { weights } = useSettings();
  const scored = useMemo(() => scoreAll(markets, weights), [markets, weights]);
  return { scored, loading, error };
}

export function useScoredMarket(id: string) {
  const { scored, loading, error } = useScoredMarkets();
  return { sm: scored.find((s) => s.market.id === id), loading, error };
}

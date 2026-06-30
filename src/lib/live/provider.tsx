"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { LiveMarket } from "../types";

const CACHE_KEY = "cc.cache.markets";
const CACHE_TTL = 24 * 60 * 60 * 1000; // hard expiry: ignore cache older than this
const STALE_AFTER = 30 * 60 * 1000;     // serve instantly, but revalidate after 30m

interface CacheEntry {
  markets: LiveMarket[];
  fetchedAt: string;
  ts: number;
}

function readCache(): CacheEntry | null {
  try {
    // localStorage (not sessionStorage) so returning visitors and new tabs get
    // an instant paint from the last good payload instead of a cold spinner.
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts < CACHE_TTL && entry.markets.length > 0) return entry;
  } catch { /* ignore */ }
  return null;
}

function writeCache(markets: LiveMarket[], fetchedAt: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ markets, fetchedAt, ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

interface LiveData {
  markets: LiveMarket[];
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
}

const Ctx = createContext<LiveData>({
  markets: [],
  loading: true,
  error: null,
  fetchedAt: null,
});

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LiveData>({
    markets: [],
    loading: true,
    error: null,
    fetchedAt: null,
  });

  useEffect(() => {
    let alive = true;

    // Paint cached data immediately when present.
    const cached = readCache();
    if (cached) {
      setState({ markets: cached.markets, loading: false, error: null, fetchedAt: cached.fetchedAt });
      // Still fresh enough: don't hit the network at all.
      if (Date.now() - cached.ts < STALE_AFTER) return () => { alive = false; };
      // Stale: refresh in the background without showing a spinner.
    }

    fetch("/api/markets")
      .then((r) => {
        if (!r.ok) throw new Error(`markets ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        const markets = d.markets ?? [];
        const fetchedAt = d.fetchedAt ?? new Date().toISOString();
        if (markets.length > 0) writeCache(markets, fetchedAt);
        setState({ markets, loading: false, error: null, fetchedAt });
      })
      .catch((e) => {
        if (!alive) return;
        // Keep showing stale cache on a failed background refresh.
        if (cached) return;
        setState({ markets: [], loading: false, error: String(e), fetchedAt: null });
      });
    return () => { alive = false; };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useLiveMarkets = () => useContext(Ctx);

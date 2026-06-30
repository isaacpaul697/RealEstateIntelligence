"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Apartment } from "../types";

const CACHE_KEY = "cc.cache.all-apartments.v4"; // v4: footprint-area unit model
const CACHE_TTL = 24 * 60 * 60 * 1000; // hard expiry: ignore cache older than this
const STALE_AFTER = 30 * 60 * 1000;     // serve instantly, but revalidate after 30m

interface AllApartmentsState {
  byMarket: Record<string, Apartment[]>;
  loading: boolean;
}

interface CacheEntry {
  data: Record<string, Apartment[]>;
  ts: number;
}

function readCache(): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    // localStorage (not sessionStorage) so returning visitors and new tabs get
    // an instant paint from the last good payload instead of a cold spinner.
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts < CACHE_TTL && entry.data && Object.keys(entry.data).length > 0) {
      return entry;
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(data: Record<string, Apartment[]>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded - try removing old per-school caches to make room */
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith("cc.cache.market.")) localStorage.removeItem(k);
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* truly out of space */ }
  }
}

const Ctx = createContext<AllApartmentsState>({ byMarket: {}, loading: true });

export function AllApartmentsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AllApartmentsState>({ byMarket: {}, loading: true });

  useEffect(() => {
    let alive = true;

    // Paint cached data immediately when present.
    const cached = readCache();
    if (cached) {
      setState({ byMarket: cached.data, loading: false });
      // Still fresh enough: don't hit the network at all.
      if (Date.now() - cached.ts < STALE_AFTER) return () => { alive = false; };
      // Stale: refresh in the background without showing a spinner.
    }

    fetch("/api/all-apartments")
      .then((r) => {
        if (!r.ok) throw new Error(`all-apartments ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        const byMarket: Record<string, Apartment[]> = d.apartments ?? {};
        if (Object.keys(byMarket).length > 0) writeCache(byMarket);
        setState({ byMarket, loading: false });
      })
      .catch(() => {
        if (!alive) return;
        // Keep showing stale cache on a failed background refresh.
        setState((s) => ({ ...s, loading: false }));
      });
    return () => { alive = false; };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

/** Pre-loaded apartments for all 100 schools. */
export function useAllApartments() {
  return useContext(Ctx);
}

/** Get apartments for a specific market from the pre-loaded data. */
export function usePreloadedApartments(marketId: string | undefined) {
  const { byMarket, loading } = useAllApartments();
  if (!marketId) return { apartments: [], loading };
  const apts = byMarket[marketId];
  return { apartments: apts ?? [], loading: loading && !apts };
}

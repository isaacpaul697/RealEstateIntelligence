"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Apartment } from "../types";

const CACHE_KEY = "cc.cache.all-apartments";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface AllApartmentsState {
  byMarket: Record<string, Apartment[]>;
  loading: boolean;
}

function readCache(): Record<string, Apartment[]> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts < CACHE_TTL && entry.data && Object.keys(entry.data).length > 0) {
      return entry.data;
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(data: Record<string, Apartment[]>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded - try removing old per-school caches to make room */
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("cc.cache.market.")) sessionStorage.removeItem(k);
      }
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* truly out of space */ }
  }
}

const Ctx = createContext<AllApartmentsState>({ byMarket: {}, loading: true });

export function AllApartmentsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AllApartmentsState>({ byMarket: {}, loading: true });

  useEffect(() => {
    // Try cache first
    const cached = readCache();
    if (cached) {
      setState({ byMarket: cached, loading: false });
      return;
    }

    let alive = true;
    fetch("/api/all-apartments")
      .then((r) => {
        if (!r.ok) throw new Error(`all-apartments ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        const byMarket: Record<string, Apartment[]> = d.apartments ?? {};
        writeCache(byMarket);
        setState({ byMarket, loading: false });
      })
      .catch(() => {
        if (!alive) return;
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

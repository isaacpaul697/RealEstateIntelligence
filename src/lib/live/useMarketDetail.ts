"use client";

import { useEffect, useState } from "react";
import type { Apartment, Article } from "../types";

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface CachedDetail { apartments: Apartment[]; articles: Article[]; ts: number }

function cacheKey(id: string) { return `cc.cache.market.${id}`; }

function readDetailCache(id: string): CachedDetail | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(id));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedDetail;
    if (Date.now() - entry.ts < CACHE_TTL) return entry;
  } catch { /* ignore */ }
  return null;
}

function writeDetailCache(id: string, apartments: Apartment[], articles: Article[]) {
  try {
    sessionStorage.setItem(cacheKey(id), JSON.stringify({ apartments, articles, ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

interface Detail {
  apartments: Apartment[];
  articles: Article[];
  loading: boolean;
}

/** Fetch live apartments + news for one campus. Cached in sessionStorage for 12 hours. */
export function useMarketDetail(id: string | undefined): Detail {
  const [state, setState] = useState<Detail>({ apartments: [], articles: [], loading: true });

  useEffect(() => {
    if (!id) return;
    const cached = readDetailCache(id);
    if (cached) {
      setState({ apartments: cached.apartments, articles: cached.articles, loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/market/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const apartments = d.apartments ?? [];
        const articles = d.articles ?? [];
        writeDetailCache(id, apartments, articles);
        setState({ apartments, articles, loading: false });
      })
      .catch(() => alive && setState({ apartments: [], articles: [], loading: false }));
    return () => { alive = false; };
  }, [id]);

  return state;
}

export function timeAgo(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const mins = Math.floor((Date.now() - d) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

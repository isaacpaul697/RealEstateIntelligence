"use client";

import { useEffect, useState } from "react";
import type { Article } from "../types";

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface CachedConstruction { articles: Article[]; ts: number }

function cacheKey(id: string) { return `cc.cache.construction.${id}`; }

function readCache(id: string): CachedConstruction | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(id));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedConstruction;
    if (Date.now() - entry.ts < CACHE_TTL) return entry;
  } catch { /* ignore */ }
  return null;
}

function writeCache(id: string, articles: Article[]) {
  try {
    sessionStorage.setItem(cacheKey(id), JSON.stringify({ articles, ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

interface ConstructionNews {
  articles: Article[];
  loading: boolean;
}

/** Fetch construction & development news for one campus. Cached in sessionStorage for 12 hours. */
export function useConstructionNews(id: string | undefined): ConstructionNews {
  const [state, setState] = useState<ConstructionNews>({ articles: [], loading: true });

  useEffect(() => {
    if (!id) return;
    const cached = readCache(id);
    if (cached) {
      setState({ articles: cached.articles, loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/market/${id}/construction`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const articles = d.articles ?? [];
        writeCache(id, articles);
        setState({ articles, loading: false });
      })
      .catch(() => alive && setState({ articles: [], loading: false }));
    return () => { alive = false; };
  }, [id]);

  return state;
}

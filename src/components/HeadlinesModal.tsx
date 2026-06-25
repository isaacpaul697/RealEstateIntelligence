"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { timeAgo } from "@/lib/live/useMarketDetail";
import { Logo, Spinner } from "./ui";

interface Props {
  marketId: string;
  marketName: string;
  city: string;
  state: string;
  logo: string | null;
  abbr: string;
  brandColor: string;
  onClose: () => void;
}

const CACHE_TTL = 12 * 60 * 60 * 1000;
const key = (id: string) => `cc.cache.market.${id}`;

/** Reads the same sessionStorage cache the market detail page writes. */
function readCachedArticles(id: string): Article[] | null {
  try {
    const raw = sessionStorage.getItem(key(id));
    if (!raw) return null;
    const entry = JSON.parse(raw) as { articles?: Article[]; ts: number };
    if (Date.now() - entry.ts < CACHE_TTL && entry.articles) return entry.articles;
  } catch { /* ignore */ }
  return null;
}

export function HeadlinesModal({
  marketId, marketName, city, state, logo, abbr, brandColor, onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const cached = readCachedArticles(marketId);
    if (cached) { setArticles(cached); setLoading(false); return; }
    let alive = true;
    fetch(`/api/market/${marketId}`)
      .then((r) => r.json())
      .then((d) => { if (alive) { setArticles(d.articles ?? []); setLoading(false); } })
      .catch(() => { if (alive) { setArticles([]); setLoading(false); } });
    return () => { alive = false; };
  }, [marketId]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px] cc-fade"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Headlines for ${marketName}`}
    >
      <div
        className="w-full max-w-[600px] max-h-[85vh] flex flex-col bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow-lg)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-line">
          <Logo src={logo} abbr={abbr} color={brandColor} size={40} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-ink leading-tight truncate">{marketName}</h2>
            <p className="text-xs text-muted mt-0.5">
              {city}, {state} · student-housing headlines · Google News
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 grid place-items-center rounded-[var(--radius-card)] text-muted hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto nav-scroll px-6">
          {loading ? (
            <Spinner label="Pulling headlines…" />
          ) : !articles || articles.length === 0 ? (
            <div className="text-sm text-muted py-10 text-center">No recent headlines for this market.</div>
          ) : (
            <div className="divide-y divide-line">
              {articles.map((a, i) => (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="block py-3 group">
                  <div className="text-[13px] text-ink-soft group-hover:text-ink leading-snug">{a.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted">{a.source}</span>
                    <span className="text-[11px] text-muted-2 ml-auto">{timeAgo(a.published)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-line flex items-center justify-between">
          <span className="text-[11px] text-muted">
            {articles ? `${articles.length} headlines` : ""}
          </span>
          <Link href={`/market/${marketId}`} className="text-xs font-semibold text-gold-deep hover:underline">
            Open full market →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

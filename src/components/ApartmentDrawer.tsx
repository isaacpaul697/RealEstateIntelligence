"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Apartment } from "@/lib/types";
import { useWatchlist, type SavedApartment } from "@/lib/watchlist";
import { useConstructionNews } from "@/lib/live/useConstructionNews";
import { timeAgo } from "@/lib/live/useMarketDetail";

interface ApartmentDrawerProps {
  apartment: Apartment | null;
  marketId: string;
  marketName: string;
  marketState: string;
  onClose: () => void;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/* ── Notes sub-component ──
   Keyed by aptId so React resets local state when the apartment changes. */
function NotesField({ aptId }: { aptId: string }) {
  const { saved, updateNotes } = useWatchlist();
  const entry = saved.find((a) => a.aptId === aptId);
  const [value, setValue] = useState(entry?.notes ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => updateNotes(aptId, next), 400);
    },
    [aptId, updateNotes],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-muted font-semibold block mb-1.5">
        Notes
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes about this property..."
        rows={4}
        className="w-full bg-surface-2 border border-line rounded-[var(--radius-card)] p-3 text-sm text-ink placeholder:text-muted-2 resize-y focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
      />
    </div>
  );
}

export default function ApartmentDrawer({
  apartment,
  marketId,
  marketName,
  marketState,
  onClose,
}: ApartmentDrawerProps) {
  const { isSaved, toggle } = useWatchlist();
  const { articles, loading: newsLoading } = useConstructionNews(
    apartment ? marketId : undefined,
  );

  const open = apartment !== null;
  const currentlySaved = apartment ? isSaved(apartment.id) : false;

  const handleToggle = useCallback(() => {
    if (!apartment) return;
    const entry: SavedApartment = {
      aptId: apartment.id,
      aptName: apartment.name,
      street: apartment.street,
      marketId,
      marketName,
      marketState,
      estUnits: apartment.estUnits,
      estBeds: apartment.estBeds,
      estAnnualRevenue: apartment.estAnnualRevenue,
      distanceMi: apartment.distanceMi,
      website: apartment.website,
      searchUrl: apartment.searchUrl,
      lat: apartment.lat,
      lng: apartment.lng,
      savedAt: new Date().toISOString(),
      notes: "",
    };
    toggle(entry);
  }, [apartment, marketId, marketName, marketState, toggle]);

  const displayedArticles = articles.slice(0, 8);

  return (
    <div className="fixed inset-0 z-30 overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-surface border-l border-line flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0 shadow-[var(--shadow-lg)] pointer-events-auto" : "translate-x-full shadow-none pointer-events-none"
        }`}
        role="dialog"
        aria-label={apartment ? `Details for ${apartment.name}` : "Apartment detail drawer"}
      >
        {apartment && (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-line">
              <div className="min-w-0">
                <h2 className="font-display text-[20px] font-semibold text-ink leading-tight tracking-tight truncate">
                  {apartment.name}
                </h2>
                {apartment.street && (
                  <p className="text-xs text-muted mt-1 truncate">{apartment.street}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 grid place-items-center rounded-[var(--radius-card)] text-muted hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Close drawer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Watchlist toggle */}
              <button
                onClick={handleToggle}
                className={`w-full text-sm font-semibold py-2.5 px-4 rounded-[var(--radius-card)] border transition-colors ${
                  currentlySaved
                    ? "bg-gold-soft text-gold-deep border-gold/30"
                    : "bg-surface-2 text-ink border-line hover:border-gold/50 hover:text-gold-deep"
                }`}
              >
                {currentlySaved ? "Saved ✓" : "Save to watchlist"}
              </button>

              {/* Key stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-2 border border-line rounded-[var(--radius-card)] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Distance</div>
                  <div className="font-display text-[18px] font-semibold text-ink num leading-none">
                    {apartment.distanceMi.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">mi</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-[var(--radius-card)] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Est. Beds</div>
                  <div className="font-display text-[18px] font-semibold text-ink num leading-none">
                    {apartment.estBeds}
                  </div>
                </div>
                <div className="bg-surface-2 border border-line rounded-[var(--radius-card)] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Annual Rev</div>
                  <div className="font-display text-[18px] font-semibold text-ink num leading-none">
                    {formatMoney(apartment.estAnnualRevenue)}
                  </div>
                </div>
              </div>

              {/* Quick links */}
              {(apartment.website || apartment.searchUrl) && (
                <div>
                  {apartment.website ? (
                    <a
                      href={apartment.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-deep transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5.5 8.5L12 2M12 2H8.5M12 2V5.5M6 3H3.5A1.5 1.5 0 002 4.5v6A1.5 1.5 0 003.5 12h6A1.5 1.5 0 0011 10.5V8" />
                      </svg>
                      Visit website
                    </a>
                  ) : apartment.searchUrl ? (
                    <a
                      href={apartment.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-deep transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="4.25" />
                        <line x1="9" y1="9" x2="12.5" y2="12.5" />
                      </svg>
                      Search on Google
                    </a>
                  ) : null}
                </div>
              )}

              {/* Notes (only when saved) */}
              {currentlySaved && <NotesField key={apartment.id} aptId={apartment.id} />}

              {/* Construction & Development News */}
              <div>
                <h3 className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-3">
                  Construction &amp; Development News
                </h3>
                {newsLoading ? (
                  <div className="flex items-center gap-2 py-4 text-muted">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-line-strong border-t-gold animate-spin" />
                    <span className="text-xs">Loading news...</span>
                  </div>
                ) : displayedArticles.length === 0 ? (
                  <p className="text-xs text-muted py-2">No construction news found.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {displayedArticles.map((article, i) => (
                      <li key={i}>
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <p className="text-sm text-ink leading-snug group-hover:text-gold transition-colors line-clamp-2">
                            {article.title}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {article.source}
                            {article.published && (
                              <span className="ml-1.5 text-muted-2">
                                {timeAgo(article.published)}
                              </span>
                            )}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

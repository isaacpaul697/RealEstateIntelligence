"use client";

import { usePathname } from "next/navigation";
import { useSettings } from "@/lib/settings";
import { useLiveMarkets } from "@/lib/live/provider";

const CRUMBS: Record<string, string> = {
  "": "Home",
  map: "Map View",
  markets: "University Markets",
  market: "Market Detail",
  apartments: "Apartments",
  top10: "Top 10 Markets",
  scorecard: "Acquisition Scorecard",
  watchlist: "Saved Apartments",
  about: "About / Methodology",
  settings: "Settings",
};

export function Topbar() {
  const path = usePathname();
  const { dark, toggleDark } = useSettings();
  const { loading, error } = useLiveMarkets();
  const seg = path.split("/").filter(Boolean)[0] ?? "";
  const crumb = CRUMBS[seg] ?? "Home";

  const status = error ? "error" : loading ? "loading" : "live";
  const statusText = error ? "Live feed error" : loading ? "Fetching live data…" : "Live data";
  const statusTone =
    status === "live" ? "bg-good-soft text-good" : status === "loading" ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad";

  return (
    <header className="no-print sticky top-0 z-20 h-[60px] flex items-center justify-between px-6 md:px-8 border-b border-line backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)" }}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Campus Capital</span>
        <span className="text-muted-2">/</span>
        <span className="text-ink font-medium">{crumb}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusTone}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === "loading" ? "animate-pulse bg-warn" : status === "live" ? "bg-good" : "bg-bad"}`} />
          {statusText}
        </span>
        <button onClick={toggleDark} aria-label="Toggle theme"
          className="grid place-items-center w-9 h-9 rounded-[10px] bg-surface-2 border border-line text-ink-soft hover:text-ink hover:border-line-strong">
          {dark ? (
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={12} cy={12} r={4} /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

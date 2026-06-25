"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSettings } from "@/lib/settings";
import { useLiveMarkets } from "@/lib/live/provider";
import { CITIES } from "@/lib/dev/cities";

type Section = "housing" | "development";

const HOUSING_CRUMBS: Record<string, string> = {
  "": "Home",
  map: "Map View",
  markets: "University Markets",
  market: "Market Detail",
  apartments: "Apartments",
  top10: "Top 10 Markets",
  "top-apartments": "Top 10 Apartments",
  scorecard: "Acquisition Scorecard",
  notes: "Diligence Notes",
  watchlist: "Saved Apartments",
  about: "About / Methodology",
  settings: "Settings",
};

const DEV_CRUMBS: Record<string, string> = {
  "": "National Overview",
  city: "City",
  area: "Area Search",
  developer: "Developer",
  project: "Development",
  methodology: "Methodology",
};

export function Topbar({ section }: { section: Section }) {
  const path = usePathname();
  const { dark, toggleDark } = useSettings();
  const segs = path.split("/").filter(Boolean);
  const sub = segs[1] ?? "";
  const sectionLabel = section === "housing" ? "Student Housing" : "Development";
  const crumb = (section === "housing" ? HOUSING_CRUMBS : DEV_CRUMBS)[sub] ?? sectionLabel;

  return (
    <header className="no-print sticky top-0 z-20 h-[60px] flex items-center justify-between px-6 md:px-8 border-b border-line backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)" }}>
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="text-muted hidden sm:inline">Real Estate Intelligence</span>
        <span className="text-muted-2 hidden sm:inline">/</span>
        <span className="text-muted">{sectionLabel}</span>
        <span className="text-muted-2">/</span>
        <span className="text-ink font-medium truncate">{crumb}</span>
      </div>
      <div className="flex items-center gap-3">
        {section === "housing" ? <HousingStatus /> : <CitySearch />}
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

function HousingStatus() {
  const { loading, error } = useLiveMarkets();
  const status = error ? "error" : loading ? "loading" : "live";
  const statusText = error ? "Live feed error" : loading ? "Fetching live data…" : "Live data";
  const statusTone =
    status === "live" ? "bg-good-soft text-good" : status === "loading" ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad";
  return (
    <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusTone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "loading" ? "animate-pulse bg-warn" : status === "live" ? "bg-good" : "bg-bad"}`} />
      {statusText}
    </span>
  );
}

function CitySearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = q.trim()
    ? CITIES.filter((c) => `${c.name} ${c.state}`.toLowerCase().includes(q.trim().toLowerCase()))
    : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const exact = CITIES.find((c) => c.name.toLowerCase() === q.trim().toLowerCase());
    if (exact) router.push(`/development/city/${exact.id}`);
    else if (matches[0]) router.push(`/development/city/${matches[0].id}`);
    else if (q.trim()) router.push(`/development/area?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="relative hidden md:block">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search a city or area…"
        className="w-56 bg-surface border border-line rounded-full pl-3.5 pr-3 py-1.5 text-[13px] text-ink placeholder:text-muted-2 focus:outline-none focus:border-gold"
      />
      {open && q.trim() && (
        <div className="absolute top-full right-0 mt-1.5 w-full bg-surface border border-line rounded-[var(--radius-sm)] shadow-[var(--shadow-lg)] overflow-hidden z-30">
          {matches.slice(0, 6).map((c) => (
            <button key={c.id} type="button"
              onMouseDown={() => router.push(`/development/city/${c.id}`)}
              className="block w-full text-left px-3.5 py-2 text-[13px] text-ink hover:bg-surface-2">
              {c.name}, {c.state}
            </button>
          ))}
          <button type="button"
            onMouseDown={() => router.push(`/development/area?q=${encodeURIComponent(q.trim())}`)}
            className="block w-full text-left px-3.5 py-2 text-[12px] text-muted hover:bg-surface-2 border-t border-line">
            Explore “{q.trim()}” as an area →
          </button>
        </div>
      )}
    </form>
  );
}

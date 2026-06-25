"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Auth = "API key" | "Token" | "Public";

interface Integration {
  name: string;
  provides: string;
  auth: Auth;
  url: string;
}

/** Every live source the app pulls from. Mirrors the data layer in src/lib/live. */
const INTEGRATIONS: Integration[] = [
  { name: "College Scorecard (IPEDS)", provides: "Enrollment, acceptance, retention, room & board", auth: "API key", url: "https://collegescorecard.ed.gov/data/" },
  { name: "Census ACS 5-Year", provides: "Population, median age, renter %, rent, income", auth: "API key", url: "https://www.census.gov/data/developers/data-sets/acs-5year.html" },
  { name: "Bureau of Labor Statistics", provides: "County unemployment rate (LAUS)", auth: "Public", url: "https://www.bls.gov/lau/" },
  { name: "FRED (Federal Reserve)", provides: "30-yr mortgage rate, state housing price index", auth: "Public", url: "https://fred.stlouisfed.org" },
  { name: "FEMA National Risk Index", provides: "County natural-hazard risk score & rating", auth: "Public", url: "https://hazards.fema.gov/nri/" },
  { name: "HUD USER Fair Market Rents", provides: "Official county Fair Market Rents by bedroom", auth: "Token", url: "https://www.huduser.gov/portal/dataset/fmr-api.html" },
  { name: "Wikipedia REST", provides: "University summaries & campus photos", auth: "Public", url: "https://en.wikipedia.org/api/rest_v1/" },
  { name: "Open-Meteo", provides: "Campus climate normals (temp, sun, precip)", auth: "Public", url: "https://open-meteo.com" },
  { name: "USGS Earthquake Catalog", provides: "Seismic history near campus (M3+/100km)", auth: "Public", url: "https://earthquake.usgs.gov/fdsnws/event/1/" },
  { name: "Google News RSS", provides: "Student-housing & construction headlines", auth: "Public", url: "https://news.google.com" },
  { name: "OpenStreetMap Overpass", provides: "Named apartment buildings near campus", auth: "Public", url: "https://overpass-api.de" },
  { name: "ESPN CDN", provides: "University athletic logos", auth: "Public", url: "https://www.espn.com" },
];

function AuthChip({ auth }: { auth: Auth }) {
  const isPublic = auth === "Public";
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${
        isPublic ? "bg-surface-2 text-muted" : "bg-info-soft text-info"
      }`}
    >
      {auth}
    </span>
  );
}

export function IntegrationsPanel() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left bg-surface-2 hover:bg-gold-soft/50 border border-line transition-colors group"
      >
        <span className="relative flex w-2 h-2 shrink-0">
          <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-good" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink leading-none">Integrations</div>
          <div className="text-[10.5px] text-muted mt-1">{INTEGRATIONS.length} live APIs connected</div>
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-gold-deep transition-colors shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px] cc-fade"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Connected integrations"
        >
          <div
            className="w-full max-w-[560px] max-h-[85vh] flex flex-col bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow-lg)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-line">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-good-soft text-good">
                    <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
                    All systems live
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-ink mt-2">Integrations</h2>
                <p className="text-xs text-muted mt-0.5">
                  Every figure in Campus Capital is pulled from one of these public data sources.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 w-8 h-8 grid place-items-center rounded-[var(--radius-card)] text-muted hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto nav-scroll divide-y divide-line">
              {INTEGRATIONS.map((it) => (
                <a
                  key={it.name}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-surface-2 transition-colors group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink group-hover:text-gold-deep transition-colors">{it.name}</div>
                    <div className="text-xs text-muted truncate">{it.provides}</div>
                  </div>
                  <AuthChip auth={it.auth} />
                </a>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-line text-[11px] text-muted">
              Keys & tokens are stored server-side and never exposed to the browser. Public sources need no auth.
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

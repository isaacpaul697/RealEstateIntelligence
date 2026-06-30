"use client";

import { useEffect, useState } from "react";
import type { SectorCompany } from "@/lib/dev/sectors";
import type { CompanyProfile, Filing } from "@/lib/dev/live/edgar";
import type { Article } from "@/lib/types";
import { fmtDate } from "@/lib/dev/format";
import { FirmLogo } from "./ui";

interface CompanyIntel {
  profile: CompanyProfile | null;
  filings: Filing[];
  news: Article[];
}

/**
 * Slide-in detail for a single major-player firm. Opens when a company card is
 * clicked in any "major players" view, then fetches live intel from the
 * /api/company endpoint: public profile facts and recent SEC moves from EDGAR,
 * plus a company-scoped Google News feed for recent developments and
 * acquisitions. Nothing is fabricated; an empty section simply means the live
 * source returned nothing right now.
 */
export function CompanyDrawer({
  company,
  accent,
  onClose,
}: {
  company: SectorCompany | null;
  accent: string;
  onClose: () => void;
}) {
  const open = company !== null;
  const [intel, setIntel] = useState<CompanyIntel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    setIntel(null);
    setLoading(true);
    fetch(`/api/company/${company.cik}?name=${encodeURIComponent(company.name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: CompanyIntel) => {
        if (!cancelled) setIntel(data);
      })
      .catch(() => {
        if (!cancelled) setIntel({ profile: null, filings: [], news: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const profile = intel?.profile ?? null;
  const facts: { label: string; value: string }[] = [];
  if (profile) {
    const exch = profile.exchanges.filter(Boolean).join(", ");
    if (exch) facts.push({ label: "Listed on", value: exch });
    if (profile.sicDescription) facts.push({ label: "Industry", value: profile.sicDescription });
    if (profile.hq) facts.push({ label: "Headquarters", value: profile.hq });
    if (profile.stateOfIncorporation) facts.push({ label: "Incorporated", value: profile.stateOfIncorporation });
    if (profile.fiscalYearEnd) facts.push({ label: "Fiscal year end", value: profile.fiscalYearEnd });
    if (profile.category) facts.push({ label: "Filer category", value: profile.category });
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden pointer-events-none">
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
        className={`absolute top-0 right-0 bottom-0 w-full sm:w-[440px] bg-surface border-l border-line flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0 shadow-[var(--shadow-lg)] pointer-events-auto" : "translate-x-full shadow-none pointer-events-none"
        }`}
        role="dialog"
        aria-label={company ? `Details for ${company.name}` : "Company detail drawer"}
      >
        {company && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-line">
              <div className="flex items-start gap-3 min-w-0">
                <FirmLogo src={`https://www.google.com/s2/favicons?domain=${company.site}&sz=128`} name={company.name} size={42} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-[19px] font-semibold text-ink leading-tight tracking-tight truncate">
                      {company.name}
                    </h2>
                    <span className="text-[10px] font-semibold num px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: `${accent}1f`, color: accent }}>{company.ticker}</span>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-snug">{company.note}</p>
                </div>
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

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {loading && (
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-line border-t-transparent animate-spin" style={{ borderTopColor: accent }} />
                  Loading live company intel…
                </div>
              )}

              {/* Profile facts */}
              {facts.length > 0 && (
                <section>
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Company profile</div>
                  <div className="grid grid-cols-2 gap-2">
                    {facts.map((f) => (
                      <div key={f.label} className="bg-surface-2 border border-line rounded-[var(--radius-card)] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">{f.label}</div>
                        <div className="text-[13px] font-semibold text-ink mt-0.5 leading-snug">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  {profile?.formerNames && profile.formerNames.length > 0 && (
                    <div className="text-[11px] text-muted-2 mt-2">Formerly {profile.formerNames.slice(0, 2).join("; ")}.</div>
                  )}
                </section>
              )}

              {/* Recent developments & acquisitions (live company news) */}
              <section>
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Recent developments &amp; acquisitions</div>
                {intel && intel.news.length > 0 ? (
                  <div className="flex flex-col divide-y divide-line">
                    {intel.news.map((a) => (
                      <a key={a.link} href={a.link} target="_blank" rel="noopener noreferrer" className="py-2.5 first:pt-0 last:pb-0 group">
                        <div className="text-[13px] text-ink-soft group-hover:text-ink leading-snug">{a.title}</div>
                        <div className="text-[11px] text-muted-2 mt-1 flex items-center gap-1.5">
                          <span className="truncate">{a.source}</span>
                          {a.published && <><span>·</span><span className="num shrink-0">{fmtDate(a.published)}</span></>}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  !loading && <div className="text-[12px] text-muted-2">No recent headlines returned right now.</div>
                )}
              </section>

              {/* Recent SEC moves */}
              <section>
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Recent SEC moves</div>
                {intel && intel.filings.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {intel.filings.map((f) => (
                      <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 text-[12px] group">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-2 border border-line text-muted shrink-0">{f.form}</span>
                          <span className="text-ink-soft truncate group-hover:text-ink">{f.label}</span>
                        </span>
                        <span className="num text-muted-2 shrink-0">{fmtDate(f.date)}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  !loading && <div className="text-[12px] text-muted-2">No recent SEC filings.</div>
                )}
              </section>

              {/* Source links */}
              <div className="pt-1 flex flex-col gap-1.5">
                {profile?.website && (
                  <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[12px] font-semibold hover:underline" style={{ color: accent }}>
                    Company website →
                  </a>
                )}
                <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=&dateb=&owner=include&count=40`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[12px] font-semibold hover:underline" style={{ color: accent }}>
                  All filings on SEC EDGAR →
                </a>
              </div>

              <div className="text-[11px] text-muted-2 leading-snug pt-1">
                Profile and filings are live from SEC EDGAR; headlines are live from Google News. No activity is fabricated.
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CompanyDrawer;

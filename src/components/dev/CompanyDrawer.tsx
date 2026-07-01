"use client";

import { useEffect, useState } from "react";
import type { SectorCompany } from "@/lib/dev/sectors";
import type { CompanyProfile, Filing, CompanyFinancial } from "@/lib/dev/live/edgar";
import type { Article } from "@/lib/types";
import { companyReference } from "@/lib/companyProfiles";
import { fmtDate, fmtCompactUSD, fmtNum } from "@/lib/dev/format";
import { FirmLogo } from "./ui";

interface CompanyIntel {
  profile: CompanyProfile | null;
  filings: Filing[];
  financials: CompanyFinancial[];
  news: Article[];
}

function fmtFinancial(f: CompanyFinancial): string {
  return f.unit === "shares" ? fmtNum(f.value) : fmtCompactUSD(f.value);
}

/**
 * Slide-in detail for a single major-player firm, opened from any "major
 * players" view. It combines a sourced reference profile (what the firm is, its
 * markets, and documented milestones) with live intel from the /api/company
 * endpoint: reported financials and recent SEC moves from EDGAR, plus a
 * company-scoped Google News feed. Nothing is fabricated; hard numbers are
 * either live from SEC filings or, for the one privately-held firm, published
 * figures listed with sources.
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
    // Reset to a loading state before fetching fresh intel for the newly
    // selected firm. This syncs to an external system (the /api/company
    // endpoint), which is the intended use of an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntel(null);
    setLoading(true);
    fetch(`/api/company/${company.cik ?? 0}?name=${encodeURIComponent(company.name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: CompanyIntel) => {
        if (!cancelled) setIntel(data);
      })
      .catch(() => {
        if (!cancelled) setIntel({ profile: null, filings: [], financials: [], news: [] });
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

  const ref = company ? companyReference(company) : undefined;
  const profile = intel?.profile ?? null;
  const isPrivate = company?.cik == null;

  // Identity chips: reference facts, backed up by the live EDGAR profile.
  const chips: string[] = [];
  if (ref?.ownership) chips.push(ref.ownership);
  else if (profile?.exchanges?.length) chips.push(`Listed on ${profile.exchanges.filter(Boolean).join(", ")}`);
  if (ref?.founded) chips.push(`Founded ${ref.founded}`);
  const hq = profile?.hq ?? ref?.headquarters;
  if (hq) chips.push(hq);
  if (profile?.sicDescription) chips.push(profile.sicDescription);

  const financials = intel?.financials ?? [];
  const showLiveFinancials = financials.length > 0;
  const showRefStats = !showLiveFinancials && (ref?.stats?.length ?? 0) > 0;

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
        className={`absolute top-0 right-0 bottom-0 w-full sm:w-[540px] bg-surface border-l border-line flex flex-col transition-transform duration-300 ease-out ${
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
                <FirmLogo src={`https://www.google.com/s2/favicons?domain=${company.site}&sz=128`} name={company.name} size={44} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-[20px] font-semibold text-ink leading-tight tracking-tight">
                      {company.name}
                    </h2>
                    <span className="text-[10px] font-semibold num px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: `${accent}1f`, color: accent }}>
                      {isPrivate ? "PRIVATE" : company.ticker}
                    </span>
                  </div>
                  {ref?.tagline ? (
                    <p className="text-[12.5px] text-ink-soft mt-1 leading-snug">{ref.tagline}</p>
                  ) : (
                    <p className="text-xs text-muted mt-1 leading-snug">{company.note}</p>
                  )}
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

              {/* Identity chips */}
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <span key={c} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-2 border border-line text-muted">{c}</span>
                  ))}
                </div>
              )}

              {/* Financials: live from SEC for public filers, published figures for private */}
              {showLiveFinancials && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] uppercase tracking-wide font-semibold text-muted">Reported financials</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-good-soft text-good">
                      <span className="w-1.5 h-1.5 rounded-full bg-good" />live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {financials.map((f) => (
                      <div key={f.label} className="bg-surface-2 border border-line rounded-[var(--radius-card)] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">{f.label}</div>
                        <div className="font-display text-[17px] font-semibold text-ink num mt-0.5 leading-none">{fmtFinancial(f)}</div>
                        <div className="text-[10px] text-muted-2 num mt-1">{f.period}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-2 mt-2">Values as reported to the SEC via EDGAR XBRL company facts.</div>
                </section>
              )}
              {showRefStats && (
                <section>
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Published figures</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ref!.stats!.map((s) => (
                      <div key={s.label} className="bg-surface-2 border border-line rounded-[var(--radius-card)] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">{s.label}</div>
                        <div className="font-display text-[17px] font-semibold text-ink num mt-0.5 leading-none">{s.value}</div>
                        {s.sub && <div className="text-[10px] text-muted-2 mt-1 leading-snug">{s.sub}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Overview */}
              {ref?.overview && ref.overview.length > 0 && (
                <section>
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Overview</div>
                  <div className="flex flex-col gap-2">
                    {ref.overview.map((p, i) => (
                      <p key={i} className="text-[13px] text-ink-soft leading-relaxed">{p}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Highlights */}
              {ref?.highlights && ref.highlights.length > 0 && (
                <section>
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Portfolio &amp; strategy</div>
                  <ul className="flex flex-col gap-2">
                    {ref.highlights.map((h, i) => (
                      <li key={i} className="text-[13px] text-ink-soft leading-snug flex gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Milestones */}
              {ref?.milestones && ref.milestones.length > 0 && (
                <section>
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">Milestones</div>
                  <div className="flex flex-col">
                    {ref.milestones.map((m, i) => (
                      <div key={m.year + m.title} className="flex gap-3">
                        <span className="font-display text-[12px] font-semibold num shrink-0 w-[38px] text-right pt-0.5" style={{ color: accent }}>{m.year}</span>
                        <div className="flex flex-col items-center">
                          <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: accent }} />
                          {i < ref.milestones!.length - 1 && <span className="w-px flex-1 my-1" style={{ background: "var(--line)" }} />}
                        </div>
                        <div className={`min-w-0 ${i < ref.milestones!.length - 1 ? "pb-3" : ""}`}>
                          <div className="text-[13px] font-semibold text-ink leading-snug">{m.title}</div>
                          <div className="text-[12px] text-muted mt-0.5 leading-snug">{m.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
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

              {/* Recent SEC moves (public filers only) */}
              {!isPrivate && (
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
              )}

              {/* Source links */}
              <div className="pt-1 flex flex-col gap-1.5">
                {ref?.sources?.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] font-semibold hover:underline" style={{ color: accent }}>
                    {s.label} →
                  </a>
                ))}
                <a href={profile?.website
                    ? (profile.website.startsWith("http") ? profile.website : `https://${profile.website}`)
                    : `https://${company.site}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[12px] font-semibold hover:underline" style={{ color: accent }}>
                  Company website →
                </a>
                {!isPrivate && (
                  <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=&dateb=&owner=include&count=40`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[12px] font-semibold hover:underline" style={{ color: accent }}>
                    All filings on SEC EDGAR →
                  </a>
                )}
              </div>

              <div className="text-[11px] text-muted-2 leading-snug pt-1">
                {isPrivate
                  ? "Greystar is privately held and does not file with the SEC. The figures shown are published reference facts (company disclosures and NMHC rankings); the headlines are live from Google News. Nothing is modeled or fabricated."
                  : "The profile and markets are reference facts; financials and filings are live from SEC EDGAR and headlines are live from Google News. No activity is fabricated."}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CompanyDrawer;

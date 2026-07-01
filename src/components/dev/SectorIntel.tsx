"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";
import type { SectorCompany } from "@/lib/dev/sectors";
import type { Filing } from "@/lib/dev/live/edgar";
import { fmtDate } from "@/lib/dev/format";
import { Card, SectionTitle, FirmLogo } from "./ui";
import { CompanyDrawer } from "./CompanyDrawer";
import { PlayersActivityGraphic } from "./PlayersActivityGraphic";

export interface PlayerRow {
  company: SectorCompany;
  filings: Filing[];
}

/**
 * Major operators in the asset class, each with their latest live SEC filings.
 * A live filing-activity graphic sits on top, and every firm card is clickable
 * to open a drawer with the company's live profile, recent SEC moves, and a
 * company-scoped developments / acquisitions news feed.
 */
export function SectorPlayers({
  rows,
  intro,
  accent,
  label = "Sector",
}: {
  rows: PlayerRow[];
  intro: string;
  accent: string;
  label?: string;
}) {
  const [selected, setSelected] = useState<SectorCompany | null>(null);
  if (!rows.length) return null;
  return (
    <>
      <PlayersActivityGraphic rows={rows} accent={accent} label={label} />

      <Card>
        <SectionTitle sub={intro}>Major players &amp; recent moves</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map(({ company, filings }) => (
            <button
              key={company.ticker + company.cik}
              type="button"
              onClick={() => setSelected(company)}
              className="text-left bg-surface-2 border border-line rounded-[var(--radius-card)] p-4 transition-all hover:border-line-strong hover:shadow-[var(--shadow)] focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": `${accent}66` } as React.CSSProperties}
            >
              <div className="flex items-start gap-3">
                <FirmLogo src={`https://www.google.com/s2/favicons?domain=${company.site}&sz=128`} name={company.name} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-semibold text-ink truncate">{company.name}</span>
                    <span className="text-[10px] font-semibold num px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: `${accent}1f`, color: accent }}>{company.ticker}</span>
                  </div>
                  <div className="text-[12px] text-muted mt-0.5 leading-snug">{company.note}</div>
                </div>
                <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 opacity-70">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>

              <div className="mt-3 pt-3 border-t border-line flex flex-col gap-1.5">
                {filings.length > 0 ? (
                  filings.map((f) => (
                    <div key={f.url} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface border border-line text-muted shrink-0">{f.form}</span>
                        <span className="text-ink-soft truncate">{f.label}</span>
                      </span>
                      <span className="num text-muted-2 shrink-0">{fmtDate(f.date)}</span>
                    </div>
                  ))
                ) : company.cik == null ? (
                  <span className="text-[12px] text-muted-2">Privately held, no SEC filings. Open for the full profile.</span>
                ) : (
                  <span className="text-[12px] text-muted-2">No recent SEC filings.</span>
                )}
              </div>

              <div className="mt-3 text-[11px] font-semibold" style={{ color: accent }}>View profile &amp; moves →</div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-2">
          Filings pulled live from SEC EDGAR. Company list is a fixed reference of major public operators; no activity is fabricated.
        </div>
      </Card>

      <CompanyDrawer company={selected} accent={accent} onClose={() => setSelected(null)} />
    </>
  );
}

/** Live sector news headlines from Google News RSS. */
export function SectorNews({ articles, label }: { articles: Article[]; label: string }) {
  return (
    <Card>
      <SectionTitle sub="Live headlines from Google News, refreshed twice daily">{label} news</SectionTitle>
      {articles.length > 0 ? (
        <div className="flex flex-col divide-y divide-line">
          {articles.map((a) => (
            <a key={a.link} href={a.link} target="_blank" rel="noopener noreferrer"
              className="py-2.5 first:pt-0 last:pb-0 group">
              <div className="text-[13.5px] text-ink-soft group-hover:text-ink leading-snug">{a.title}</div>
              <div className="text-[11px] text-muted-2 mt-1 flex items-center gap-1.5">
                <span className="truncate">{a.source}</span>
                {a.published && <><span>·</span><span className="num shrink-0">{fmtDate(a.published)}</span></>}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-muted">No headlines returned right now. The news feed will repopulate shortly.</div>
      )}
    </Card>
  );
}

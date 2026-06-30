"use client";

import type { PlayerRow } from "./SectorIntel";
import { Card } from "./ui";
import { fmtDate } from "@/lib/dev/format";

/**
 * Live filing-activity graphic shown on every "major players" view. It is built
 * entirely from the SEC filings already fetched live for the roster: a bar for
 * each firm sized by its count of recent material filings, plus headline chips
 * (firms tracked, recent filings, latest move). The bars animate up via the
 * shared cc-build-floor rise. Purely presentational; every figure is live.
 */
export function PlayersActivityGraphic({
  rows,
  accent,
  label,
}: {
  rows: PlayerRow[];
  accent: string;
  label: string;
}) {
  if (!rows.length) return null;

  const counts = rows.map((r) => ({
    name: r.company.name,
    ticker: r.company.ticker,
    count: r.filings.length,
  }));
  const totalFilings = counts.reduce((s, c) => s + c.count, 0);
  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  // Most recent filing date across the whole roster (live "last move").
  let latest: string | null = null;
  for (const r of rows) {
    for (const f of r.filings) {
      if (!latest || f.date > latest) latest = f.date;
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted">{label} filing activity</div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-good" />
          </span>
          Live SEC EDGAR
        </span>
      </div>

      {/* headline chips */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Chip label="Firms tracked" value={String(rows.length)} />
        <Chip label="Recent filings" value={String(totalFilings)} accent={accent} />
        <Chip label="Latest move" value={latest ? fmtDate(latest) : "n/a"} />
      </div>

      {/* per-firm filing bars */}
      <div className="mt-4 flex flex-col gap-2">
        {counts.map((c, i) => (
          <div key={c.ticker + i} className="flex items-center gap-3">
            <div className="w-[88px] shrink-0 text-[12px] font-semibold text-ink-soft truncate" title={c.name}>{c.ticker}</div>
            <div className="flex-1 h-3.5 rounded-full bg-surface-2 border border-line overflow-hidden">
              <div
                className="cc-bar-grow h-full rounded-full"
                style={{
                  width: `${Math.round((c.count / maxCount) * 100)}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 60%, white), ${accent})`,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            </div>
            <div className="w-5 shrink-0 text-right text-[12px] font-semibold num text-muted">{c.count}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-muted-2 leading-snug">
        Bars show each firm&apos;s count of recent material SEC filings (events, results, offerings),
        pulled live from EDGAR. Click any firm below for its full profile and recent moves.
      </div>
    </Card>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface-2 border border-line px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">{label}</div>
      <div className="text-[15px] font-semibold mt-0.5 num" style={accent ? { color: accent } : { color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

export default PlayersActivityGraphic;

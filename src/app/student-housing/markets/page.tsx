"use client";

import { useState } from "react";
import Link from "next/link";
import { useScoredMarkets } from "@/lib/compute";
import { Card, LabelChip, Logo, Spinner, StateBlock } from "@/components/ui";
import { HeadlinesModal } from "@/components/HeadlinesModal";
import { fmtNum, fmtPct } from "@/lib/scoring";
import { usePersistedState } from "@/lib/usePersistedState";
import type { LiveMarket } from "@/lib/types";

type SortKey = "score" | "enrollmentGrowth" | "rent" | "enrollment" | "news";

export default function MarketsPage() {
  const { scored, loading, error } = useScoredMarkets();
  const [sort, setSort] = usePersistedState<SortKey>("cc.markets.sort", "score");
  const [q, setQ] = useState("");
  const [headlinesFor, setHeadlinesFor] = useState<LiveMarket | null>(null);

  const rows = scored
    .filter((m) => m.market.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case "enrollmentGrowth": return (b.market.enrollmentGrowth ?? -99) - (a.market.enrollmentGrowth ?? -99);
        case "rent": return b.market.estRentGrowth - a.market.estRentGrowth;
        case "enrollment": return (b.market.enrollment ?? 0) - (a.market.enrollment ?? 0);
        case "news": return b.market.newsCount - a.market.newsCount;
        default: return b.score.score - a.score.score;
      }
    });

  const Th = ({ k, children, num }: { k?: SortKey; children: React.ReactNode; num?: boolean }) => (
    <th
      className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted ${num ? "text-right" : "text-left"} ${k ? "cursor-pointer hover:text-ink select-none" : ""}`}
      onClick={k ? () => setSort(k) : undefined}
    >
      {children}{k === sort ? " ↓" : ""}
    </th>
  );

  return (
    <div className="cc-fade">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">University Markets</h1>
          <p className="text-sm text-muted mt-1">
            {scored.length} markets screened on live data · click any row for the deep-dive, or a headline count to read them.
          </p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter markets…"
          className="h-10 px-4 rounded-full bg-surface border border-line text-sm text-ink w-60 outline-none focus:border-line-strong" />
      </div>

      {loading ? <Spinner /> : error ? <StateBlock title="Live feed unavailable" note="Could not reach the data sources. Refresh to retry." /> : (
        <Card pad={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>Market</Th>
                  <Th k="enrollment" num>Enrollment</Th>
                  <Th k="enrollmentGrowth" num>Growth/yr</Th>
                  <Th num>Accept.</Th>
                  <Th k="rent" num>Rent ▲ (est)</Th>
                  <Th k="news" num>Headlines</Th>
                  <Th>Signal</Th>
                  <Th k="score" num>Score</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.market.id} className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-3 py-3">
                      <Link href={`/student-housing/market/${m.market.id}`} className="flex items-center gap-3">
                        <Logo src={m.market.logo} abbr={m.market.abbr} color={m.market.brandColor} size={34} />
                        <span>
                          <span className="block font-medium text-ink">{m.market.shortName}</span>
                          <span className="block text-xs text-muted">{m.market.city}, {m.market.state} · {m.market.conference}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right num text-ink-soft">{m.market.enrollment != null ? fmtNum(m.market.enrollment) : "n/a"}</td>
                    <td className="px-3 py-3 text-right num text-good">{m.market.enrollmentGrowth != null ? `+${fmtPct(m.market.enrollmentGrowth)}` : "n/a"}</td>
                    <td className="px-3 py-3 text-right num text-ink-soft">{m.market.acceptanceRate != null ? `${m.market.acceptanceRate.toFixed(0)}%` : "n/a"}</td>
                    <td className="px-3 py-3 text-right num text-ink-soft">+{fmtPct(m.market.estRentGrowth)}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setHeadlinesFor(m.market)}
                        disabled={m.market.newsCount === 0}
                        title={m.market.newsCount === 0 ? "No recent headlines" : `View ${m.market.newsCount} headlines`}
                        className="num font-medium text-info hover:text-gold-deep disabled:text-muted-2 disabled:cursor-default inline-flex items-center gap-1 transition-colors"
                      >
                        {m.market.newsCount}
                        {m.market.newsCount > 0 && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3"><LabelChip label={m.score.label} /></td>
                    <td className="px-3 py-3 text-right"><span className="font-display font-semibold text-ink num text-lg">{m.score.score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {headlinesFor && (
        <HeadlinesModal
          marketId={headlinesFor.id}
          marketName={headlinesFor.shortName}
          city={headlinesFor.city}
          state={headlinesFor.state}
          logo={headlinesFor.logo}
          abbr={headlinesFor.abbr}
          brandColor={headlinesFor.brandColor}
          onClose={() => setHeadlinesFor(null)}
        />
      )}
    </div>
  );
}

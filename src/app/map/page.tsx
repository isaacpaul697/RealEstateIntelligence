"use client";

import { useState } from "react";
import Link from "next/link";
import { useScoredMarkets } from "@/lib/compute";
import { CampusMap } from "@/components/CampusMap";
import { Card, LabelChip, Logo, Spinner, StateBlock } from "@/components/ui";
import { fmtPct } from "@/lib/scoring";

export default function MapPage() {
  const { scored, loading, error } = useScoredMarkets();
  const [region, setRegion] = useState<string>("All");
  const [minScore, setMinScore] = useState(0);

  const regions = ["All", "Midwest", "South", "West", "Northeast"];
  const markets = scored.filter(
    (m) => (region === "All" || m.market.region === region) && m.score.score >= minScore,
  );

  return (
    <div className="cc-fade">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Map View</h1>
        <p className="text-sm text-muted mt-1">
          Demand hotspots across tracked student-housing markets. Click any campus to reveal nearby apartments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-9 px-3 rounded-full bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong"
        >
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          Min score
          <input type="range" min={0} max={90} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="w-28" />
          <span className="num text-ink w-6">{minScore}</span>
        </label>
        <span className="text-xs text-muted ml-auto">{markets.length} markets shown</span>
      </div>

      {loading ? <Spinner /> : error ? <StateBlock title="Live feed unavailable" note="Could not reach the data source. Try refreshing." /> : (
        <Card pad={false} className="overflow-hidden">
          <div className="p-3">
            <CampusMap markets={markets} height={540} />
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {markets.map((m) => (
            <Link key={m.market.id} href={`/market/${m.market.id}`}>
              <Card className="hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-3">
                  <Logo src={m.market.logo} abbr={m.market.abbr} color={m.market.brandColor} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink truncate">{m.market.shortName}</div>
                    <div className="text-xs text-muted">{m.market.city}, {m.market.state}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold text-ink num">{m.score.score}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <LabelChip label={m.score.label} />
                  <span className="text-xs text-muted num">+{fmtPct(m.market.estRentGrowth)} rent (est)</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

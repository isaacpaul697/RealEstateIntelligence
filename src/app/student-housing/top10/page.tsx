"use client";

import Link from "next/link";
import { useScoredMarkets } from "@/lib/compute";
import { Card, LabelChip, Logo, Spinner, StateBlock } from "@/components/ui";
import { ScoreRing } from "@/components/charts";
import { fmtNum, fmtPct } from "@/lib/scoring";

export default function Top10Page() {
  const { scored, loading, error } = useScoredMarkets();
  const top = scored.slice(0, 10);

  const reason = (m: (typeof top)[number]) => {
    const bits: string[] = [];
    if (m.market.enrollmentGrowth != null && m.market.enrollmentGrowth >= 2) bits.push(`${fmtPct(m.market.enrollmentGrowth)} enrollment growth`);
    if (m.market.acceptanceRate != null && m.market.acceptanceRate < 50) bits.push(`${m.market.acceptanceRate.toFixed(0)}% acceptance rate (selective)`);
    if (m.market.newsCount >= 8) bits.push(`${m.market.newsCount} recent housing headlines`);
    if (m.market.estRentGrowth >= 5) bits.push(`~${fmtPct(m.market.estRentGrowth)} rent growth (est.)`);
    if (!bits.length) bits.push("balanced fundamentals with moderate demand signals");
    return bits.slice(0, 2).join(" · ");
  };

  if (loading) return <Spinner />;
  if (error) return <StateBlock title="Live feed unavailable" note="Could not reach the data source. Try refreshing." />;

  return (
    <div className="cc-fade max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Top 10 Student Housing Markets</h1>
        <p className="text-sm text-muted mt-1">Ranked by the weighted acquisition score. Adjust the model weights in Settings to re-rank.</p>
      </div>

      <div className="flex flex-col gap-3">
        {top.map((m, i) => (
          <Link key={m.market.id} href={`/student-housing/market/${m.market.id}`}>
            <Card className="flex items-center gap-5 hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all">
              <div className="font-display text-3xl font-semibold text-muted-2 num w-10 text-center">{i + 1}</div>
              <Logo src={m.market.logo} abbr={m.market.abbr} color={m.market.brandColor} size={50} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink text-[15px]">{m.market.shortName}</span>
                  <LabelChip label={m.score.label} />
                </div>
                <div className="text-xs text-muted mt-0.5">{m.market.city}, {m.market.state} · {m.market.conference} · {m.market.enrollment != null ? fmtNum(m.market.enrollment) + " students" : ""}</div>
                <div className="text-[13px] text-ink-soft mt-1.5">Why it ranks: {reason(m)}</div>
              </div>
              <ScoreRing score={m.score.score} size={72} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

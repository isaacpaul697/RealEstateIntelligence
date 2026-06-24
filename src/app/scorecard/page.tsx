"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useScoredMarkets } from "@/lib/compute";
import { Card, LabelChip, SectionTitle, ProvenanceTag, Logo, Spinner, StateBlock } from "@/components/ui";
import { ScoreRing, FactorBars } from "@/components/charts";
import { fmtNum, fmtPct } from "@/lib/scoring";
import { usePersistedState } from "@/lib/usePersistedState";

function ScorecardInner() {
  const { scored, loading, error } = useScoredMarkets();
  const qp = useSearchParams().get("market");
  const [sel, setSel] = usePersistedState<string>("cc.sel.scorecard", "");

  useEffect(() => {
    if (qp) setSel(qp);
  }, [qp, setSel]);

  if (loading) return <Spinner />;
  if (error || scored.length === 0) return <StateBlock title="Live feed unavailable" note="Could not load market data. Try refreshing." />;

  const active = sel || scored[0]?.market.id;
  const sm = scored.find((m) => m.market.id === active) ?? scored[0];
  const m = sm.market;

  const recommendation =
    sm.score.label === "Strong Buy Signal"
      ? "Advance to underwriting. Fundamentals support an aggressive acquisition posture."
      : sm.score.label === "Watchlist"
      ? "Hold on a watchlist. Monitor rent and occupancy for an entry point."
      : sm.score.label === "Needs More Diligence"
      ? "Gather additional diligence before committing capital."
      : "Pass for now. Demand and pricing do not support entry.";

  return (
    <div className="cc-fade max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6 no-print flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Acquisition Scorecard</h1>
          <p className="text-sm text-muted mt-1">Investment-committee one-pager. Print or export to PDF.</p>
        </div>
        <div className="flex gap-2">
          <select value={active} onChange={(e) => setSel(e.target.value)} className="h-10 px-3 rounded-full bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong">
            {scored.map((x) => <option key={x.market.id} value={x.market.id}>{x.market.shortName}</option>)}
          </select>
          <button onClick={() => window.print()} className="px-5 h-10 rounded-full text-sm font-semibold text-white" style={{ background: "var(--gold)" }}>
            Export PDF
          </button>
        </div>
      </div>

      <Card className="print-full">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Logo src={m.logo} abbr={m.abbr} color={m.brandColor} size={48} />
            <div>
              <div className="font-display text-lg font-semibold text-ink">{m.name}</div>
              <div className="text-xs text-muted">{m.city}, {m.state} · {m.conference} · {m.region} region</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted font-display font-semibold">Campus Capital</div>
            <div className="text-[11px] text-muted">Student Housing Acquisitions IQ</div>
            <div className="flex gap-1.5 mt-1 justify-end">
              <ProvenanceTag p="live" />
              <ProvenanceTag p="estimated" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center">
            <ScoreRing score={sm.score.score} size={150} />
            <div className="mt-3"><LabelChip label={sm.score.label} /></div>
          </div>
          <div className="md:col-span-2">
            <SectionTitle>Investment thesis</SectionTitle>
            <p className="text-sm text-ink-soft leading-relaxed">
              {m.shortName} enrolls {m.enrollment != null ? fmtNum(m.enrollment) : "an undisclosed number of"} students
              {m.enrollmentGrowth != null ? ` and is growing ${fmtPct(m.enrollmentGrowth)} year over year` : ""}.
              {m.acceptanceRate != null ? ` The ${m.acceptanceRate.toFixed(0)}% acceptance rate ${m.acceptanceRate < 50 ? "signals selectivity, concentrating demand" : "indicates broad access, driving volume"}.` : ""}
              {` Estimated rent growth is ~${fmtPct(m.estRentGrowth)}, modeled from enrollment trends and admissions selectivity.`}
              {` ${m.newsCount} recent news articles reference student housing in the area.`}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
              <Fact label="Enrollment" value={m.enrollment != null ? fmtNum(m.enrollment) : "—"} />
              <Fact label="Enrollment growth" value={m.enrollmentGrowth != null ? `+${fmtPct(m.enrollmentGrowth)}` : "—"} />
              <Fact label="Acceptance rate" value={m.acceptanceRate != null ? `${m.acceptanceRate.toFixed(0)}%` : "—"} />
              <Fact label="Est. rent growth" value={`~${fmtPct(m.estRentGrowth)}`} />
              <Fact label="Est. occupancy" value={`~${(m.estOccupancy * 100).toFixed(0)}%`} />
              <Fact label="Housing headlines" value={String(m.newsCount)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <SectionTitle sub="Weighted factors">Score composition</SectionTitle>
            <FactorBars factors={sm.score.factors} />
          </div>
          <div>
            <SectionTitle>Key considerations</SectionTitle>
            <ul className="text-sm text-ink-soft space-y-2 list-disc pl-4">
              {m.acceptanceRate != null && m.acceptanceRate > 70 && (
                <li>High acceptance rate — enrollment is volume-driven and sensitive to demographic shifts.</li>
              )}
              {m.acceptanceRate != null && m.acceptanceRate <= 70 && (
                <li>Selective admissions ({m.acceptanceRate.toFixed(0)}%) — strong demand fundamentals but capped freshman growth.</li>
              )}
              <li>Rent growth and occupancy figures are estimated from enrollment trends — actual figures require local market research.</li>
              <li>{m.newsCount >= 5 ? `Strong news coverage (${m.newsCount} recent headlines) suggests active market attention.` : `Limited news coverage (${m.newsCount} headlines) — market may be under the radar.`}</li>
            </ul>
            <SectionTitle>Recommendation</SectionTitle>
            <p className="text-sm font-medium text-ink">{recommendation}</p>
          </div>
        </div>
        <div className="text-[10px] text-muted mt-6 pt-4 border-t border-line">
          Generated by Campus Capital · live data from College Scorecard, Google News, and OpenStreetMap · estimated figures modeled from live inputs · not investment advice.
        </div>
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-1">
      <span className="text-muted">{label}</span>
      <span className="text-ink font-semibold num">{value}</span>
    </div>
  );
}

export default function ScorecardPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ScorecardInner />
    </Suspense>
  );
}

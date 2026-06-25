"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useScoredMarkets } from "@/lib/compute";
import { usePreloadedApartments } from "@/lib/live/allApartments";
import { Card, LabelChip, SectionTitle, ProvenanceTag, Logo, Spinner, StateBlock } from "@/components/ui";
import { ScoreRing, FactorBars } from "@/components/charts";
import { fmtNum, fmtPct, fmtMoney } from "@/lib/scoring";
import { usePersistedState } from "@/lib/usePersistedState";

function ScorecardInner() {
  const { scored, loading, error } = useScoredMarkets();
  const qp = useSearchParams().get("market");
  const [sel, setSel] = usePersistedState<string>("cc.sel.scorecard", "");
  // Apartments chosen per school, kept in session memory (cleared on refresh).
  const [aptSel, setAptSel] = usePersistedState<Record<string, string[]>>("cc.sel.scorecard.apts", {});
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);

  // Default the selection to the first school once data loads, and honor ?market=.
  useEffect(() => {
    if (qp) { setSel(qp); return; }
    if (!sel && scored.length > 0) setSel(scored[0].market.id);
  }, [qp, sel, scored, setSel]);

  const active = sel || scored[0]?.market.id;
  const { apartments, loading: aptLoading } = usePreloadedApartments(active);

  const selectedIds = useMemo(() => aptSel[active] ?? [], [aptSel, active]);
  const selectedApts = useMemo(
    () => apartments.filter((a) => selectedIds.includes(a.id)),
    [apartments, selectedIds],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scored;
    return scored.filter((x) => {
      const mk = x.market;
      return (
        mk.name.toLowerCase().includes(q) ||
        mk.shortName.toLowerCase().includes(q) ||
        mk.city.toLowerCase().includes(q) ||
        mk.state.toLowerCase().includes(q)
      );
    });
  }, [scored, query]);

  if (loading) return <Spinner />;
  if (error || scored.length === 0) return <StateBlock title="Live feed unavailable" note="Could not load market data. Try refreshing." />;

  const sm = scored.find((m) => m.market.id === active) ?? scored[0];
  const m = sm.market;

  function pickSchool(id: string) {
    setSel(id);
    setPicking(false);
    setQuery("");
  }

  function toggleApt(id: string) {
    const current = aptSel[active] ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setAptSel({ ...aptSel, [active]: next });
  }

  function setAllApts(ids: string[]) {
    setAptSel({ ...aptSel, [active]: ids });
  }

  const recommendation =
    sm.score.label === "Strong Buy Signal"
      ? "Advance to underwriting. Fundamentals support an aggressive acquisition posture."
      : sm.score.label === "Buy Signal"
      ? "Strong candidate. Advance to underwriting with standard diligence."
      : sm.score.label === "Watchlist"
      ? "Hold on a watchlist. Monitor rent and occupancy for an entry point."
      : sm.score.label === "Needs More Diligence"
      ? "Gather additional diligence before committing capital."
      : sm.score.label === "Elevated Risk"
      ? "Elevated risk. Pursue only with a clear value-add thesis and pricing discount."
      : "Pass for now. Demand and pricing do not support entry.";

  const totalBeds = selectedApts.reduce((s, a) => s + a.estBeds, 0);
  const totalRevenue = selectedApts.reduce((s, a) => s + a.estAnnualRevenue, 0);

  return (
    <div className="cc-fade max-w-[900px] mx-auto">
      <div className="mb-6 no-print">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Acquisition Scorecard</h1>
            <p className="text-sm text-muted mt-1">Look up a school, pick the properties to include, then export a one-page PDF.</p>
          </div>
          <button onClick={() => window.print()} className="px-5 h-10 rounded-full text-sm font-semibold text-white shrink-0" style={{ background: "var(--gold)" }}>
            Export PDF
          </button>
        </div>

        {/* School lookup + apartment picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* School search */}
          <Card pad={false} className="overflow-hidden">
            <div className="p-4 pb-3">
              <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-2">School</div>
              {!picking ? (
                <button
                  onClick={() => setPicking(true)}
                  className="w-full flex items-center gap-3 text-left p-2 -m-2 rounded-[10px] hover:bg-surface-2 transition-colors"
                >
                  <Logo src={m.logo} abbr={m.abbr} color={m.brandColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink truncate">{m.shortName}</div>
                    <div className="text-xs text-muted truncate">{m.city}, {m.state}</div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>Change</span>
                </button>
              ) : (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by school, city, or state…"
                  className="w-full h-10 px-3 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong"
                  style={{ borderRadius: "var(--radius)" }}
                />
              )}
            </div>
            {picking && (
              <div className="max-h-64 overflow-y-auto nav-scroll border-t border-line divide-y divide-line">
                {matches.length === 0 ? (
                  <div className="text-sm text-muted px-4 py-3">No matching schools.</div>
                ) : (
                  matches.slice(0, 40).map((x) => (
                    <button
                      key={x.market.id}
                      onClick={() => pickSchool(x.market.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 transition-colors ${x.market.id === active ? "bg-gold-soft/30" : ""}`}
                    >
                      <Logo src={x.market.logo} abbr={x.market.abbr} color={x.market.brandColor} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink truncate">{x.market.shortName}</div>
                        <div className="text-xs text-muted truncate">{x.market.city}, {x.market.state}</div>
                      </div>
                      <span className="font-display text-sm font-semibold text-muted-2 num">{x.score.score}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Apartment multi-select */}
          <Card pad={false} className="overflow-hidden flex flex-col">
            <div className="p-4 pb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted">Properties to include</div>
                <div className="text-xs text-muted mt-0.5">
                  {selectedIds.length} of {apartments.length} selected
                </div>
              </div>
              {apartments.length > 0 && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setAllApts(apartments.map((a) => a.id))} className="text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>All</button>
                  <button onClick={() => setAllApts([])} className="text-xs font-semibold text-muted hover:text-ink">Clear</button>
                </div>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto nav-scroll border-t border-line divide-y divide-line">
              {aptLoading ? (
                <div className="px-4 py-3"><Spinner label="Loading properties…" /></div>
              ) : apartments.length === 0 ? (
                <div className="text-sm text-muted px-4 py-3">No named apartments near this campus.</div>
              ) : (
                apartments.map((a) => {
                  const checked = selectedIds.includes(a.id);
                  return (
                    <label key={a.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleApt(a.id)}
                        className="shrink-0 accent-[var(--gold)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink truncate">{a.name}</div>
                        <div className="text-xs text-muted truncate">
                          {a.street ?? "Address not listed"} · {a.distanceMi.toFixed(1)} mi · {fmtNum(a.estBeds)} beds
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </Card>
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
              {m.enrollmentGrowth != null ? ` and is growing ${fmtPct(m.enrollmentGrowth)} year over year` : ""}
              {m.retentionRate != null ? ` with a ${m.retentionRate.toFixed(0)}% retention rate` : ""}.
              {m.acceptanceRate != null ? ` The ${m.acceptanceRate.toFixed(0)}% acceptance rate ${m.acceptanceRate < 50 ? "signals selectivity, concentrating demand" : "indicates broad access, driving volume"}.` : ""}
              {m.medianRent != null ? ` County median rent is $${fmtNum(m.medianRent)}/mo` : ""}
              {m.renterPct != null ? ` with ${m.renterPct.toFixed(0)}% renter-occupied housing` : ""}.
              {m.unemploymentRate != null ? ` Local unemployment stands at ${m.unemploymentRate.toFixed(1)}%.` : ""}
              {` ${m.newsCount} recent news articles reference student housing in the area.`}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
              <Fact label="Enrollment" value={m.enrollment != null ? fmtNum(m.enrollment) : "n/a"} />
              <Fact label="Enrollment growth" value={m.enrollmentGrowth != null ? `+${fmtPct(m.enrollmentGrowth)}` : "n/a"} />
              <Fact label="Acceptance rate" value={m.acceptanceRate != null ? `${m.acceptanceRate.toFixed(0)}%` : "n/a"} />
              <Fact label="Retention rate" value={m.retentionRate != null ? `${m.retentionRate.toFixed(0)}%` : "n/a"} />
              <Fact label="Median rent" value={m.medianRent != null ? `$${fmtNum(m.medianRent)}/mo` : "n/a"} />
              <Fact label="Fair market rent (2BR)" value={m.fmrTwoBed != null ? `$${fmtNum(m.fmrTwoBed)}/mo` : "n/a"} />
              <Fact label="Room & board (on)" value={m.roomBoardOnCampus != null ? `$${fmtNum(m.roomBoardOnCampus)}/yr` : "n/a"} />
              <Fact label="Renter %" value={m.renterPct != null ? `${m.renterPct.toFixed(1)}%` : "n/a"} />
              <Fact label="Unemployment" value={m.unemploymentRate != null ? `${m.unemploymentRate.toFixed(1)}%` : "n/a"} />
              <Fact label="Median income" value={m.medianIncome != null ? `$${fmtNum(m.medianIncome)}` : "n/a"} />
              <Fact label="30-yr mortgage" value={m.mortgageRate != null ? `${m.mortgageRate.toFixed(2)}%` : "n/a"} />
              <Fact label="Housing headlines" value={String(m.newsCount)} />
              <Fact label="State HPI" value={m.stateHpi != null ? m.stateHpi.toFixed(1) : "n/a"} />
              <Fact label="Hazard risk" value={m.hazardRiskRating ?? "n/a"} />
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
                <li>High acceptance rate: enrollment is volume-driven and sensitive to demographic shifts.</li>
              )}
              {m.acceptanceRate != null && m.acceptanceRate <= 70 && (
                <li>Selective admissions ({m.acceptanceRate.toFixed(0)}%): strong demand fundamentals but capped freshman growth.</li>
              )}
              <li>Rent growth and occupancy figures are estimated from enrollment trends; actual figures require local market research.</li>
              <li>{m.newsCount >= 5 ? `Strong news coverage (${m.newsCount} recent headlines) suggests active market attention.` : `Limited news coverage (${m.newsCount} headlines); market may be under the radar.`}</li>
            </ul>
            <SectionTitle>Recommendation</SectionTitle>
            <p className="text-sm font-medium text-ink">{recommendation}</p>
          </div>
        </div>

        {/* Selected properties for this acquisition */}
        <div className="mt-6 pt-5 border-t border-line">
          <SectionTitle sub={selectedApts.length > 0
            ? `${selectedApts.length} ${selectedApts.length === 1 ? "property" : "properties"} near ${m.shortName} · OpenStreetMap + modeled estimates`
            : "Pick one or more properties above to include them on this scorecard"}>
            Target properties
          </SectionTitle>
          {selectedApts.length === 0 ? (
            <p className="text-sm text-muted">No properties selected for this school.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line">
                  <tr>
                    <th className="py-2 pr-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Property</th>
                    <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Address</th>
                    <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Distance</th>
                    <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. beds</th>
                    <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Rent/bed</th>
                    <th className="py-2 pl-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. revenue/yr</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedApts.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3 font-medium text-ink">{a.name}</td>
                      <td className="py-2 px-3 text-ink-soft">{a.street ?? "n/a"}</td>
                      <td className="py-2 px-3 text-right num text-ink-soft">{a.distanceMi.toFixed(1)} mi</td>
                      <td className="py-2 px-3 text-right num text-ink">{fmtNum(a.estBeds)}</td>
                      <td className="py-2 px-3 text-right num text-ink-soft">
                        {fmtMoney(a.estMonthlyRent)}/bed
                        <span className="block text-[10px] text-muted-2 leading-tight">{a.rentSource}</span>
                      </td>
                      <td className="py-2 pl-3 text-right num text-good font-medium">{fmtMoney(a.estAnnualRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line-strong">
                    <td className="py-2 pr-3 font-semibold text-ink" colSpan={3}>Portfolio total</td>
                    <td className="py-2 px-3 text-right num font-semibold text-ink">{fmtNum(totalBeds)}</td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 pl-3 text-right num font-semibold text-good">{fmtMoney(totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="text-[10px] text-muted mt-6 pt-4 border-t border-line">
          Generated by Campus Capital · live data from College Scorecard, Census ACS, BLS, FRED, HUD Fair Market Rents, Google News, and OpenStreetMap · student housing leases by the bed: revenue = estimated beds × real per-bed county rent (HUD FMR, Census median, or a regional fallback as labeled per row) × 12 · not investment advice.
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

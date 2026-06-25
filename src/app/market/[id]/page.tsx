"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useScoredMarket } from "@/lib/compute";
import { useMarketDetail, timeAgo } from "@/lib/live/useMarketDetail";
import { useConstructionNews } from "@/lib/live/useConstructionNews";
import { Card, LabelChip, SectionTitle, Stat, ProvenanceTag, Logo, Spinner, StateBlock } from "@/components/ui";
import { ScoreRing, FactorBars } from "@/components/charts";
import { fmtNum, fmtPct } from "@/lib/scoring";
import { CampusMap } from "@/components/CampusMap";
import { useWatchlist } from "@/lib/watchlist";
import ApartmentDrawer from "@/components/ApartmentDrawer";
import type { Apartment } from "@/lib/types";

function MiniFact({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-2 font-semibold">{label}</div>
      <div className="text-sm font-semibold text-ink num mt-0.5">{value}</div>
      <div className="text-[10px] text-muted-2 mt-0.5">{note}</div>
    </div>
  );
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { sm, loading, error } = useScoredMarket(id);
  const { apartments, articles, loading: detailLoading } = useMarketDetail(id);
  const { articles: constructionArticles, loading: constructionLoading } = useConstructionNews(id);
  const { isSaved } = useWatchlist();
  const [drawerApt, setDrawerApt] = useState<Apartment | null>(null);

  if (loading) return <Spinner />;
  if (error || !sm) return <StateBlock title="Market not found" note="Could not load this market. Try refreshing." />;
  const m = sm.market;

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

  return (
    <div className="cc-fade">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Logo src={m.logo} abbr={m.abbr} color={m.brandColor} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">{m.name}</h1>
            <LabelChip label={sm.score.label} />
          </div>
          <p className="text-sm text-muted mt-1">{m.city}, {m.state} · {m.conference} · {m.region}</p>
        </div>
        <Link href={`/scorecard?market=${m.id}`} className="px-5 h-10 inline-flex items-center rounded-full text-sm font-semibold text-white"
          style={{ background: "var(--gold)" }}>
          View scorecard
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Enrollment" value={m.enrollment != null ? fmtNum(m.enrollment) : "n/a"} delta={m.enrollmentGrowth != null ? `+${fmtPct(m.enrollmentGrowth)} / yr` : undefined} tone="good" />
        <Stat label="Acceptance rate" value={m.acceptanceRate != null ? `${m.acceptanceRate.toFixed(0)}%` : "n/a"} delta="College Scorecard" />
        <Stat label="Retention rate" value={m.retentionRate != null ? `${m.retentionRate.toFixed(0)}%` : "n/a"} delta="4-yr full-time" tone="good" />
        <Stat label="Housing headlines" value={String(m.newsCount)} delta="recent Google News" tone="info" />
      </div>

      {/* Census + BLS + FRED macro data */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Stat label="Median rent" value={m.medianRent != null ? `$${fmtNum(m.medianRent)}/mo` : "n/a"} delta="Census ACS" />
        <Stat label="County population" value={m.countyPopulation != null ? fmtNum(m.countyPopulation) : "n/a"} delta="Census ACS" />
        <Stat label="Renter %" value={m.renterPct != null ? `${m.renterPct.toFixed(1)}%` : "n/a"} delta="Census ACS" tone={m.renterPct != null && m.renterPct > 50 ? "good" : undefined} />
        <Stat label="Unemployment" value={m.unemploymentRate != null ? `${m.unemploymentRate.toFixed(1)}%` : "n/a"} delta="BLS LAUS" tone={m.unemploymentRate != null && m.unemploymentRate < 4 ? "good" : m.unemploymentRate != null && m.unemploymentRate > 6 ? "bad" : undefined} />
        <Stat label="30-yr mortgage" value={m.mortgageRate != null ? `${m.mortgageRate.toFixed(2)}%` : "n/a"} delta="FRED" />
      </div>

      {/* Room & board + income context */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Stat label="Room & board (on)" value={m.roomBoardOnCampus != null ? `$${fmtNum(m.roomBoardOnCampus)}/yr` : "n/a"} delta="College Scorecard" />
        <Stat label="Room & board (off)" value={m.roomBoardOffCampus != null ? `$${fmtNum(m.roomBoardOffCampus)}/yr` : "n/a"} delta="College Scorecard" />
        <Stat label="Median income" value={m.medianIncome != null ? `$${fmtNum(m.medianIncome)}` : "n/a"} delta="Census ACS" />
        <Stat label="Fair market rent (2BR)" value={m.fmrTwoBed != null ? `$${fmtNum(m.fmrTwoBed)}/mo` : "n/a"} delta={m.fmrYear ? `HUD FMR ${m.fmrYear}` : "HUD FMR"} tone="good" />
        <Stat
          label="Hazard risk"
          value={m.hazardRiskRating ?? "n/a"}
          delta="FEMA NRI"
          tone={
            m.hazardRiskScore != null && m.hazardRiskScore >= 90 ? "bad" :
            m.hazardRiskScore != null && m.hazardRiskScore <= 70 ? "good" : undefined
          }
        />
      </div>

      {/* Campus context - Wikipedia photo & blurb + Open-Meteo climate + USGS seismic */}
      {(m.wikiSummary || m.wikiThumb || m.climateAvgTempF != null) && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
            {m.wikiThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.wikiThumb}
                alt={`${m.shortName} campus`}
                className="w-full h-44 md:h-full object-cover rounded-[var(--radius-card)] border border-line"
              />
            ) : (
              <div className="w-full h-44 md:h-full rounded-[var(--radius-card)] border border-line grid place-items-center bg-surface-2">
                <Logo src={m.logo} abbr={m.abbr} color={m.brandColor} size={64} />
              </div>
            )}
            <div className="min-w-0">
              <SectionTitle sub="Wikipedia" right={<ProvenanceTag p="live" />}>About {m.shortName}</SectionTitle>
              {m.wikiSummary ? (
                <p className="text-sm text-ink-soft leading-relaxed">{m.wikiSummary}</p>
              ) : (
                <p className="text-sm text-muted">No encyclopedic summary available.</p>
              )}
              {m.wikiUrl && (
                <a href={m.wikiUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-gold-deep hover:underline">
                  Read on Wikipedia →
                </a>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <MiniFact label="Avg temp" value={m.climateAvgTempF != null ? `${m.climateAvgTempF}°F` : "n/a"} note="Open-Meteo" />
                <MiniFact label="Sunshine" value={m.climateSunHours != null ? `${fmtNum(m.climateSunHours)} hrs/yr` : "n/a"} note="Open-Meteo" />
                <MiniFact label="Precip" value={m.climatePrecipIn != null ? `${m.climatePrecipIn}" /yr` : "n/a"} note="Open-Meteo" />
                <MiniFact label="Quakes M3+" value={m.quakeCount != null ? String(m.quakeCount) : "n/a"} note="USGS · 100km/25yr" />
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center">
          <SectionTitle sub="Weighted composite">Acquisition score</SectionTitle>
          <ScoreRing score={sm.score.score} size={150} />
          <div className="mt-3"><LabelChip label={sm.score.label} /></div>
          <p className="text-sm text-ink-soft mt-4 text-center leading-relaxed">{recommendation}</p>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle sub="Each factor 0–100 × weight">Score breakdown</SectionTitle>
          <FactorBars factors={sm.score.factors} />
          <div className="flex gap-3 mt-4">
            <ProvenanceTag p="live" />
            <ProvenanceTag p="estimated" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card pad={false} className="overflow-hidden">
          <div className="p-5 pb-3">
            <SectionTitle sub="Click a pin for apartment details">Campus area</SectionTitle>
          </div>
          <div className="px-3 pb-3">
            <CampusMap markets={[sm]} initialSelected={m.id} height={360} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <SectionTitle sub="Google News RSS" right={<ProvenanceTag p="live" />}>Live headlines</SectionTitle>
          {detailLoading ? <Spinner label="Pulling headlines…" /> : articles.length === 0 ? (
            <div className="text-sm text-muted py-4">No recent headlines for this market.</div>
          ) : (
            <div className="flex flex-col divide-y divide-line overflow-y-auto nav-scroll" style={{ maxHeight: 340 }}>
              {articles.slice(0, 12).map((a, i) => (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="py-3 group">
                  <div className="text-[13px] text-ink-soft group-hover:text-ink leading-snug">{a.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted">{a.source}</span>
                    <span className="text-[11px] text-muted-2 ml-auto">{timeAgo(a.published)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Construction & Development News */}
      <Card className="mt-6">
        <SectionTitle
          sub={constructionLoading ? "Loading…" : `${constructionArticles.length} articles · construction, new builds, developments`}
          right={<ProvenanceTag p="live" />}
        >
          Construction &amp; Development
        </SectionTitle>
        {constructionLoading ? (
          <Spinner label="Searching for construction news…" />
        ) : constructionArticles.length === 0 ? (
          <div className="text-sm text-muted py-4">No recent construction or development news for this market.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {constructionArticles.slice(0, 12).map((a, i) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
                className="border border-line rounded-[var(--radius-card)] p-4 hover:bg-surface-2 transition-colors group">
                <div className="text-sm text-ink leading-snug group-hover:text-gold-deep transition-colors line-clamp-2">{a.title}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-muted">{a.source}</span>
                  <span className="text-[11px] text-muted-2 ml-auto">{timeAgo(a.published)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>

      {/* Nearby apartments - clickable */}
      <Card className="mt-6">
        <SectionTitle
          sub={detailLoading ? "Loading…" : `${apartments.length} found near campus · click any to dive deeper`}
          right={<ProvenanceTag p="live" />}
        >
          Nearby apartments
        </SectionTitle>
        {detailLoading ? <Spinner label="Searching OpenStreetMap…" /> : apartments.length === 0 ? (
          <div className="text-sm text-muted py-4">No named apartment buildings found within 3 km of campus.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {apartments.map((apt) => (
              <button key={apt.id}
                onClick={() => setDrawerApt(apt)}
                className={`text-left border border-line rounded-[var(--radius-card)] p-4 hover:bg-surface-2 transition-colors group ${
                  isSaved(apt.id) ? "border-gold/40 bg-gold-soft/20" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSaved(apt.id) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="var(--gold)" strokeWidth="2">
                      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" />
                    </svg>
                  )}
                  <span className="font-medium text-ink text-sm group-hover:text-gold-deep transition-colors">{apt.name}</span>
                </div>
                <div className="text-xs text-muted mt-1">{apt.street ?? "Address not listed"} · {apt.distanceMi.toFixed(1)} mi</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">{apt.estBeds} beds · ${Math.round(apt.estMonthlyRent).toLocaleString()}/bed/mo</span>
                  <span className="text-xs font-semibold text-good">${Math.round(apt.estAnnualRevenue).toLocaleString()}/yr</span>
                </div>
                <div className="text-[10px] text-muted-2 mt-0.5">Rent basis: {apt.rentSource}</div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <ApartmentDrawer
        apartment={drawerApt}
        marketId={id}
        marketName={m.shortName}
        marketState={m.state}
        onClose={() => setDrawerApt(null)}
      />
    </div>
  );
}

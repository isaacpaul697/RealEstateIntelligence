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
      : sm.score.label === "Watchlist"
      ? "Hold on a watchlist. Monitor rent and occupancy for an entry point."
      : sm.score.label === "Needs More Diligence"
      ? "Gather additional diligence before committing capital."
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
        <Stat label="Enrollment" value={m.enrollment != null ? fmtNum(m.enrollment) : "—"} delta={m.enrollmentGrowth != null ? `+${fmtPct(m.enrollmentGrowth)} / yr` : undefined} tone="good" />
        <Stat label="Acceptance rate" value={m.acceptanceRate != null ? `${m.acceptanceRate.toFixed(0)}%` : "—"} delta="College Scorecard" />
        <Stat label="Est. rent growth" value={`+${fmtPct(m.estRentGrowth)}`} delta="modeled from enrollment + selectivity" tone="warn" />
        <Stat label="Housing headlines" value={String(m.newsCount)} delta="recent Google News" tone="info" />
      </div>

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

      {/* Nearby apartments — clickable */}
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
                  <span className="text-xs text-muted">{apt.estUnits} units</span>
                  <span className="text-xs font-semibold text-good">${Math.round(apt.estAnnualRevenue).toLocaleString()}/yr</span>
                </div>
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

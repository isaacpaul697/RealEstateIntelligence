"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useScoredMarkets } from "@/lib/compute";
import { CampusMap } from "@/components/CampusMap";
import { Card, Stat, LabelChip, SectionTitle, Logo, Spinner, StateBlock } from "@/components/ui";
import { fmtNum } from "@/lib/scoring";
import { timeAgo } from "@/lib/live/useMarketDetail";

interface FeedArticle {
  title: string;
  link: string;
  source: string;
  published: string;
  marketName: string;
  brandColor: string;
}

const NEWS_CACHE_KEY = "cc.cache.news";
const CACHE_TTL = 12 * 60 * 60 * 1000;

/** The live, free data sources behind every figure in the app. */
const SOURCE_CHIPS = [
  "College Scorecard", "Census ACS", "BLS", "FRED", "FEMA NRI", "HUD FMR",
  "Wikipedia", "Open-Meteo", "USGS", "OpenStreetMap", "Google News", "ESPN",
];

const STEPS = [
  { n: "01", h: "Pull live university data", b: "Federal enrollment, acceptance & retention from the College Scorecard API." },
  { n: "02", h: "Layer the local market", b: "Census demographics, BLS jobs, HUD fair-market rents, FEMA hazard, climate & seismic exposure per county." },
  { n: "03", h: "Map real supply & demand", b: "Named apartment buildings near each campus from OpenStreetMap, plus live housing headlines from Google News." },
  { n: "04", h: "Score 0–100", b: "A transparent weighted model blends every signal into one acquisition score, banded from Strong Buy to Overpriced." },
];

export default function Home() {
  const { scored, loading, error } = useScoredMarkets();
  const [feed, setFeed] = useState<FeedArticle[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NEWS_CACHE_KEY);
      if (raw) {
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts < CACHE_TTL && entry.data?.length > 0) {
          setFeed(entry.data);
          setFeedLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => {
        const data = d.articles ?? [];
        setFeed(data);
        try { sessionStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* */ }
      })
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, []);

  const strongBuys = scored.filter((m) => m.score.label === "Strong Buy Signal").length;
  const avg = scored.length ? Math.round(scored.reduce((s, m) => s + m.score.score, 0) / scored.length) : 0;
  const headlines = scored.reduce((s, m) => s + m.market.newsCount, 0);
  const enrolled = scored.reduce((s, m) => s + (m.market.enrollment ?? 0), 0);

  return (
    <div className="flex flex-col gap-8 cc-fade">
      {/* ── Hero ───────────────────────────────────────────── */}
      <Card className="overflow-hidden relative" pad={false}>
        {/* warm radial wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(900px 360px at 88% -10%, var(--gold-soft) 0%, transparent 60%)" }}
        />
        <div className="relative p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gold-deep bg-gold-soft rounded-full px-3 py-1">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-good" />
              </span>
              Live data
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider text-muted bg-surface-2 border border-line rounded-full px-3 py-1">
              Portfolio project
            </span>
          </div>

          <h1 className="font-display text-[34px] md:text-[50px] leading-[1.05] font-semibold text-ink tracking-tight max-w-4xl">
            Find the next student-housing market{" "}
            <span className="italic text-gold-deep">before the market does.</span>
          </h1>
          <p className="text-ink-soft mt-5 text-[15px] md:text-base leading-relaxed max-w-2xl">
            Campus Capital screens {scored.length || 100}+ major university markets entirely on free, public
            data: federal enrollment, county demographics, fair-market rents, hazard & climate exposure,
            on-the-ground apartment supply, and the live news cycle, all blended into a transparent 0–100
            acquisition score.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/map" className="px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold text-white shadow-[var(--shadow)]"
              style={{ background: "var(--gold)" }}>
              Open the live map
            </Link>
            <Link href="/markets" className="px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold text-ink bg-surface-2 border border-line hover:border-line-strong transition-colors">
              Browse all markets
            </Link>
            <Link href="/about" className="px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold text-ink-soft hover:text-ink transition-colors">
              How it works →
            </Link>
          </div>

          {/* live source chips */}
          <div className="mt-8 pt-6 border-t border-line">
            <div className="text-[10.5px] uppercase tracking-[1.4px] font-semibold text-muted-2 mb-3">
              Powered by {SOURCE_CHIPS.length} live public APIs
            </div>
            <div className="flex flex-wrap gap-2">
              {SOURCE_CHIPS.map((s) => (
                <span key={s} className="text-[11px] font-medium text-ink-soft bg-surface-2 border border-line rounded-full px-2.5 py-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Markets tracked" value={loading ? "n/a" : String(scored.length)} delta={`${strongBuys} strong-buy signals`} tone="good" />
        <Stat label="Avg acquisition score" value={loading ? "n/a" : String(avg)} delta="weighted composite" />
        <Stat label="Live headlines (now)" value={loading ? "n/a" : fmtNum(headlines)} delta="across tracked markets" tone="info" />
        <Stat label="Students in coverage" value={loading ? "n/a" : fmtNum(enrolled)} delta="College Scorecard" />
      </div>

      {/* ── Map + feed ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <Card pad={false} className="overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <SectionTitle sub="Click a campus to zoom in and reveal real nearby apartments">Demand map</SectionTitle>
          </div>
          <div className="px-3 pb-3">
            {loading ? <Spinner /> : error ? <StateBlock title="Live feed unavailable" note="Could not reach the data source. Try refreshing." /> : (
              <CampusMap markets={scored} height={460} />
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <SectionTitle sub="Real headlines · Google News">Live signal feed</SectionTitle>
          <div className="flex flex-col divide-y divide-line -mt-1 overflow-y-auto nav-scroll" style={{ maxHeight: 470 }}>
            {feedLoading ? (
              <Spinner label="Pulling headlines…" />
            ) : feed.length === 0 ? (
              <div className="text-sm text-muted py-6">No recent headlines.</div>
            ) : (
              feed.slice(0, 14).map((a, i) => (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="py-3 group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: a.brandColor }} />
                    <span className="text-[11px] font-semibold text-muted">{a.marketName}</span>
                    <span className="text-[11px] text-muted-2 ml-auto">{timeAgo(a.published)}</span>
                  </div>
                  <div className="text-[13px] text-ink-soft group-hover:text-ink leading-snug">{a.title}</div>
                  <div className="text-[11px] text-muted-2 mt-0.5">{a.source}</div>
                </a>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── How it works ───────────────────────────────────── */}
      <Card>
        <SectionTitle sub="From raw public data to a single acquisition score" right={<Link href="/about" className="text-xs font-semibold text-gold-deep hover:underline">Full methodology →</Link>}>
          How Campus Capital works
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
              <div className="font-display text-2xl font-semibold text-gold-deep/70">{s.n}</div>
              <div className="text-sm font-semibold text-ink mt-2">{s.h}</div>
              <div className="text-xs text-muted mt-1 leading-relaxed">{s.b}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Ranked preview ─────────────────────────────────── */}
      {!loading && !error && (
        <Card>
          <SectionTitle sub="Ranked by live acquisition score" right={<Link href="/markets" className="text-xs font-semibold text-gold-deep hover:underline">All markets →</Link>}>
            Conviction leaderboard
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {scored.slice(0, 6).map((m, i) => (
              <Link key={m.market.id} href={`/student-housing/market/${m.market.id}`}
                className="flex items-center gap-3 p-3 rounded-[12px] hover:bg-surface-2 transition-colors">
                <span className="font-display text-lg font-semibold text-muted-2 w-6 text-center">{i + 1}</span>
                <Logo src={m.market.logo} abbr={m.market.abbr} color={m.market.brandColor} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink truncate">{m.market.shortName}</div>
                  <div className="text-xs text-muted">{m.market.city}, {m.market.state}</div>
                </div>
                <span className="font-display text-xl font-semibold text-ink num">{m.score.score}</span>
                <LabelChip label={m.score.label} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* ── Footer note ────────────────────────────────────── */}
      <Card className="flex items-center justify-between flex-wrap gap-3 bg-surface-2/60">
        <div>
          <div className="font-display font-semibold text-ink">A portfolio project</div>
          <div className="text-sm text-muted max-w-xl mt-0.5">
            Built to look and behave like a real commercial real-estate acquisitions desk. Every number is live or transparently modeled. Nothing here is investment advice.
          </div>
        </div>
        <Link href="/about" className="px-5 h-10 inline-flex items-center rounded-full text-sm font-semibold text-white shrink-0" style={{ background: "var(--gold)" }}>
          About this build
        </Link>
      </Card>
    </div>
  );
}

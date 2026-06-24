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
      {/* hero */}
      <Card className="overflow-hidden relative" pad={false}>
        <div className="p-8 md:p-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gold-deep bg-gold-soft rounded-full px-3 py-1">
            Live acquisitions intelligence
          </span>
          <h1 className="font-display text-[34px] md:text-[44px] leading-[1.08] font-semibold text-ink mt-5 tracking-tight">
            Find the next student-housing market <span className="italic text-gold-deep">before the market does.</span>
          </h1>
          <p className="text-ink-soft mt-4 text-[15px] leading-relaxed">
            Campus Capital screens {scored.length || 10} major university markets using real federal enrollment data,
            live demand momentum from the news cycle, and on-the-ground apartment supply — blended into a transparent
            0–100 acquisition score.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/map" className="px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold text-white shadow-[var(--shadow)]"
              style={{ background: "var(--gold)" }}>
              Open the live map
            </Link>
            <Link href="/top10" className="px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold text-ink bg-surface-2 border border-line hover:border-line-strong">
              Top 10 markets
            </Link>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Markets tracked" value={loading ? "—" : String(scored.length)} delta={`${strongBuys} strong-buy signals`} tone="good" />
        <Stat label="Avg acquisition score" value={loading ? "—" : String(avg)} delta="weighted composite" />
        <Stat label="Live headlines (now)" value={loading ? "—" : fmtNum(headlines)} delta="across tracked markets" tone="info" />
        <Stat label="Students in coverage" value={loading ? "—" : fmtNum(enrolled)} delta="College Scorecard" />
      </div>

      {/* map + feed */}
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

      {/* ranked preview */}
      {!loading && !error && (
        <Card>
          <SectionTitle sub="Ranked by live acquisition score" right={<Link href="/markets" className="text-xs font-semibold text-gold-deep hover:underline">All markets →</Link>}>
            Conviction leaderboard
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {scored.slice(0, 6).map((m, i) => (
              <Link key={m.market.id} href={`/market/${m.market.id}`}
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
    </div>
  );
}

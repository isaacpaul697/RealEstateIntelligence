import { notFound } from "next/navigation";
import Link from "next/link";
import { CITIES } from "@/lib/dev/cities";
import { Card, SectionTitle, Stat, StateBlock } from "@/components/dev/ui";
import { TrendBars } from "@/components/dev/charts";
import { MarketLeaderboard } from "@/components/dev/MarketLeaderboard";
import { SectorHeader } from "@/components/dev/SectorHeader";
import { SectorPlayers, SectorNews, type PlayerRow } from "@/components/dev/SectorIntel";
import { LiveSignalFeed } from "@/components/dev/LiveSignalFeed";
import { SECTORS } from "@/lib/dev/sectorDefs";
import { loadSectorBps } from "@/lib/dev/sectorData";
import { sectorPlayers } from "@/lib/dev/sectors";
import { fetchFilings } from "@/lib/dev/live/edgar";
import { fetchNews } from "@/lib/live/news";
import { newsSignals, filingSignals, mergeSignals } from "@/lib/dev/live/signals";
import { fmtNum } from "@/lib/dev/format";

export const revalidate = 43200;

export function generateStaticParams() {
  return Object.keys(SECTORS).map((sector) => ({ sector }));
}

export default async function SectorOverviewPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const def = SECTORS[sector];
  if (!def) notFound();

  // ── Live intel shared by every asset class: the major public operators in
  //    this class with their latest SEC filings, plus a sector-tuned news feed.
  const players = sectorPlayers(sector);
  const [articles, playerRows] = await Promise.all([
    players ? fetchNews(players.newsQuery, 6) : Promise.resolve([]),
    players
      ? Promise.all(
          players.companies.map(
            async (c): Promise<PlayerRow> => ({ company: c, filings: await fetchFilings(c.cik, 2) }),
          ),
        )
      : Promise.resolve([] as PlayerRow[]),
  ]);
  const intel = players ? (
    <>
      <SectorPlayers rows={playerRows} intro={players.playersIntro} accent={def.color} label={def.label} />
      <SectorNews articles={articles} label={def.label} />
    </>
  ) : null;

  // One chronological feed merging this class's live filings and headlines.
  const signals = mergeSignals(newsSignals(articles), filingSignals(playerRows)).slice(0, 14);
  const feed = signals.length ? (
    <LiveSignalFeed
      signals={signals}
      accent={def.color}
      title={`${def.label} live signal feed`}
      sub="Recent SEC filings and headlines across this asset class, newest first."
    />
  ) : null;

  // ── Commercial + program classes: honest context, no national unit number,
  //    plus the live permit portals that actually classify them.
  if (def.source === "portal" || def.source === "program") {
    const liveCities = CITIES.filter((c) => c.socrata);
    return (
      <div className="flex flex-col gap-7">
        <SectorHeader sector={sector} />

        <Card>
          <SectionTitle sub="Why there's no national number on this page">
            Not in the residential permit survey
          </SectionTitle>
          <div className="flex flex-col gap-3 text-[14px] text-ink-soft leading-relaxed max-w-3xl">
            {def.about.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-2">
            No figures are estimated or fabricated for this asset class.
          </div>
        </Card>

        {def.source === "program" ? (
          <Card>
            <SectionTitle sub="Closest live data within this app">Where to look next</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/sector/multifamily"
                className="block bg-surface-2 border border-line rounded-[var(--radius-card)] p-4 hover:border-line-strong transition-colors">
                <div className="font-display text-[16px] font-semibold text-ink">Multifamily permits →</div>
                <div className="text-xs text-muted mt-1">The structural proxy: live 5+ unit authorizations nationwide.</div>
              </Link>
              <Link href="/student-housing"
                className="block bg-surface-2 border border-line rounded-[var(--radius-card)] p-4 hover:border-line-strong transition-colors">
                <div className="font-display text-[16px] font-semibold text-ink">Student housing →</div>
                <div className="text-xs text-muted mt-1">A dedicated, fully-live workspace for purpose-built student housing.</div>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <SectionTitle sub={`Open a live permit portal to explore real ${def.label.toLowerCase()} permits`}>
              Explore in a live-portal city
            </SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveCities.map((c) => (
                <Link key={c.id} href={`/city/${c.id}`}
                  className="block bg-surface-2 border border-line rounded-[var(--radius-card)] p-4 hover:border-line-strong transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-semibold text-ink">{c.name}</span>
                    <span className="text-xs text-muted-2 shrink-0">{c.state}</span>
                  </div>
                  <div className="text-[12px] font-semibold mt-2" style={{ color: def.color }}>Open permit portal →</div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {feed}
        {intel}
      </div>
    );
  }

  // ── Residential structure types: live Building Permits Survey.
  const { available, view } = await loadSectorBps(sector);
  if (!available || !view) {
    return (
      <div className="flex flex-col gap-7">
        <SectorHeader sector={sector} />
        <StateBlock
          title="Census Building Permits Survey is unavailable right now"
          note="The national feed didn't respond. No placeholder data is shown. Try again shortly."
        />
        {feed}
        {intel}
      </div>
    );
  }

  const tr = view.trendData;
  const lastV = tr.length ? tr[tr.length - 1].value : null;
  const prevV = tr.length > 1 ? tr[tr.length - 2].value : null;
  const yoy = lastV != null && prevV != null && prevV > 0 ? (lastV - prevV) / prevV : null;

  return (
    <div className="flex flex-col gap-7">
      <SectorHeader sector={sector} />

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat label={`Units authorized · ${view.year}`} value={fmtNum(view.sectorTotal)} provenance="live" sub={`${def.label} nationwide`} />
        <Stat
          label="Year-over-year"
          value={yoy == null ? "n/a" : `${yoy >= 0 ? "+" : ""}${Math.round(yoy * 100)}%`}
          provenance="live"
          sub={view.prevYear ? `vs ${view.prevYear}` : "vs prior year"}
        />
        <Stat label="Share of all permits" value={`${Math.round(view.share * 100)}%`} provenance="live" sub={`of ${fmtNum(view.allUnits)} total units`} />
        <Stat label="Top state" value={view.topState?.state ?? "n/a"} provenance="live" sub={view.topState ? `${fmtNum(view.topState.v)} units` : undefined} />
        <Stat label="States with activity" value={fmtNum(view.statesWithActivity)} provenance="live" sub="reporting 1+ unit" />
      </section>

      {feed}

      <Card>
        <SectionTitle sub={`National ${def.label.toLowerCase()} units authorized per year`}>Construction trend</SectionTitle>
        <TrendBars data={view.trendData} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-7">
        <Card>
          <SectionTitle sub={`Top states by ${def.label.toLowerCase()} units authorized · ${view.year}`}>
            Where it&apos;s being built
          </SectionTitle>
          <MarketLeaderboard rows={view.volumeRows.slice(0, 8)} />
        </Card>
        <Card>
          <SectionTitle sub="Largest year-over-year gains in permit volume">Fastest-growing states</SectionTitle>
          {view.momentumRows.length ? (
            <MarketLeaderboard rows={view.momentumRows.slice(0, 8)} />
          ) : (
            <div className="text-[13px] text-muted">Not enough multi-year state data to rank momentum right now.</div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle sub="Census Building Permits Survey">About this asset class</SectionTitle>
        <div className="flex flex-col gap-3 text-[14px] text-ink-soft leading-relaxed max-w-3xl">
          {def.about.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Dig deeper into this asset class">More in this section</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href={`/sector/${sector}/leaderboards`}
            className="block bg-surface-2 border border-line rounded-[var(--radius-card)] p-4 hover:border-line-strong transition-colors">
            <div className="font-display text-[16px] font-semibold text-ink">Leaderboards →</div>
            <div className="text-xs text-muted mt-1">Top states by permit volume and fastest year-over-year growth.</div>
          </Link>
          <Link href={`/sector/${sector}/players`}
            className="block bg-surface-2 border border-line rounded-[var(--radius-card)] p-4 hover:border-line-strong transition-colors">
            <div className="font-display text-[16px] font-semibold text-ink">Players &amp; news →</div>
            <div className="text-xs text-muted mt-1">Major public operators, their live SEC filings, and sector headlines.</div>
          </Link>
        </div>
      </Card>

      {intel}
    </div>
  );
}

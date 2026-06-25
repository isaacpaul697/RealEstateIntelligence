"use client";

import { useState, useMemo, useEffect } from "react";
import { useScoredMarkets } from "@/lib/compute";
import { usePreloadedApartments } from "@/lib/live/allApartments";
import { Card, SectionTitle, Logo, Spinner, StateBlock, ProvenanceTag } from "@/components/ui";
import { fmtNum } from "@/lib/scoring";
import { usePersistedState } from "@/lib/usePersistedState";
import { useWatchlist } from "@/lib/watchlist";
import ApartmentDrawer from "@/components/ApartmentDrawer";
import type { Apartment } from "@/lib/types";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

type NationalApt = Apartment & { marketId: string; marketName: string; marketState: string };

const NAT_CACHE_KEY = "cc.cache.top-apartments.v4"; // v4: footprint-area unit model
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

function useNationalTopApartments() {
  const [apts, setApts] = useState<NationalApt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NAT_CACHE_KEY);
      if (raw) {
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts < CACHE_TTL && entry.data?.length > 0) {
          setApts(entry.data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    fetch("/api/top-apartments")
      .then((r) => r.json())
      .then((d) => {
        const data = d.apartments ?? [];
        setApts(data);
        try { sessionStorage.setItem(NAT_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* */ }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { apts, loading };
}

export default function TopApartmentsPage() {
  const { scored, loading, error } = useScoredMarkets();
  const [sel, setSel] = usePersistedState<string>("cc.sel.top-school", "__national__");
  const [search, setSearch] = useState("");
  const [drawerApt, setDrawerApt] = useState<Apartment | null>(null);
  const [drawerMarket, setDrawerMarket] = useState({ id: "", name: "", state: "" });
  const { isSaved } = useWatchlist();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return scored.filter((m) => {
      if (!q) return true;
      return (
        m.market.shortName.toLowerCase().includes(q) ||
        m.market.name.toLowerCase().includes(q) ||
        m.market.state.toLowerCase().includes(q) ||
        m.market.city.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.market.shortName.localeCompare(b.market.shortName));
  }, [scored, search]);

  const isNational = sel === "__national__";
  const activeSchool = isNational ? undefined : sel || filtered[0]?.market.id;
  const market = activeSchool ? scored.find((m) => m.market.id === activeSchool)?.market : undefined;

  const { apts: nationalApts, loading: nationalLoading } = useNationalTopApartments();
  const { apartments: schoolApts, loading: schoolAptLoading } = usePreloadedApartments(isNational ? undefined : (activeSchool ?? undefined));

  const top10School = useMemo(
    () => [...schoolApts].sort((a, b) => b.estAnnualRevenue - a.estAnnualRevenue).slice(0, 10),
    [schoolApts],
  );

  const openDrawer = (apt: Apartment, mktId: string, mktName: string, mktState: string) => {
    setDrawerApt(apt);
    setDrawerMarket({ id: mktId, name: mktName, state: mktState });
  };

  if (loading) return <Spinner />;
  if (error) return <StateBlock title="Live feed unavailable" note="Could not load market data. Try refreshing." />;

  return (
    <div className="cc-fade">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Top 10 Apartments</h1>
        <p className="text-sm text-muted mt-1">
          Largest apartment complexes ranked by estimated capacity and revenue. Click any row to dive deeper.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search school or state…"
          className="h-10 px-4 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong w-64"
          style={{ borderRadius: "var(--radius)" }}
        />
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="h-10 px-4 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong flex-1 min-w-[200px]"
          style={{ borderRadius: "var(--radius)" }}
        >
          <option value="__national__">All Schools · National Top 10</option>
          {filtered.map((m) => (
            <option key={m.market.id} value={m.market.id}>
              {m.market.shortName} · {m.market.city}, {m.market.state}
            </option>
          ))}
        </select>
      </div>

      {market && (
        <div className="flex items-center gap-3 mb-5">
          <Logo src={market.logo} abbr={market.abbr} color={market.brandColor} size={40} />
          <div>
            <div className="font-semibold text-ink">{market.shortName}</div>
            <div className="text-xs text-muted">{market.city}, {market.state} · avg est. rent {fmtMoney(market.region === "West" ? 1800 : market.region === "Northeast" ? 1500 : market.region === "Midwest" ? 1000 : 1100)}/mo</div>
          </div>
          <div className="ml-auto">
            <ProvenanceTag p="estimated" />
          </div>
        </div>
      )}

      {isNational && !market && (
        <div className="flex items-center gap-3 mb-5">
          <div className="grid place-items-center w-10 h-10 font-display font-semibold text-white text-lg" style={{ background: "linear-gradient(150deg, var(--gold-bright), var(--gold-deep))", borderRadius: "var(--radius)" }}>N</div>
          <div>
            <div className="font-semibold text-ink">National Top 10</div>
            <div className="text-xs text-muted">Highest-revenue apartments across all 100 campuses</div>
          </div>
          <div className="ml-auto">
            <ProvenanceTag p="estimated" />
          </div>
        </div>
      )}

      {isNational ? (
        nationalLoading ? (
          <Spinner label="Loading national apartment rankings…" />
        ) : nationalApts.length === 0 ? (
          <StateBlock title="No apartments found" note="Could not load national apartment data." />
        ) : (
          <NationalTable apts={nationalApts.slice(0, 10)} onSelect={openDrawer} isSaved={isSaved} />
        )
      ) : schoolAptLoading ? (
        <Spinner label="Loading apartment data…" />
      ) : schoolApts.length === 0 ? (
        <StateBlock title="No apartments found" note="OpenStreetMap has no named apartment buildings within 3 mi of this campus." />
      ) : (
        <SchoolTable apts={top10School} total={schoolApts.length} schoolName={market?.shortName ?? "campus"}
          onSelect={(apt) => openDrawer(apt, activeSchool!, market?.shortName ?? "", market?.state ?? "")}
          isSaved={isSaved} />
      )}

      <ApartmentDrawer
        apartment={drawerApt}
        marketId={drawerMarket.id}
        marketName={drawerMarket.name}
        marketState={drawerMarket.state}
        onClose={() => setDrawerApt(null)}
      />
    </div>
  );
}

function SchoolTable({ apts, total, schoolName, onSelect, isSaved }: {
  apts: Apartment[];
  total: number;
  schoolName: string;
  onSelect: (apt: Apartment) => void;
  isSaved: (id: string) => boolean;
}) {
  return (
    <Card pad={false}>
      <div className="p-5 pb-3">
        <SectionTitle sub={`Top ${apts.length} of ${total} near ${schoolName} · ranked by estimated annual revenue`}>
          Revenue leaders
        </SectionTitle>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-line">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-center w-10">#</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Apartment</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Distance</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. Beds</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Rent/bed/mo</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. Annual Revenue</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Website</th>
            </tr>
          </thead>
          <tbody>
            {apts.map((apt, i) => (
              <tr key={apt.id}
                onClick={() => onSelect(apt)}
                className={`border-b border-line last:border-0 hover:bg-surface-2 transition-colors cursor-pointer ${
                  isSaved(apt.id) ? "bg-gold-soft/30" : ""
                }`}>
                <td className="px-4 py-3 text-center font-display font-semibold text-muted-2 text-lg">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isSaved(apt.id) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="var(--gold)" strokeWidth="2">
                        <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" />
                      </svg>
                    )}
                    <div>
                      <div className="font-medium text-ink">{apt.name}</div>
                      <div className="text-xs text-muted">{apt.street ?? "Address not listed"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right num text-ink-soft">{apt.distanceMi.toFixed(1)} mi</td>
                <td className="px-4 py-3 text-right num font-semibold text-ink">{fmtNum(apt.estBeds)}</td>
                <td className="px-4 py-3 text-right num text-ink-soft">{fmtMoney(apt.estMonthlyRent)}</td>
                <td className="px-4 py-3 text-right num font-semibold text-good">{fmtMoney(apt.estAnnualRevenue)}</td>
                <td className="px-4 py-3">
                  {apt.website ? (
                    <a href={apt.website} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
                      Visit →
                    </a>
                  ) : apt.searchUrl ? (
                    <a href={apt.searchUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-muted hover:text-ink transition-colors">
                      Search →
                    </a>
                  ) : (
                    <span className="text-muted-2">n/a</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-line text-[11px] text-muted">
        Beds estimated from OSM building data (units × ~2 beds/unit). Student housing leases by the bed, so revenue = estimated beds × real per-bed rent (HUD FMR / Census, regional fallback) × 12.
      </div>
    </Card>
  );
}

function NationalTable({ apts, onSelect, isSaved }: {
  apts: NationalApt[];
  onSelect: (apt: Apartment, marketId: string, marketName: string, marketState: string) => void;
  isSaved: (id: string) => boolean;
}) {
  return (
    <Card pad={false}>
      <div className="p-5 pb-3">
        <SectionTitle sub="Top revenue-generating apartments across all 100 campuses · click any row to dive deeper">
          National revenue leaders
        </SectionTitle>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-line">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-center w-10">#</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Apartment</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Campus</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Distance</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. Beds</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. Annual Revenue</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Website</th>
            </tr>
          </thead>
          <tbody>
            {apts.map((apt, i) => (
              <tr key={apt.id + apt.marketId}
                onClick={() => onSelect(apt, apt.marketId, apt.marketName, apt.marketState)}
                className={`border-b border-line last:border-0 hover:bg-surface-2 transition-colors cursor-pointer ${
                  isSaved(apt.id) ? "bg-gold-soft/30" : ""
                }`}>
                <td className="px-4 py-3 text-center font-display font-semibold text-muted-2 text-lg">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isSaved(apt.id) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="var(--gold)" strokeWidth="2">
                        <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" />
                      </svg>
                    )}
                    <div>
                      <div className="font-medium text-ink">{apt.name}</div>
                      <div className="text-xs text-muted">{apt.street ?? "Address not listed"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-soft text-xs">
                  {apt.marketName}, {apt.marketState}
                </td>
                <td className="px-4 py-3 text-right num text-ink-soft">{apt.distanceMi.toFixed(1)} mi</td>
                <td className="px-4 py-3 text-right num font-semibold text-ink">{fmtNum(apt.estBeds)}</td>
                <td className="px-4 py-3 text-right num font-semibold text-good">{fmtMoney(apt.estAnnualRevenue)}</td>
                <td className="px-4 py-3">
                  {apt.website ? (
                    <a href={apt.website} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
                      Visit →
                    </a>
                  ) : apt.searchUrl ? (
                    <a href={apt.searchUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-muted hover:text-ink transition-colors">
                      Search →
                    </a>
                  ) : (
                    <span className="text-muted-2">n/a</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-line text-[11px] text-muted">
        Unit counts estimated from OSM building data. Revenue = units × regional avg rent × 12. Cached daily.
      </div>
    </Card>
  );
}

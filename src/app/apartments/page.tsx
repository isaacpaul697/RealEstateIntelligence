"use client";

import { useState, useMemo } from "react";
import { useScoredMarkets } from "@/lib/compute";
import { usePreloadedApartments } from "@/lib/live/allApartments";
import { Card, SectionTitle, Logo, Spinner, StateBlock } from "@/components/ui";
import { fmtNum } from "@/lib/scoring";
import { usePersistedState } from "@/lib/usePersistedState";
import { useWatchlist } from "@/lib/watchlist";
import ApartmentDrawer from "@/components/ApartmentDrawer";
import type { Apartment } from "@/lib/types";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

type SortKey = "alpha" | "size" | "state";

export default function ApartmentsPage() {
  const { scored, loading, error } = useScoredMarkets();
  const [sel, setSel] = usePersistedState<string>("cc.sel.school", "");
  const [search, setSearch] = useState("");
  const [sort, setSort] = usePersistedState<SortKey>("cc.sel.sort", "alpha");
  const [drawerApt, setDrawerApt] = useState<Apartment | null>(null);
  const { isSaved } = useWatchlist();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = scored.filter((m) => {
      if (!q) return true;
      return (
        m.market.shortName.toLowerCase().includes(q) ||
        m.market.name.toLowerCase().includes(q) ||
        m.market.state.toLowerCase().includes(q) ||
        m.market.city.toLowerCase().includes(q)
      );
    });
    if (sort === "alpha") list.sort((a, b) => a.market.shortName.localeCompare(b.market.shortName));
    else if (sort === "size") list.sort((a, b) => (b.market.enrollment ?? 0) - (a.market.enrollment ?? 0));
    else if (sort === "state") list.sort((a, b) => a.market.state.localeCompare(b.market.state) || a.market.shortName.localeCompare(b.market.shortName));
    return list;
  }, [scored, search, sort]);

  const active = sel || filtered[0]?.market.id;
  const market = scored.find((m) => m.market.id === active)?.market;
  const { apartments, loading: aptLoading } = usePreloadedApartments(active);

  if (loading) return <Spinner />;
  if (error) return <StateBlock title="Live feed unavailable" note="Could not load market data. Try refreshing." />;

  return (
    <div className="cc-fade">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Apartments</h1>
        <p className="text-sm text-muted mt-1">
          Real apartment buildings near each campus · sourced live from OpenStreetMap. Click any row to dive deeper.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSel(""); }}
          placeholder="Search school or state…"
          className="h-10 px-4 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong w-64"
          style={{ borderRadius: "var(--radius)" }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-10 px-4 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong"
          style={{ borderRadius: "var(--radius)" }}
        >
          <option value="alpha">Sort: A–Z</option>
          <option value="size">Sort: School size</option>
          <option value="state">Sort: State</option>
        </select>
        <select
          value={active}
          onChange={(e) => setSel(e.target.value)}
          className="h-10 px-4 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong flex-1 min-w-[200px]"
          style={{ borderRadius: "var(--radius)" }}
        >
          {filtered.map((m) => (
            <option key={m.market.id} value={m.market.id}>
              {m.market.shortName} — {m.market.city}, {m.market.state}
              {m.market.enrollment ? ` · ${fmtNum(m.market.enrollment)} students` : ""}
            </option>
          ))}
        </select>
      </div>

      {market && (
        <div className="flex items-center gap-3 mb-5">
          <Logo src={market.logo} abbr={market.abbr} color={market.brandColor} size={40} />
          <div>
            <div className="font-semibold text-ink">{market.shortName}</div>
            <div className="text-xs text-muted">
              {market.city}, {market.state}
              {market.enrollment ? ` · ${fmtNum(market.enrollment)} students` : ""}
            </div>
          </div>
        </div>
      )}

      {aptLoading ? (
        <Spinner label="Loading apartment data…" />
      ) : apartments.length === 0 ? (
        <StateBlock title="No apartments found" note="OpenStreetMap has no named apartment buildings within 3 mi of this campus." />
      ) : (
        <Card pad={false}>
          <div className="p-5 pb-3">
            <SectionTitle sub={`${apartments.length} named apartment buildings within 3 mi · click a row to dive deeper`}>
              Near {market?.shortName ?? "campus"}
            </SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Name</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Address</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Distance</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. Units</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">Est. Revenue/yr</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">Website</th>
                </tr>
              </thead>
              <tbody>
                {apartments.map((apt) => (
                  <tr key={apt.id}
                    onClick={() => setDrawerApt(apt)}
                    className={`border-b border-line last:border-0 hover:bg-surface-2 transition-colors cursor-pointer ${
                      isSaved(apt.id) ? "bg-gold-soft/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSaved(apt.id) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="var(--gold)" strokeWidth="2">
                            <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" />
                          </svg>
                        )}
                        <span className="font-medium text-ink">{apt.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{apt.street ?? "—"}</td>
                    <td className="px-4 py-3 text-right num text-ink-soft">{apt.distanceMi.toFixed(1)} mi</td>
                    <td className="px-4 py-3 text-right num text-ink">{fmtNum(apt.estUnits)}</td>
                    <td className="px-4 py-3 text-right num text-good font-medium">{fmtMoney(apt.estAnnualRevenue)}</td>
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
                        <span className="text-muted-2">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-line text-[11px] text-muted">
            Units estimated from OSM building data. Revenue = units × regional avg rent × 12.
          </div>
        </Card>
      )}

      <ApartmentDrawer
        apartment={drawerApt}
        marketId={active ?? ""}
        marketName={market?.shortName ?? ""}
        marketState={market?.state ?? ""}
        onClose={() => setDrawerApt(null)}
      />
    </div>
  );
}

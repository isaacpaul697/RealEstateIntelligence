"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useWatchlist } from "@/lib/watchlist";
import { Card, SectionTitle, Stat, StateBlock } from "@/components/ui";
import { fmtNum } from "@/lib/scoring";
import { timeAgo } from "@/lib/live/useMarketDetail";

function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return "$" + Math.round(n).toLocaleString("en-US");
}

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function WatchlistPage() {
  const { saved, remove, clear } = useWatchlist();

  const marketsCount = useMemo(
    () => new Set(saved.map((a) => a.marketId)).size,
    [saved],
  );

  const totalRevenue = useMemo(
    () => saved.reduce((sum, a) => sum + a.estAnnualRevenue, 0),
    [saved],
  );

  return (
    <div className="cc-fade">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
          Saved Apartments
        </h1>
        <p className="text-sm text-muted mt-1">
          Apartments you've marked for deeper diligence.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Saved properties" value={fmtNum(saved.length)} />
        <Stat label="Markets represented" value={fmtNum(marketsCount)} />
        <Stat label="Total est. revenue" value={fmtRevenue(totalRevenue)} />
      </div>

      {saved.length === 0 ? (
        <StateBlock
          title="No saved apartments"
          note="Click any apartment row to open its detail panel, then save it to your watchlist."
        />
      ) : (
        <>
          <Card pad={false}>
            <div className="p-5 pb-3">
              <SectionTitle sub={`${saved.length} saved apartment${saved.length === 1 ? "" : "s"}`}>
                Your Watchlist
              </SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 border-b border-line">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">
                      Apartment
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">
                      Campus
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                      Distance
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                      Est. Units
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                      Est. Annual Revenue
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">
                      Saved
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted text-left">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {saved.map((apt) => (
                    <tr key={apt.aptId} className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/market/${apt.marketId}`} className="block">
                          <div className="font-medium text-ink">{apt.aptName}</div>
                          <div className="text-xs text-muted">{apt.street ?? "—"}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <Link href={`/market/${apt.marketId}`} className="block">
                          {apt.marketName}, {apt.marketState}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right num text-ink-soft">
                        {apt.distanceMi.toFixed(1)} mi
                      </td>
                      <td className="px-4 py-3 text-right num text-ink">
                        {fmtNum(apt.estUnits)}
                      </td>
                      <td className="px-4 py-3 text-right num text-good font-medium">
                        {fmtMoney(apt.estAnnualRevenue)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {apt.notes
                          ? apt.notes.length > 40
                            ? apt.notes.slice(0, 40) + "..."
                            : apt.notes
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {timeAgo(apt.savedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(apt.aptId);
                          }}
                          className="text-xs text-muted hover:text-ink transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-line text-[11px] text-muted">
              Revenue estimates based on unit count x regional avg rent x 12.
            </div>
          </Card>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                if (window.confirm("Remove all saved apartments from your watchlist?")) {
                  clear();
                }
              }}
              className="text-xs text-muted hover:text-ink transition-colors px-3 py-1.5"
            >
              Clear all
            </button>
          </div>
        </>
      )}
    </div>
  );
}

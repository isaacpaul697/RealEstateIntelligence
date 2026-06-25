import Link from "next/link";
import { fetchBps } from "@/lib/dev/live/bps";
import { fetchFred } from "@/lib/dev/live/fred";
import { CITIES } from "@/lib/dev/cities";
import type { CityConfig } from "@/lib/dev/types";
import { NationalMap } from "@/components/dev/NationalMap";
import { TrendBars } from "@/components/dev/charts";
import { Card, SectionTitle, Stat, StateBlock } from "@/components/dev/ui";
import { fmtNum, fmtCompactUSD } from "@/lib/dev/format";

export const revalidate = 43200;

const STATE_NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "Washington, D.C.",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export default async function HomePage() {
  const [bps, fred] = await Promise.all([fetchBps(), fetchFred()]);

  const natUnits = bps ? bps.states.reduce((s, r) => s + r.totalUnits, 0) : null;
  const natMf = bps ? bps.states.reduce((s, r) => s + r.units5, 0) : null;
  const natSf = bps ? bps.states.reduce((s, r) => s + r.units1, 0) : null;
  const natValue = bps ? bps.states.reduce((s, r) => s + r.valueThousands, 0) * 1000 : null;

  const liveCities = CITIES.filter((c) => c.socrata);
  const stateGroups = Array.from(
    CITIES.reduce((m, c) => {
      (m.get(c.state) ?? m.set(c.state, []).get(c.state)!).push(c);
      return m;
    }, new Map<string, CityConfig[]>())
  )
    .map(([code, cities]) => ({
      code,
      cities: [...cities].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => (STATE_NAME[a.code] ?? a.code).localeCompare(STATE_NAME[b.code] ?? b.code));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold-deep font-semibold mb-2">National overview</p>
        <h1 className="font-display text-[34px] md:text-[40px] font-semibold text-ink leading-[1.05] tracking-tight max-w-3xl">
          Where America is building, and where it isn&apos;t.
        </h1>
        <p className="text-[15px] text-ink-soft mt-3 max-w-2xl">
          New-construction permit activity by state and structure type, straight from the U.S. Census
          Building Permits Survey. Search any supported city to explore individual developments, modeled
          economics, supply-gap recommendations, and the developers behind them.
        </p>
      </section>

      {bps ? (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label={`Units authorized · ${bps.year}`} value={fmtNum(natUnits)} provenance="live" sub="all structure types" />
            <Stat label="Multifamily (5+)" value={fmtNum(natMf)} provenance="live" sub={natUnits ? `${Math.round((natMf! / natUnits) * 100)}% of units` : undefined} />
            <Stat label="Single-family" value={fmtNum(natSf)} provenance="live" sub={natUnits ? `${Math.round((natSf! / natUnits) * 100)}% of units` : undefined} />
            <Stat label="Declared value" value={fmtCompactUSD(natValue)} provenance="live" sub="permit valuations" />
          </section>

          <section className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SectionTitle sub={`Census Building Permits Survey · annual state totals, ${bps.year}`}>
                Permit activity by state
              </SectionTitle>
              <NationalMap states={bps.states} />
            </div>
            <div className="flex flex-col gap-4">
              <Card>
                <SectionTitle sub="National units authorized per year">Construction trend</SectionTitle>
                <TrendBars data={bps.trend.map((t) => ({ label: `'${String(t.year).slice(2)}`, value: t.totalUnits }))} />
              </Card>
              <Card className="flex flex-col gap-3">
                <div className="text-xs text-muted">Market context (FRED)</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-soft">30-yr mortgage</span>
                  <span className="font-display text-lg font-semibold num">{fred.mortgageRate != null ? `${fred.mortgageRate.toFixed(2)}%` : "n/a"}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-soft">Housing starts</span>
                  <span className="font-display text-lg font-semibold num">{fred.housingStartsK != null ? `${fmtNum(fred.housingStartsK)}K` : "n/a"}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-soft">Constr. cost vs &apos;19</span>
                  <span className="font-display text-lg font-semibold num">{`${((fred.costMultiplier - 1) * 100).toFixed(0)}%`}</span>
                </div>
              </Card>
            </div>
          </section>

          <section>
            <SectionTitle sub="Live-permit portals show real valuations and developers. Every other city is mapped from OpenStreetMap footprints with modeled economics. Search any U.S. city above.">
              Explore a city
            </SectionTitle>

            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-good mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-good" /> Live permit portals
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {liveCities.map((c) => {
                  const row = bps.states.find((s) => s.state === c.state);
                  return (
                    <Link
                      key={c.id}
                      href={`/development/city/${c.id}`}
                      className="block bg-surface border border-line rounded-[var(--radius-card)] p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-[17px] font-semibold text-ink">{c.name}</span>
                        <span className="text-xs text-muted-2 shrink-0">{c.state}</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-good">
                          <span className="w-1.5 h-1.5 rounded-full bg-good" /> Live permit portal
                        </span>
                      </div>
                      {row && (
                        <div className="text-xs text-muted mt-1 num">
                          {fmtNum(row.totalUnits)} units authorized statewide ({bps.year})
                        </div>
                      )}
                      <div className="text-[13px] text-gold-deep font-semibold mt-3">Explore developments →</div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-2 mb-2">
              Browse by state
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {stateGroups.map(({ code, cities }) => (
                <details
                  key={code}
                  className="group bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow)] overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-surface-2 transition-colors">
                    <span className="font-display text-[15px] font-semibold text-ink">{STATE_NAME[code] ?? code}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-2 num">{cities.length}</span>
                      <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}
                        strokeLinecap="round" strokeLinejoin="round"
                        className="text-muted-2 transition-transform group-open:rotate-180">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-line px-2 py-2 flex flex-col">
                    {cities.map((c) => (
                      <Link
                        key={c.id}
                        href={`/development/city/${c.id}`}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[8px] text-[13.5px] text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
                      >
                        <span>{c.name}</span>
                        {c.socrata && (
                          <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0" title="Live permit portal" />
                        )}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : (
        <StateBlock
          title="Census Building Permits Survey is unavailable right now"
          note="The national feed didn't respond. No placeholder data is shown. Try again shortly, or open a supported city to explore its live permit portal directly."
        />
      )}
    </div>
  );
}

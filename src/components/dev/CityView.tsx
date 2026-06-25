import { toDevView } from "@/lib/dev/view";
import type { CityBundle } from "@/lib/dev/bundle";
import { CityExplorer } from "@/components/dev/CityExplorer";
import { GapPanel } from "@/components/dev/GapPanel";
import { DeveloperList } from "@/components/dev/DeveloperList";
import { TypeBars } from "@/components/dev/charts";
import { Card, SectionTitle, Stat, StateBlock } from "@/components/dev/ui";
import { fmtNum, fmtCompactUSD, fmtDuration } from "@/lib/dev/format";

/**
 * Shared city view body — KPI strip, map explorer, supply-gap panel, type mix,
 * demand context, and (portal cities only) the developer leaderboard. Rendered
 * for both registry/permit cities and OSM-backed areas. Mode controls the
 * provenance copy: permit cities can show live declared values, OSM areas are
 * always modeled (badged estimated).
 */
export function CityView({ bundle }: { bundle: CityBundle }) {
  const { city, ok, error, developments, kpis, gap, demand, developers, fred, mode } = bundle;
  const osm = mode === "osm";

  if (!ok || developments.length === 0) {
    return (
      <StateBlock
        title={osm ? "No mapped buildings found here" : "No live permit records available"}
        note={
          error ??
          (osm
            ? "OpenStreetMap returned no tagged building footprints for this area. Try a larger or more central place name."
            : "The city's open-data portal didn't return records. No placeholder data is shown.")
        }
      />
    );
  }

  const devViews = developments.map((d) => toDevView(d, fred.costMultiplier));
  const valueProvenance = !osm && kpis.withDeclaredValue > kpis.count / 2 ? "live" : "estimated";

  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Developments" value={fmtNum(kpis.count)} provenance="live" sub={osm ? "mapped buildings" : "recent permits"} />
        <Stat label="Units added" value={fmtNum(kpis.totalUnits)} provenance="live" sub="where reported" />
        <Stat
          label="Total value"
          value={fmtCompactUSD(valueProvenance === "live" ? kpis.declaredValueTotal : kpis.modeledValueTotal)}
          provenance={valueProvenance}
          sub={osm ? "modeled from footprints" : `${kpis.withDeclaredValue} declared · rest modeled`}
        />
        <Stat
          label="Avg time-to-build"
          value={kpis.avgDurationDays != null ? fmtDuration(kpis.avgDurationDays) : "n/a"}
          provenance="live"
          sub={kpis.avgDurationDays != null ? "issue to completion" : "modeled by type"}
        />
      </section>

      {demand.available && (
        <section>
          <SectionTitle sub="Live from the U.S. Census American Community Survey (5-year), for the county containing this city">
            Market demand
          </SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Stat
              label="Population"
              value={fmtNum(demand.population)}
              provenance="live"
              sub={demand.popGrowthPct != null ? `${demand.popGrowthPct >= 0 ? "+" : ""}${demand.popGrowthPct.toFixed(1)}% (5yr)` : undefined}
            />
            <Stat
              label="Households"
              value={fmtNum(demand.households)}
              provenance="live"
              sub={demand.householdGrowthPct != null ? `${demand.householdGrowthPct >= 0 ? "+" : ""}${demand.householdGrowthPct.toFixed(1)}% (5yr)` : undefined}
            />
            <Stat
              label="Median income"
              value={demand.medianIncome != null ? fmtCompactUSD(demand.medianIncome) : "n/a"}
              provenance="live"
              sub="household"
            />
            <Stat
              label="Median rent"
              value={demand.medianRent != null ? `$${fmtNum(demand.medianRent)}` : "n/a"}
              provenance="live"
              sub="gross, monthly"
            />
            <Stat
              label="Rental vacancy"
              value={demand.vacancyPct != null ? `${demand.vacancyPct.toFixed(1)}%` : "n/a"}
              provenance="live"
              sub={demand.vacancyPct != null && demand.vacancyPct < 5 ? "tight supply" : "supply slack"}
            />
            <Stat
              label="Renter share"
              value={demand.renterPct != null ? `${demand.renterPct.toFixed(0)}%` : "n/a"}
              provenance="live"
              sub="of occupied homes"
            />
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionTitle sub={osm ? "Filter by type, sized by estimated value" : "Filter by type, issue date, and estimated value"}>
            {osm ? "Mapped developments" : "Recent developments"}
          </SectionTitle>
          <CityExplorer
            devs={devViews}
            center={[city.lat, city.lng]}
            zoom={city.zoom}
            cityLabel={city.state ? `${city.name}, ${city.state}` : city.name}
          />
        </div>
        <div className="flex flex-col gap-4">
          <GapPanel gap={gap} />
          <Card>
            <SectionTitle sub={osm ? "Share of mapped buildings" : "Share of recent permits"}>Type mix</SectionTitle>
            <TypeBars counts={kpis.byType} total={kpis.count} />
          </Card>
        </div>
      </section>

      {developers.length > 0 && (
        <section>
          <SectionTitle sub="Most active firms by permit count, permit-derived activity, not legal ownership">
            Developers &amp; builders
          </SectionTitle>
          <DeveloperList city={city.id} developers={developers.slice(0, 12)} />
        </section>
      )}
    </>
  );
}

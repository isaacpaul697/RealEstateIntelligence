import { toDevView } from "@/lib/dev/view";
import type { CityBundle } from "@/lib/dev/bundle";
import { CityExplorer } from "@/components/dev/CityExplorer";
import { CityKpiStrip } from "@/components/dev/CityKpiStrip";
import { GapPanel } from "@/components/dev/GapPanel";
import { DeveloperList } from "@/components/dev/DeveloperList";
import { TypeBars } from "@/components/dev/charts";
import { Card, SectionTitle, Stat, StateBlock } from "@/components/dev/ui";
import { fmtNum, fmtCompactUSD } from "@/lib/dev/format";
import type { CityKpis } from "@/lib/dev/aggregate";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthYear(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""} ${y}`.trim();
}

/**
 * Honest "what you're looking at" notes for a live-permit city. Every line is
 * derived from the data actually returned, never assumed: if a portal has gone
 * stale we name the real cutoff year; if it omits valuations we say so plainly
 * instead of letting a modeled figure read as declared. OSM-mapped areas already
 * carry their own modeled-data disclaimer, so this only runs for permit cities.
 */
function buildDataNotes(kpis: CityKpis): string[] {
  const notes: string[] = [];
  const latest = kpis.latestDate;
  if (latest) {
    const ageMonths = (Date.now() - Date.parse(latest)) / 2.628e9; // ~ms per month
    if (ageMonths > 18) {
      notes.push(
        `This city's open-data portal appears to have stopped updating around ${latest.slice(0, 4)}. The most recent permit on file is from ${monthYear(latest)}, so the figures below reflect that period rather than today.`,
      );
    }
  }
  if (kpis.withDeclaredValue === 0) {
    notes.push('This feed does not report permit valuations, so "Total value" is modeled (estimated) rather than declared.');
  }
  return notes;
}

/**
 * Shared city view body: KPI strip, map explorer, supply-gap panel, type mix,
 * demand context, and (portal cities only) the developer leaderboard. Rendered
 * for both registry/permit cities and OSM-backed areas. Mode controls the
 * provenance copy: permit cities can show live declared values, OSM areas are
 * always modeled (badged estimated).
 */
export function CityView({ bundle, showKpis = true }: { bundle: CityBundle; showKpis?: boolean }) {
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
  const dataNotes = osm ? [] : buildDataNotes(kpis);

  return (
    <>
      {dataNotes.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-line bg-warn-soft px-4 py-3">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" className="text-warn shrink-0 mt-0.5">
            <circle cx={12} cy={12} r={9} /><path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          <div className="text-[12.5px] text-ink-soft leading-relaxed">
            <span className="font-semibold text-warn">Data note. </span>
            {dataNotes.join(" ")}
          </div>
        </div>
      )}

      {showKpis && <CityKpiStrip bundle={bundle} />}

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
            osm={osm}
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

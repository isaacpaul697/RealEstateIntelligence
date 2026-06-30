import { Stat } from "@/components/dev/ui";
import { fmtNum, fmtCompactUSD } from "@/lib/dev/format";
import { TYPE_LABEL, type PropertyType } from "@/lib/dev/types";
import type { CityBundle } from "@/lib/dev/bundle";

/**
 * The 4-up headline KPI strip for a city/area: development count, total value,
 * average project size, and leading property type. Extracted so it can render
 * both inside the CityView body (area page) and up in the city-page header,
 * where it height-matches the tall live state-outline graphic. Value provenance
 * is honest: declared (live) only when the portal actually reports valuations
 * on most records, otherwise modeled (estimated).
 */
export function CityKpiStrip({ bundle, className }: { bundle: CityBundle; className?: string }) {
  const { kpis, mode } = bundle;
  const osm = mode === "osm";
  const valueProvenance = !osm && kpis.withDeclaredValue > kpis.count / 2 ? "live" : "estimated";
  const valueTotal = valueProvenance === "live" ? kpis.declaredValueTotal : kpis.modeledValueTotal;
  const avgValue = kpis.count > 0 ? valueTotal / kpis.count : null;
  const topType = (Object.entries(kpis.byType) as [PropertyType, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const leadingType = topType && topType[1] > 0 ? topType[0] : null;
  const leadingShare = leadingType ? Math.round((topType[1] / kpis.count) * 100) : null;

  return (
    <section className={className ?? "grid grid-cols-2 md:grid-cols-4 gap-3"}>
      <Stat label="Developments" value={fmtNum(kpis.count)} provenance="live" sub={osm ? "mapped buildings" : "recent permits"} />
      <Stat
        label="Total value"
        value={fmtCompactUSD(valueTotal)}
        provenance={valueProvenance}
        sub={osm ? "modeled from footprints" : `${kpis.withDeclaredValue} declared · rest modeled`}
      />
      <Stat
        label="Avg project size"
        value={avgValue != null ? fmtCompactUSD(avgValue) : "n/a"}
        provenance={valueProvenance}
        sub="value per development"
      />
      <Stat
        label="Leading type"
        value={leadingType ? TYPE_LABEL[leadingType] : "n/a"}
        provenance="live"
        sub={leadingShare != null ? `${leadingShare}% of ${osm ? "mapped buildings" : "recent permits"}` : undefined}
      />
    </section>
  );
}

export default CityKpiStrip;

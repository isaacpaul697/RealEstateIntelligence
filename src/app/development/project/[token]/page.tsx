import { notFound } from "next/navigation";
import Link from "next/link";
import { decodeId } from "@/lib/dev/format";
import { getCityBundle } from "@/lib/dev/bundle";
import { getCity } from "@/lib/dev/cities";
import { slugToQuery } from "@/lib/dev/area";
import { fetchOsmElement } from "@/lib/dev/live/osmDevelopments";
import { fetchFred } from "@/lib/dev/live/fred";
import { toDevView, type DevView } from "@/lib/dev/view";
import { fetchLandUse } from "@/lib/dev/live/overpass";
import { slugifyDeveloper } from "@/lib/dev/aggregate";
import { DevMap } from "@/components/dev/DevMap";
import { Card, SectionTitle, TypePill, ProvenanceTag, StateBlock } from "@/components/dev/ui";
import type { Metric } from "@/lib/dev/types";
import { fmtCompactUSD, fmtDate, fmtDuration, fmtNum } from "@/lib/dev/format";

export const revalidate = 43200;

interface Resolved {
  view: DevView;
  cityName: string;
  cityState: string;
  backHref: string;
  /** Developer links only resolve for registry/permit cities. */
  developerCity: string | null;
}

/** Resolve a development token to either a permit-portal record or an OSM element. */
async function resolve(id: string): Promise<Resolved | null> {
  const cityId = id.split(":")[0];
  const registry = getCity(cityId);

  if (registry?.socrata) {
    const bundle = await getCityBundle(cityId);
    const dev = bundle?.developments.find((d) => d.id === id);
    if (!bundle || !dev) return null;
    return {
      view: toDevView(dev, bundle.fred.costMultiplier),
      cityName: bundle.city.name,
      cityState: bundle.city.state,
      backHref: `/development/city/${cityId}`,
      developerCity: cityId,
    };
  }

  // OSM-backed: permitNumber is "<osmtype>-<id>". Covers both free-text areas
  // and registry cities that have no permit portal.
  const permitNumber = id.slice(cityId.length + 1);
  const m = permitNumber.match(/^(way|relation|node)-(\d+)$/);
  if (!m) return null;
  const [fred, dev] = await Promise.all([fetchFred(), fetchOsmElement(m[1], Number(m[2]), cityId)]);
  if (!dev) return null;
  const query = slugToQuery(cityId);
  return {
    view: toDevView(dev, fred.costMultiplier),
    cityName: registry ? registry.name : query.replace(/\b\w/g, (c) => c.toUpperCase()),
    cityState: registry ? registry.state : "",
    backHref: registry ? `/development/city/${cityId}` : `/development/area?q=${encodeURIComponent(query)}`,
    developerCity: null,
  };
}

export default async function DevelopmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let id: string;
  try {
    id = decodeId(token);
  } catch {
    notFound();
  }

  const resolved = await resolve(id!);
  if (!resolved) {
    return (
      <StateBlock
        title="Development not found"
        note="This record may have rolled out of the recent live window. Open the city to browse current developments."
      />
    );
  }

  const { view, cityName, cityState, backHref, developerCity } = resolved;
  const nearby = await fetchLandUse(view.lat, view.lng, 800);
  const place = cityState ? `${cityName}, ${cityState}` : cityName;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link href={backHref} className="text-xs text-muted hover:text-ink">← {cityName}</Link>
        <div className="flex items-center gap-3 mt-1">
          <TypePill type={view.type} />
          {view.status && <span className="text-xs text-muted">{view.status}</span>}
        </div>
        <h1 className="font-display text-[28px] font-semibold text-ink leading-tight tracking-tight mt-1.5">{view.address}</h1>
        <p className="text-sm text-ink-soft mt-1">{view.description || view.rawType}</p>
        <p className="text-xs text-muted-2 mt-1 num">{view.permitNumber} · {place}</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <MetricCard label="Development cost" metric={view.cost} format={fmtCompactUSD} />
        <MetricCard label="Land cost" metric={view.land} format={fmtCompactUSD} />
        <DurationCard metric={view.durationDays} />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionTitle sub="Project location + nearby context">On the map</SectionTitle>
          <DevMap devs={[view]} center={[view.lat, view.lng]} zoom={16} height={420} />
        </div>
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2.5">
            <SectionTitle sub="Permit-derived — not a legal title record">Developer / owner</SectionTitle>
            {view.developer ? (
              developerCity ? (
                <Link
                  href={`/development/developer/${developerCity}/${slugifyDeveloper(view.developer)}`}
                  className="font-display text-[16px] font-semibold text-gold-deep hover:underline"
                >
                  {view.developer} →
                </Link>
              ) : (
                <span className="font-display text-[16px] font-semibold text-ink">{view.developer}</span>
              )
            ) : (
              <span className="text-sm text-muted">Not reported for this building</span>
            )}
            <div className="text-xs text-muted num pt-1">
              {view.units != null && <div>Units: {fmtNum(view.units)}</div>}
              {view.sqft != null && <div>Floor area: {fmtNum(view.sqft)} sqft</div>}
              <div>Issued: {fmtDate(view.issueDate)}</div>
              {view.completeDate && <div>Completed: {fmtDate(view.completeDate)}</div>}
            </div>
          </Card>

          <Card className="flex flex-col gap-2">
            <SectionTitle sub="OpenStreetMap land-use within 800m">Surrounding land use</SectionTitle>
            {nearby.available ? (
              <div className="flex flex-col gap-1.5 text-xs">
                {(["residential", "commercial", "retail", "industrial", "office"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="capitalize text-ink-soft">{k}</span>
                    <span className="num text-muted">{Math.round(nearby.shares[k] * 100)}%</span>
                  </div>
                ))}
                <span className="text-[10px] text-muted-2 pt-1">{nearby.total} tagged features nearby</span>
              </div>
            ) : (
              <span className="text-sm text-muted">No OSM land-use features nearby.</span>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, metric, format }: { label: string; metric: Metric; format: (n: number | null) => string }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs text-muted flex items-center justify-between">
        {label}
        <ProvenanceTag p={metric.provenance} note={metric.note} />
      </span>
      <span className="font-display text-[28px] font-semibold text-ink num leading-none">{format(metric.value)}</span>
      {metric.note && <span className="text-[11px] text-muted-2 leading-snug">{metric.note}</span>}
    </Card>
  );
}

function DurationCard({ metric }: { metric: Metric }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs text-muted flex items-center justify-between">
        Development duration
        <ProvenanceTag p={metric.provenance} note={metric.note} />
      </span>
      <span className="font-display text-[28px] font-semibold text-ink num leading-none">{fmtDuration(metric.value)}</span>
      {metric.note && <span className="text-[11px] text-muted-2 leading-snug">{metric.note}</span>}
    </Card>
  );
}

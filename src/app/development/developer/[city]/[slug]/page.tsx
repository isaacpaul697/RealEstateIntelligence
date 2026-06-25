import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBundle } from "@/lib/dev/bundle";
import { slugifyDeveloper } from "@/lib/dev/aggregate";
import { toDevView } from "@/lib/dev/view";
import { fetchWiki, firmLogo } from "@/lib/dev/live/wikipedia";
import { DevMap } from "@/components/dev/DevMap";
import { TypeBars } from "@/components/dev/charts";
import { Card, SectionTitle, Stat, TypePill, FirmLogo, StateBlock } from "@/components/dev/ui";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/dev/types";
import { fmtCompactUSD, fmtNum, fmtDate } from "@/lib/dev/format";

export const revalidate = 43200;

export default async function DeveloperPage({ params }: { params: Promise<{ city: string; slug: string }> }) {
  const { city: cityId, slug } = await params;
  const bundle = await getCityBundle(cityId);
  if (!bundle) notFound();

  const matches = bundle.developments.filter(
    (d) => d.developer && slugifyDeveloper(d.developer) === slug,
  );
  if (matches.length === 0) {
    return (
      <StateBlock title="Developer not found" note="No live permits in the current window match this firm in this city." />
    );
  }

  const name = matches[0].developer!;
  const views = matches.map((d) => toDevView(d, bundle.fred.costMultiplier));
  const wiki = await fetchWiki(name);

  const byType = {} as Record<PropertyType, number>;
  for (const t of PROPERTY_TYPES) byType[t] = 0;
  let totalValue = 0, totalUnits = 0;
  const dates: string[] = [];
  for (const v of views) {
    byType[v.type]++;
    totalUnits += v.units ?? 0;
    if (v.cost.value != null) totalValue += v.cost.value;
    if (v.issueDate) dates.push(v.issueDate);
  }
  dates.sort();
  const center: [number, number] = [
    views.reduce((s, v) => s + v.lat, 0) / views.length,
    views.reduce((s, v) => s + v.lng, 0) / views.length,
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start gap-4">
        <FirmLogo src={firmLogo(name)} name={name} size={56} />
        <div className="min-w-0">
          <Link href={`/development/city/${cityId}`} className="text-xs text-muted hover:text-ink">← {bundle.city.name} developers</Link>
          <h1 className="font-display text-[28px] font-semibold text-ink leading-tight tracking-tight mt-0.5">{name}</h1>
          <p className="text-xs text-muted-2 mt-1">
            Permit-derived activity in {bundle.city.name}, {bundle.city.state}, not a legal title/ownership record.
          </p>
        </div>
      </section>

      {wiki?.summary && (
        <Card>
          <p className="text-sm text-ink-soft leading-relaxed">{wiki.summary}</p>
          {wiki.url && (
            <a href={wiki.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-deep hover:underline mt-2 inline-block">
              Wikipedia →
            </a>
          )}
        </Card>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Projects" value={fmtNum(matches.length)} provenance="live" sub="recent permits" />
        <Stat label="Units" value={fmtNum(totalUnits)} provenance="live" sub="where reported" />
        <Stat label="Est. portfolio value" value={fmtCompactUSD(totalValue)} provenance="estimated" sub="declared + modeled" />
        <Stat label="Active window" value={dates.length ? `${fmtDate(dates[0]).split(",")[0]}` : "n/a"} provenance="live" sub={dates.length ? `→ ${fmtDate(dates[dates.length - 1])}` : undefined} />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionTitle sub="Every recent development tied to this firm">Portfolio map</SectionTitle>
          <DevMap devs={views} center={center} zoom={bundle.city.zoom} />
        </div>
        <Card>
          <SectionTitle sub="By property type">Portfolio mix</SectionTitle>
          <TypeBars counts={byType} total={matches.length} />
        </Card>
      </section>

      <section>
        <SectionTitle sub="Highest estimated value first">Projects</SectionTitle>
        <div className="grid gap-2.5 md:grid-cols-2">
          {[...views].sort((a, b) => (b.cost.value ?? 0) - (a.cost.value ?? 0)).map((v) => (
            <Link
              key={v.id}
              href={`/development/project/${v.token}`}
              className="block bg-surface border border-line rounded-[var(--radius-card)] p-4 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <TypePill type={v.type} />
                <span className="font-display text-[15px] font-semibold num">{fmtCompactUSD(v.cost.value)}</span>
              </div>
              <div className="font-display text-[14px] font-semibold text-ink mt-1.5">{v.address}</div>
              <div className="text-xs text-muted num mt-0.5">{fmtDate(v.issueDate)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

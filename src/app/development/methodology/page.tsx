import { METHODOLOGY } from "@/lib/dev/model";
import { CITIES } from "@/lib/dev/cities";
import { Card, SectionTitle, ProvenanceTag } from "@/components/dev/ui";

export const metadata = { title: "Methodology · Real-Estate Development Intelligence" };

const SOURCES = [
  { name: "Census Building Permits Survey (BPS)", use: "National/state new-construction permits by structure type + trend", key: "Keyless CSV", url: "https://www.census.gov/construction/bps/" },
  { name: "City open-data portals (Socrata SODA)", use: "Detailed permit records: type, valuation, dates, developer, geo", key: "Keyless (optional app token)", url: "https://dev.socrata.com/" },
  { name: "Census ACS 5-year", use: "Population, households, vacancy, tenure, income, growth (demand side)", key: "Free key (CENSUS_API_KEY)", url: "https://www.census.gov/data/developers/data-sets/acs-5year.html" },
  { name: "OpenStreetMap Overpass", use: "Building footprints as mapped developments for cities without a portal, plus land-use mix for area context + gap baseline", key: "Keyless", url: "https://overpass-api.de/" },
  { name: "OpenStreetMap Nominatim", use: "Geocode a typed city/area to a center + bounding box", key: "Keyless (UA required)", url: "https://nominatim.org/" },
  { name: "Census Geocoder", use: "Resolve any geocoded point to its county FIPS so ACS demand works for every city", key: "Keyless", url: "https://geocoding.geo.census.gov/" },
  { name: "FRED", use: "Construction-cost inflation multiplier + housing context", key: "Keyless CSV", url: "https://fred.stlouisfed.org/" },
  { name: "Wikipedia REST", use: "Developer-firm summaries when recognizable", key: "Keyless", url: "https://en.wikipedia.org/api/rest_v1/" },
];

export default function MethodologyPage() {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <h1 className="font-display text-[30px] font-semibold text-ink tracking-tight">Methodology &amp; data sources</h1>
        <p className="text-[15px] text-ink-soft mt-2 max-w-2xl">
          Every number on this site is either pulled <strong className="text-good">live</strong> from a free
          public source, or <strong className="text-warn">estimated</strong>, modeled from live inputs with the
          formula shown below. Nothing is hardcoded, seeded, or invented. When a source is unavailable, the
          affected view degrades with a clear message rather than substituting fake data.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <span className="flex items-center gap-1.5 text-sm"><ProvenanceTag p="live" /> pulled from a source</span>
          <span className="flex items-center gap-1.5 text-sm"><ProvenanceTag p="estimated" /> modeled from live inputs</span>
        </div>
      </section>

      <section>
        <SectionTitle sub="What each metric is and how it's derived">Metric provenance</SectionTitle>
        <Card pad={false}>
          <div className="divide-y divide-line">
            {METHODOLOGY.map((m) => (
              <div key={m.metric} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="sm:w-56 shrink-0 flex items-center gap-2">
                  <ProvenanceTag p={m.provenance} />
                  <span className="text-sm font-semibold text-ink">{m.metric}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] text-ink-soft font-mono">{m.formula}</div>
                  <div className="text-[11px] text-muted-2 mt-0.5">{m.source}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle sub="All free: keyless or free-tier key from an env var">Data sources</SectionTitle>
        <div className="grid md:grid-cols-2 gap-3">
          {SOURCES.map((s) => (
            <Card key={s.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-display text-[15px] font-semibold text-gold-deep hover:underline">
                  {s.name}
                </a>
                <span className="text-[10px] uppercase tracking-wide text-muted-2 shrink-0">{s.key}</span>
              </div>
              <p className="text-[13px] text-ink-soft">{s.use}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle sub="Cities with live detailed permit portals; more can be added to the registry easily">
          Supported cities
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.socrata).map((c) => (
            <span key={c.id} className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-sm text-ink-soft">
              {c.name}, {c.state}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-2 mt-3 max-w-2xl">
          {CITIES.filter((c) => !c.socrata).length}+ more cities are listed on the home page and any other city you
          search is still mapped: developments are drawn from OpenStreetMap building footprints, classified by type,
          with economics modeled from footprint geometry (badged estimated) and ACS demand resolved via the Census
          Geocoder, with a clear note that real permit valuations and developer names aren&apos;t available there.
        </p>
      </section>
    </div>
  );
}

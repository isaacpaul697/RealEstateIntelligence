import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBundle } from "@/lib/dev/bundle";
import { CityView } from "@/components/dev/CityView";
import { CityKpiStrip } from "@/components/dev/CityKpiStrip";
import { CityNews } from "@/components/dev/CityNews";
import { fetchNews, developmentQuery } from "@/lib/live/news";
import { fmtNum } from "@/lib/dev/format";
import { stateShape } from "@/lib/dev/stateShape";
import { StateOutlineGraphic } from "@/components/dev/StateOutlineGraphic";

export const revalidate = 43200;

export default async function CityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getCityBundle(id);
  if (!bundle) notFound();

  const { city, ok, developments, mode } = bundle;
  const osm = mode === "osm";
  const news = await fetchNews(developmentQuery(city.name, city.state), 8);
  const shape = stateShape(city.state, { lat: city.lat, lng: city.lng });

  return (
    <div className="flex flex-col gap-7">
      <section className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <div>
            <Link href="/national" className="text-xs text-muted hover:text-ink">← National overview</Link>
            <h1 className="font-display text-[32px] font-semibold text-ink leading-tight tracking-tight mt-1">
              {city.name}, {city.state}
            </h1>
            <p className="text-sm text-ink-soft mt-1">
              {!ok
                ? "Detailed development data is unavailable for this city right now."
                : osm
                  ? `${fmtNum(developments.length)} developments mapped from OpenStreetMap building footprints · economics modeled (estimated) · pins color-coded by property type.`
                  : `${fmtNum(developments.length)} recent developments from the city open-data portal · pins color-coded by property type.`}
            </p>
          </div>
          {ok && developments.length > 0 && <CityKpiStrip bundle={bundle} />}
        </div>
        {shape && (
          <StateOutlineGraphic
            shape={shape}
            cityName={city.name}
            statePostal={city.state}
            developments={developments.length}
          />
        )}
      </section>

      <CityView bundle={bundle} showKpis={false} />

      <CityNews articles={news} city={`${city.name}, ${city.state}`} />
    </div>
  );
}

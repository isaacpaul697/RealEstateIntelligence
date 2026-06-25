import Link from "next/link";
import { redirect } from "next/navigation";
import { getAreaBundle } from "@/lib/dev/area";
import { CITIES } from "@/lib/dev/cities";
import { CityView } from "@/components/dev/CityView";
import { StateBlock } from "@/components/dev/ui";

export const revalidate = 43200;

export default async function AreaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  if (!q) {
    return <StateBlock title="Search for an area" note="Type a city or area in the search box to explore it." />;
  }

  // If the query is one of our full-portal cities, send them to the rich permit view.
  const lower = q.toLowerCase();
  const reg = CITIES.find((c) => lower.includes(c.name.toLowerCase()));
  if (reg) redirect(`/development/city/${reg.id}`);

  const { place, bundle } = await getAreaBundle(q);
  if (!place || !bundle) {
    return <StateBlock title={`Couldn't locate “${q}”`} note="Try a more specific city or area name." />;
  }

  const shortName = place.displayName.split(",").slice(0, 2).join(", ");

  return (
    <div className="flex flex-col gap-7">
      <section>
        <Link href="/development" className="text-xs text-muted hover:text-ink">← National overview</Link>
        <h1 className="font-display text-[32px] font-semibold text-ink leading-tight tracking-tight mt-1">{shortName}</h1>
        <p className="text-sm text-ink-soft mt-1">
          {bundle.ok
            ? `${bundle.developments.length.toLocaleString()} mapped developments from OpenStreetMap building data · pins color-coded by property type.`
            : place.displayName}
        </p>
        <p className="text-xs text-muted-2 mt-2 max-w-2xl">
          This area has no connected open-data permit portal, so developments are drawn from OpenStreetMap building
          footprints. Values and durations are <strong className="text-warn">modeled</strong> from footprint geometry
          and building type (badged estimated) — never invented. Permit dates and developer names aren&apos;t available
          here.
        </p>
      </section>

      <CityView bundle={bundle} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { Card, SectionTitle } from "@/components/dev/ui";
import { SectorHeader } from "@/components/dev/SectorHeader";
import { SectorPlayers, SectorNews, type PlayerRow } from "@/components/dev/SectorIntel";
import { SECTORS } from "@/lib/dev/sectorDefs";
import { sectorPlayers } from "@/lib/dev/sectors";
import { fetchFilings } from "@/lib/dev/live/edgar";
import { fetchNews } from "@/lib/live/news";

export const revalidate = 43200;

export function generateStaticParams() {
  return Object.keys(SECTORS).map((sector) => ({ sector }));
}

export default async function SectorPlayersPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const def = SECTORS[sector];
  if (!def) notFound();

  const players = sectorPlayers(sector);

  // ── Live intel for this asset class: major public operators with their
  //    latest SEC filings, and a sector-tuned Google News feed.
  const [articles, playerRows] = await Promise.all([
    players ? fetchNews(players.newsQuery, 8) : Promise.resolve([]),
    players
      ? Promise.all(
          players.companies.map(
            async (c): Promise<PlayerRow> => ({ company: c, filings: await fetchFilings(c.cik, 4) }),
          ),
        )
      : Promise.resolve([] as PlayerRow[]),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <SectorHeader sector={sector} />

      {players ? (
        <>
          <SectorPlayers rows={playerRows} intro={players.playersIntro} accent={def.color} label={def.label} />
          <SectorNews articles={articles} label={def.label} />
        </>
      ) : (
        <Card>
          <SectionTitle sub="No public-operator roster for this class yet">Players &amp; news</SectionTitle>
          <div className="text-[13px] text-muted leading-relaxed">
            A curated roster of public operators for this asset class isn&apos;t available yet.
          </div>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import { SectorPlayers, SectorNews, type PlayerRow } from "@/components/dev/SectorIntel";
import { STUDENT_HOUSING_PLAYERS } from "@/lib/live/players";
import { fetchFilings } from "@/lib/dev/live/edgar";
import { fetchNews } from "@/lib/live/news";

export const revalidate = 43200;

/** Gold accent so the shared sector components match the housing theme. */
const ACCENT = "#9a7b2e";

export default async function PlayersPage() {
  const cfg = STUDENT_HOUSING_PLAYERS;

  // Live intel: each firm's latest SEC filings (EDGAR) and a student-housing
  // news feed (Google News RSS). Both fetched in parallel; nothing fabricated.
  const [articles, playerRows] = await Promise.all([
    fetchNews(cfg.newsQuery, 10),
    Promise.all(
      cfg.companies.map(
        async (c): Promise<PlayerRow> => ({ company: c, filings: await fetchFilings(c.cik, 4) }),
      ),
    ),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <section>
        <Link href="/student-housing" className="text-xs text-muted hover:text-ink">← Student housing home</Link>
        <h1 className="font-display text-[32px] md:text-[38px] font-semibold text-ink leading-tight tracking-tight mt-2">
          Major players &amp; recent moves
        </h1>
        <p className="text-[15px] text-ink-soft mt-2 max-w-2xl">
          The public-market firms shaping purpose-built student housing, each with its latest SEC
          filings and a live sector news feed. Filings refresh from EDGAR and headlines from Google
          News twice daily; every company and CIK is verified public reference, and no activity is
          fabricated.
        </p>
      </section>

      <SectorPlayers rows={playerRows} intro={cfg.playersIntro} accent={ACCENT} label="Student housing" />
      <SectorNews articles={articles} label="Student housing" />
    </div>
  );
}

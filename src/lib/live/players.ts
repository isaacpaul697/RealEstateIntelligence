import type { SectorPlayersConfig } from "@/lib/dev/sectors";

/**
 * Major public-market players with direct purpose-built student-housing
 * exposure.
 *
 * Purpose-built student housing has largely consolidated into private hands:
 * American Campus Communities was taken private by Blackstone in 2022 and
 * Education Realty Trust was acquired by Greystar in 2018, so the pure-play
 * public REITs no longer trade. This roster therefore blends the sector's
 * defining REIT with the institutional owners that have consolidated it and
 * the apartment REITs most concentrated in university metros.
 *
 * Every CIK below was verified against SEC EDGAR (data.sec.gov). The roster is
 * public reference fact; each firm's actual filing activity is pulled live from
 * EDGAR and headlines come live from Google News, so nothing here is fabricated.
 * Where a firm has gone private, its most recent filings are historical and the
 * displayed dates make that plain.
 */
export const STUDENT_HOUSING_PLAYERS: SectorPlayersConfig = {
  newsQuery:
    'student housing ("purpose-built" OR university OR "off-campus" OR "student accommodation") (acquisition OR development OR REIT OR "rent growth" OR occupancy OR enrollment)',
  playersIntro:
    "Purpose-built student housing has largely moved into private hands, so this roster blends the sector's defining REIT with the institutional owners that acquired it and the apartment REITs most exposed to university metros. Recent activity is pulled live from each firm's SEC filings.",
  companies: [
    {
      name: "Greystar",
      ticker: "PRIVATE",
      cik: null,
      note: "Largest US student-housing operator (via its 2018 EdR acquisition); privately held.",
      site: "greystar.com",
    },
    {
      name: "American Campus Communities",
      ticker: "ACC",
      cik: 1283630,
      note: "Pioneered purpose-built student housing as a public REIT; taken private by Blackstone in 2022, so its filings are historical.",
      site: "americancampus.com",
    },
    {
      name: "Blackstone Real Estate Income Trust",
      ticker: "BREIT",
      cik: 1662972,
      note: "Acquired American Campus Communities; now among the largest owners of US purpose-built student housing.",
      site: "breit.com",
    },
    {
      name: "Blackstone",
      ticker: "BX",
      cik: 1393818,
      note: "Sponsor of the American Campus take-private and the largest institutional owner of US student housing.",
      site: "blackstone.com",
    },
    {
      name: "Brookfield",
      ticker: "BN",
      cik: 1001085,
      note: "Global real-asset owner-operator with a sizable purpose-built student-accommodation platform.",
      site: "brookfield.com",
    },
    {
      name: "Mid-America Apartment Communities",
      ticker: "MAA",
      cik: 912595,
      note: "Sun Belt apartment REIT with heavy exposure to fast-growing university metros.",
      site: "maac.com",
    },
    {
      name: "Independence Realty Trust",
      ticker: "IRT",
      cik: 1466085,
      note: "Sun Belt apartment REIT concentrated in college-town and high-growth markets.",
      site: "irtliving.com",
    },
  ],
};

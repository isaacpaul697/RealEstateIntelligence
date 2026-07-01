/**
 * Reference profiles for the major-player firms shown in "Major players & moves"
 * on both the multifamily and student-housing sides.
 *
 * These are public reference facts, the same category as our CITIES or roster
 * data: what a firm does, when it was founded, where it is based, the markets it
 * concentrates in, and well-documented milestones (IPOs, mergers, take-privates).
 * They contain no invented figures. The hard numbers a user sees in a firm's
 * drawer come from two live sources instead: reported financials pulled from the
 * SEC EDGAR XBRL company-facts API, and a company-scoped Google News feed. For
 * the one privately-held firm here (Greystar, no SEC registration) there is no
 * live financial feed, so its published headline figures are listed explicitly
 * with sources.
 */

export interface RefStat {
  label: string;
  value: string;
  sub?: string;
}

export interface RefMilestone {
  year: string;
  title: string;
  detail: string;
}

export interface RefSource {
  label: string;
  url: string;
}

export interface CompanyReference {
  /** e.g. "Public (NYSE: AVB)" or "Privately held". */
  ownership: string;
  founded?: string;
  /** Fallback headquarters; the live EDGAR profile is preferred when present. */
  headquarters?: string;
  tagline: string;
  overview: string[];
  /** Qualitative, factual bullets (markets, strategy, brands). */
  highlights: string[];
  /** Published headline figures, used when no live financials exist (private). */
  stats?: RefStat[];
  milestones?: RefMilestone[];
  sources?: RefSource[];
}

export const COMPANY_REFERENCE: Record<string, CompanyReference> = {
  // ── Multifamily REITs ──────────────────────────────────────────────
  AVB: {
    ownership: "Public (NYSE: AVB)",
    founded: "1998 (via merger)",
    headquarters: "Arlington, Virginia",
    tagline: "A blue-chip apartment REIT developing and owning upscale communities in high-barrier coastal markets.",
    overview: [
      "AvalonBay Communities was formed in 1998 through the merger of Avalon Properties and Bay Apartment Communities. It is one of the largest apartment REITs in the United States and a member of the S&P 500, focused on developing, redeveloping, acquiring, and managing apartment communities in leading metropolitan areas.",
      "Its strategy centers on high-barrier-to-entry markets where new supply is constrained, complemented by a large in-house development platform that is among the most active of any public apartment owner.",
    ],
    highlights: [
      "Concentrated in New England, the New York and New Jersey metro, the Mid-Atlantic, the Pacific Northwest, and Northern and Southern California, with newer expansion in Sun Belt markets.",
      "Builds and operates communities under the Avalon, AVA, and Eaves by Avalon brands.",
      "S&P 500 constituent and one of the industry's largest developers of new apartments.",
    ],
    milestones: [
      { year: "1998", title: "Formed via merger", detail: "Avalon Properties and Bay Apartment Communities combine to create AvalonBay Communities." },
      { year: "2007", title: "Added to the S&P 500", detail: "Recognized among the largest and most liquid US public companies." },
    ],
  },
  EQR: {
    ownership: "Public (NYSE: EQR)",
    founded: "1993 (IPO)",
    headquarters: "Chicago, Illinois",
    tagline: "One of the largest US apartment owners, focused on affluent renters in dense, high-cost coastal cities.",
    overview: [
      "Founded by Sam Zell and taken public in 1993, Equity Residential is an S&P 500 apartment REIT that acquires, develops, and manages residential communities. It was one of the first apartment REITs to reach national scale.",
      "The company targets high-density, high-cost urban and suburban submarkets with strong demand from affluent, knowledge-economy renters.",
    ],
    highlights: [
      "Core markets include Boston, New York, Washington DC, Seattle, San Francisco, and Southern California.",
      "Expansion markets add Denver, Atlanta, Dallas-Fort Worth, and Austin.",
      "Focused on well-located properties serving higher-income renters.",
    ],
    milestones: [
      { year: "1993", title: "IPO", detail: "Equity Residential goes public under Sam Zell, becoming a pioneering large-scale apartment REIT." },
    ],
  },
  MAA: {
    ownership: "Public (NYSE: MAA)",
    founded: "1994 (IPO)",
    headquarters: "Germantown, Tennessee",
    tagline: "The largest Sun Belt apartment REIT, concentrated in fast-growing Southeastern and Southwestern markets.",
    overview: [
      "Mid-America Apartment Communities (MAA) is an S&P 500 apartment REIT focused on the high-growth US Sun Belt. It owns and operates a large, geographically diversified portfolio spanning primary and secondary Southeastern and Southwestern markets.",
      "MAA scaled substantially through two transformational mergers, becoming the largest publicly-traded owner of apartments concentrated in the Sun Belt.",
    ],
    highlights: [
      "Broad Sun Belt footprint including Atlanta, Dallas, Tampa, Orlando, Charlotte, Austin, Nashville, and Raleigh.",
      "Diversified across large and mid-size markets to smooth supply and demand cycles.",
      "Heavy exposure to fast-growing university metros.",
    ],
    milestones: [
      { year: "1994", title: "IPO", detail: "Mid-America Apartment Communities lists on the NYSE." },
      { year: "2013", title: "Merges with Colonial Properties", detail: "A merger that significantly expanded the Sun Belt portfolio." },
      { year: "2016", title: "Merges with Post Properties", detail: "Adds a high-quality Sun Belt portfolio and cements MAA as the region's largest apartment REIT." },
    ],
  },
  ESS: {
    ownership: "Public (NYSE: ESS)",
    founded: "1994 (IPO)",
    headquarters: "San Mateo, California",
    tagline: "A West Coast apartment specialist concentrated in supply-constrained California and Seattle markets.",
    overview: [
      "Essex Property Trust is an S&P 500 apartment REIT that develops, redevelops, acquires, and manages apartment communities exclusively on the West Coast, where housing supply is among the most tightly constrained in the country.",
      "Its focused strategy concentrates capital in high-cost, low-supply coastal submarkets rather than diversifying nationally.",
    ],
    highlights: [
      "Markets limited to Southern California, Northern California, and the Seattle metro.",
      "Benefits from persistent housing shortages and high barriers to new construction on the West Coast.",
      "Expanded materially through its 2014 acquisition of BRE Properties.",
    ],
    milestones: [
      { year: "1994", title: "IPO", detail: "Essex Property Trust goes public with a West Coast focus." },
      { year: "2014", title: "Acquires BRE Properties", detail: "A major acquisition that deepened its California and Seattle portfolio." },
    ],
  },
  CPT: {
    ownership: "Public (NYSE: CPT)",
    founded: "1993 (IPO)",
    headquarters: "Houston, Texas",
    tagline: "A Sun Belt apartment REIT known for a resident-first culture across high-growth markets.",
    overview: [
      "Camden Property Trust owns, develops, and manages apartment communities across the US Sun Belt. Founded in 1982 and public since 1993, it is consistently recognized as one of the best places to work in the country.",
      "Camden concentrates on growth markets in the South and Southwest, pairing development with a large owned-and-managed portfolio.",
    ],
    highlights: [
      "Markets include Houston, Dallas, Austin, Atlanta, Orlando, Tampa, Charlotte, Phoenix, Southern California, and the DC metro.",
      "Long track record on Fortune's Best Companies to Work For list.",
      "Expanded through the 2005 acquisition of Summit Properties.",
    ],
    milestones: [
      { year: "1993", title: "IPO", detail: "Camden Property Trust lists on the NYSE." },
      { year: "2005", title: "Acquires Summit Properties", detail: "A merger that expanded Camden's Southeastern footprint." },
    ],
  },
  UDR: {
    ownership: "Public (NYSE: UDR)",
    founded: "1972",
    headquarters: "Highlands Ranch, Colorado",
    tagline: "A diversified national apartment REIT balancing coastal and Sun Belt markets across price points.",
    overview: [
      "UDR is an S&P 500 apartment REIT that owns, operates, acquires, and develops apartment communities nationwide. Founded in 1972 as United Dominion Realty Trust, it is one of the longest-tenured apartment REITs.",
      "Its portfolio is deliberately diversified across A and B price points and across coastal and Sun Belt regions, and it is an industry leader in operating technology.",
    ],
    highlights: [
      "Coast-to-coast footprint spanning both gateway coastal cities and Sun Belt growth markets.",
      "Pioneer of a technology-driven operating model to improve margins and the resident experience.",
      "Diversified by price point to balance growth and stability.",
    ],
    milestones: [
      { year: "1972", title: "Founded", detail: "Established as United Dominion Realty Trust, among the earliest apartment REITs." },
    ],
  },
  IRT: {
    ownership: "Public (NYSE: IRT)",
    headquarters: "Philadelphia, Pennsylvania",
    tagline: "A Sun Belt apartment REIT focused on amenitized middle-market communities in growth metros.",
    overview: [
      "Independence Realty Trust owns and operates multifamily communities across non-gateway Sun Belt and Midwest growth markets, targeting middle-market renters with a value-add renovation strategy.",
      "It roughly doubled in size through its 2021 merger with Steadfast Apartment REIT.",
    ],
    highlights: [
      "Markets include Atlanta, Dallas, Columbus, Denver, Oklahoma City, Nashville, and Raleigh.",
      "Value-add strategy renovating and repositioning communities to lift rents.",
      "Concentrated in college-town and high-growth secondary markets.",
    ],
    milestones: [
      { year: "2021", title: "Merges with Steadfast Apartment REIT", detail: "A merger that roughly doubled IRT's portfolio and scale." },
    ],
  },

  // ── Student-housing owners & institutional platforms ───────────────
  ACC: {
    ownership: "Private (acquired by Blackstone, 2022)",
    founded: "1993",
    headquarters: "Austin, Texas",
    tagline: "The pioneer of purpose-built student housing as an institutional asset class.",
    overview: [
      "American Campus Communities pioneered the purpose-built student-housing REIT model, developing, owning, and managing on- and off-campus communities, often through public-private partnerships with universities.",
      "Blackstone took the company private in 2022 in a transaction valued at roughly $12.8 billion, so its SEC filings are now historical rather than current.",
    ],
    highlights: [
      "Built a national portfolio of on-campus (ACE program) and off-campus communities at flagship universities.",
      "First student-housing company to go public as a REIT.",
      "Taken private by Blackstone in 2022 for about $12.8 billion.",
    ],
    milestones: [
      { year: "2004", title: "IPO", detail: "The first purpose-built student-housing REIT to go public." },
      { year: "2022", title: "Taken private by Blackstone", detail: "A roughly $12.8 billion take-private that moved the pioneer into private hands." },
    ],
  },
  BREIT: {
    ownership: "Non-traded REIT (Blackstone)",
    founded: "2017",
    headquarters: "New York, New York",
    tagline: "Blackstone's flagship perpetual-capital real estate vehicle and a major owner of US rental housing.",
    overview: [
      "Blackstone Real Estate Income Trust (BREIT) is a non-traded, perpetual-life REIT sponsored by Blackstone that invests across income-generating real estate, with heavy weighting toward rental housing and logistics.",
      "BREIT acquired American Campus Communities in 2022, making it one of the largest owners of US purpose-built student housing.",
    ],
    highlights: [
      "Sector-leading exposure to residential (including student housing) and industrial logistics.",
      "Acquired American Campus Communities in 2022.",
      "One of the largest real estate vehicles by net asset value.",
    ],
    milestones: [
      { year: "2017", title: "Launched", detail: "Blackstone introduces BREIT as a perpetual-capital real estate vehicle." },
      { year: "2022", title: "Acquires American Campus Communities", detail: "Adds a national student-housing portfolio." },
    ],
  },
  BX: {
    ownership: "Public (NYSE: BX)",
    founded: "1985",
    headquarters: "New York, New York",
    tagline: "The world's largest alternative-asset manager and the largest owner of commercial real estate.",
    overview: [
      "Blackstone is the world's largest alternative-asset manager, with the largest real estate platform of any investor. Its real estate business owns and operates properties across housing, logistics, hospitality, and offices, and it sponsors BREIT.",
      "Through its take-private of American Campus Communities, Blackstone became the largest institutional owner of US student housing.",
    ],
    highlights: [
      "Largest owner of US purpose-built student housing following the ACC take-private.",
      "Real estate is its largest business segment.",
      "Manages over $1 trillion in total assets across strategies.",
    ],
    milestones: [
      { year: "1985", title: "Founded", detail: "Blackstone is established as an advisory and investment firm." },
      { year: "2007", title: "IPO", detail: "Blackstone goes public on the NYSE." },
      { year: "2022", title: "ACC take-private", detail: "Acquires American Campus Communities, consolidating US student housing." },
    ],
  },
  BN: {
    ownership: "Public (NYSE / TSX: BN)",
    headquarters: "Toronto, Canada",
    tagline: "A global owner-operator of real assets with a sizable purpose-built student-accommodation platform.",
    overview: [
      "Brookfield Corporation is a leading global alternative-asset manager and owner-operator of real assets across real estate, infrastructure, renewable power, and private equity.",
      "Its real estate arm includes a substantial purpose-built student-accommodation platform, particularly across the United Kingdom and Europe.",
    ],
    highlights: [
      "Global real estate portfolio spanning offices, retail, logistics, and housing.",
      "Operates a purpose-built student-accommodation platform in the UK and Europe.",
      "Trillion-dollar-scale assets under management across the Brookfield ecosystem.",
    ],
    milestones: [
      { year: "2022", title: "Brookfield Corporation created", detail: "A reorganization establishes Brookfield Corporation (BN) alongside its asset-management arm." },
    ],
  },
  GREYSTAR: {
    ownership: "Privately held",
    founded: "1993",
    headquarters: "Charleston, South Carolina",
    tagline: "The largest apartment operator, owner, and developer in the United States, and one of the largest rental-housing platforms in the world.",
    overview: [
      "Founded in 1993 by Bob Faith and headquartered in Charleston, South Carolina, Greystar is a fully-integrated rental-housing company that develops, owns, and manages residential real estate on a global scale. Because it is privately held, it does not file with the SEC, so the figures below are published reference facts rather than a live filings feed.",
      "Greystar tops the National Multifamily Housing Council rankings as the nation's #1 apartment manager, #1 owner, and #1 developer at the same time. Its US management platform crossed one million units in early 2026, a scale no other operator has reached.",
      "Beyond conventional apartments, Greystar is one of the world's largest operators of purpose-built student housing, along with growing platforms in single-family build-to-rent, senior living, logistics, and modular construction across North America, Europe, Latin America, and Asia-Pacific.",
    ],
    highlights: [
      "#1 on the NMHC lists for owner, manager, and developer at the same time.",
      "Three integrated segments: Property Management, Investment Management, and Development & Construction.",
      "Became the largest US student-housing operator via the 2018 acquisition of Education Realty Trust for about $4.6 billion.",
      "Absorbed Wood Partners in 2024 and added ~11,000 homes via a Grand Peaks partnership in 2025.",
    ],
    stats: [
      { label: "Units under management (US)", value: "1,000,000+", sub: "#1 on the NMHC 50 manager list" },
      { label: "Apartment units owned", value: "122,545", sub: "#1 NMHC owner (2025 year-end)" },
      { label: "Real estate AUM", value: "$300B+", sub: "Assets under management globally" },
      { label: "Employees", value: "22,000+", sub: "Across ~250 markets worldwide" },
      { label: "Student beds", value: "110,000+", sub: "Purpose-built student housing globally" },
      { label: "New units started (2024)", value: "8,200+", sub: "#1 NMHC developer list" },
    ],
    milestones: [
      { year: "1993", title: "Founded", detail: "Bob Faith founds Greystar to build a fully-integrated rental-housing operator." },
      { year: "2018", title: "Acquires Education Realty Trust", detail: "A ~$4.6 billion deal adds roughly 47,100 student beds across 55 universities, making Greystar a top student-housing operator overnight." },
      { year: "2023", title: "Launches Modern Living Solutions", detail: "Stands up a modular-construction arm to industrialize apartment delivery." },
      { year: "2024", title: "Absorbs Wood Partners", detail: "Integrates a large owner-developer, fueling a leap in units under management." },
      { year: "2026", title: "Crosses 1,000,000 units", detail: "US management portfolio passes one million units, topping the NMHC owner, manager, and developer lists at once." },
    ],
    sources: [
      { label: "Greystar - Tops NMHC list with 1M units under management", url: "https://www.greystar.com/business/about-greystar/newsroom/greystar-tops-nmhc-list-with-1m-units-under-management" },
      { label: "Greystar - About Us", url: "https://www.greystar.com/business/about-greystar/about" },
      { label: "CoStar - Greystar takes over top spot as nation's largest apartment owner", url: "https://www.costar.com/article/329788865/greystar-takes-over-top-spot-from-maa-as-nations-largest-apartment-owner" },
    ],
  },
};

/** Look up a company's reference profile by ticker, then by name. */
export function companyReference(c: { ticker: string; name: string }): CompanyReference | undefined {
  return COMPANY_REFERENCE[c.ticker] ?? COMPANY_REFERENCE[c.name] ?? COMPANY_REFERENCE[c.name.toUpperCase()];
}

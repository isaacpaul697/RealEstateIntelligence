/**
 * Per-asset-class reference data that powers each sector's specialized world:
 * the major public operators active in that class and a sector-tuned news query.
 *
 * The company roster is public fact (which firm operates in which asset class,
 * plus its SEC CIK), the same kind of static reference as our CITIES list. The
 * *activity* for each firm is pulled live from EDGAR, and headlines come live
 * from Google News, so nothing here fabricates numbers or events.
 */

export interface SectorCompany {
  name: string;
  ticker: string;
  /** SEC CIK for public filers; null for privately-held firms (e.g. Greystar). */
  cik: number | null;
  /** A factual one-line description of the firm's focus. */
  note: string;
  /** Domain used for the firm's logo disc. */
  site: string;
}

export interface SectorPlayersConfig {
  /** Google News RSS query for this asset class. */
  newsQuery: string;
  /** Short framing line shown above the players list. */
  playersIntro: string;
  companies: SectorCompany[];
}

export const SECTOR_PLAYERS: Record<string, SectorPlayersConfig> = {
  industrial: {
    newsQuery:
      'industrial real estate (warehouse OR logistics OR "distribution center" OR "cold storage") (development OR construction OR lease OR acquisition)',
    playersIntro:
      "The largest publicly-traded warehouse, logistics, and industrial landlords. Recent activity is pulled live from each firm's SEC filings.",
    companies: [
      { name: "Prologis", ticker: "PLD", cik: 1045609, note: "Largest global logistics real-estate REIT.", site: "prologis.com" },
      { name: "Rexford Industrial", ticker: "REXR", cik: 1571283, note: "Infill industrial focused on Southern California.", site: "rexfordindustrial.com" },
      { name: "First Industrial Realty", ticker: "FR", cik: 921825, note: "Logistics and distribution properties nationwide.", site: "firstindustrial.com" },
      { name: "EastGroup Properties", ticker: "EGP", cik: 49600, note: "Multi-tenant industrial across the Sun Belt.", site: "eastgroup.net" },
      { name: "STAG Industrial", ticker: "STAG", cik: 1479094, note: "Single-tenant industrial in secondary markets.", site: "stagindustrial.com" },
      { name: "Terreno Realty", ticker: "TRNO", cik: 1476150, note: "Industrial in six major coastal markets.", site: "terreno.com" },
    ],
  },
  "single-townhome": {
    newsQuery:
      'homebuilder (single-family OR townhome OR "for-sale housing") (housing starts OR construction OR community OR "land acquisition" OR earnings)',
    playersIntro:
      "The largest publicly-traded single-family and townhome builders. Recent activity is pulled live from each firm's SEC filings.",
    companies: [
      { name: "D.R. Horton", ticker: "DHI", cik: 882184, note: "Largest U.S. homebuilder by volume.", site: "drhorton.com" },
      { name: "Lennar", ticker: "LEN", cik: 920760, note: "National builder of single-family homes and townhomes.", site: "lennar.com" },
      { name: "PulteGroup", ticker: "PHM", cik: 822416, note: "Single-family and attached homes across major metros.", site: "pultegroup.com" },
      { name: "NVR", ticker: "NVR", cik: 906163, note: "Ryan Homes parent; East Coast single-family builder.", site: "nvrinc.com" },
      { name: "Toll Brothers", ticker: "TOL", cik: 794170, note: "Luxury single-family and townhome communities.", site: "tollbrothers.com" },
      { name: "Meritage Homes", ticker: "MTH", cik: 833079, note: "Sun Belt single-family and entry-level homes.", site: "meritagehomes.com" },
    ],
  },
  multifamily: {
    newsQuery:
      'multifamily apartment (development OR construction OR acquisition OR "rent growth" OR "lease-up") -student',
    playersIntro:
      "The largest publicly-traded apartment owners and operators. Recent activity is pulled live from each firm's SEC filings.",
    companies: [
      { name: "Greystar", ticker: "PRIVATE", cik: null, note: "Largest US apartment owner, manager, and developer; privately held.", site: "greystar.com" },
      { name: "AvalonBay Communities", ticker: "AVB", cik: 915912, note: "Develops and owns apartments in coastal metros.", site: "avalonbay.com" },
      { name: "Equity Residential", ticker: "EQR", cik: 906107, note: "Urban and high-density apartment portfolio.", site: "equityapartments.com" },
      { name: "Mid-America Apartment", ticker: "MAA", cik: 912595, note: "Sun Belt apartment owner-operator.", site: "maac.com" },
      { name: "Essex Property Trust", ticker: "ESS", cik: 920522, note: "West Coast apartment specialist.", site: "essex.com" },
      { name: "Camden Property Trust", ticker: "CPT", cik: 906345, note: "Apartments across Sun Belt growth markets.", site: "camdenliving.com" },
      { name: "UDR", ticker: "UDR", cik: 74208, note: "Diversified national apartment portfolio.", site: "udr.com" },
    ],
  },
  office: {
    newsQuery:
      'office real estate (development OR leasing OR "office conversion" OR "return to office" OR acquisition)',
    playersIntro:
      "The largest publicly-traded office landlords. Recent activity is pulled live from each firm's SEC filings.",
    companies: [
      { name: "BXP", ticker: "BXP", cik: 1037540, note: "Largest U.S. office REIT (formerly Boston Properties).", site: "bxp.com" },
      { name: "Vornado Realty Trust", ticker: "VNO", cik: 899689, note: "Manhattan-concentrated office and retail.", site: "vno.com" },
      { name: "Kilroy Realty", ticker: "KRC", cik: 1025996, note: "West Coast office and life-science campuses.", site: "kilroyrealty.com" },
      { name: "Cousins Properties", ticker: "CUZ", cik: 25232, note: "Sun Belt trophy office buildings.", site: "cousins.com" },
      { name: "SL Green Realty", ticker: "SLG", cik: 1040971, note: "Largest Manhattan office landlord.", site: "slgreen.com" },
      { name: "Highwoods Properties", ticker: "HIW", cik: 921082, note: "Office across Southeastern business districts.", site: "highwoods.com" },
    ],
  },
  retail: {
    newsQuery:
      'retail real estate ("shopping center" OR "retail development" OR "store openings" OR "net lease" OR acquisition)',
    playersIntro:
      "The largest publicly-traded retail landlords. Recent activity is pulled live from each firm's SEC filings.",
    companies: [
      { name: "Simon Property Group", ticker: "SPG", cik: 1063761, note: "Largest U.S. mall and outlet operator.", site: "simon.com" },
      { name: "Realty Income", ticker: "O", cik: 726728, note: "Net-lease retail across thousands of tenants.", site: "realtyincome.com" },
      { name: "Kimco Realty", ticker: "KIM", cik: 879101, note: "Open-air, grocery-anchored shopping centers.", site: "kimcorealty.com" },
      { name: "Regency Centers", ticker: "REG", cik: 910606, note: "Grocery-anchored neighborhood centers.", site: "regencycenters.com" },
      { name: "Federal Realty", ticker: "FRT", cik: 34903, note: "Mixed-use and retail in dense, affluent markets.", site: "federalrealty.com" },
      { name: "Brixmor Property Group", ticker: "BRX", cik: 1581068, note: "Open-air retail centers nationwide.", site: "brixmor.com" },
    ],
  },
  affordable: {
    newsQuery:
      'affordable housing (LIHTC OR "low-income housing" OR "tax credit" OR development OR "inclusionary zoning")',
    playersIntro:
      "Publicly-traded operators active in income-restricted and workforce housing. Recent activity is pulled live from each firm's SEC filings.",
    companies: [
      { name: "NexPoint Residential", ticker: "NXRT", cik: 1620393, note: "Workforce and value-add apartments in the Sun Belt.", site: "nexpointliving.com" },
      { name: "Mid-America Apartment", ticker: "MAA", cik: 912595, note: "Large Sun Belt apartment operator with workforce stock.", site: "maac.com" },
      { name: "Equity Residential", ticker: "EQR", cik: 906107, note: "Major apartment owner; multifamily is the affordable proxy.", site: "equityapartments.com" },
    ],
  },
};

export function sectorPlayers(sector: string): SectorPlayersConfig | undefined {
  return SECTOR_PLAYERS[sector];
}

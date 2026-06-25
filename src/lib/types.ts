/** Every figure shown is either pulled live or transparently modeled. */
export type Provenance = "live" | "estimated";

export type OpportunityLabel =
  | "Strong Buy Signal"
  | "Buy Signal"
  | "Watchlist"
  | "Needs More Diligence"
  | "Elevated Risk"
  | "Overpriced / Weak Demand";

/** A real news article pulled from Google News. */
export interface Article {
  title: string;
  link: string;
  source: string;
  published: string; // ISO
}

/** A real apartment near campus, from OpenStreetMap. */
export interface Apartment {
  id: string;
  name: string;
  lat: number;
  lng: number;
  website: string | null;
  searchUrl: string | null;
  street: string | null;
  distanceMi: number;
  estUnits: number;
  estBeds: number; // student housing leases by the bed, so revenue is bed-driven
  estMonthlyRent: number; // per-BED monthly rent
  estAnnualRevenue: number; // beds × per-bed rent × 12
  /** Where the per-bed rent came from: real HUD/Census data or a regional fallback. */
  rentSource: string;
}

/** Live market record. Raw inputs only - the score is computed from these. */
export interface LiveMarket {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  brandColor: string;
  city: string;
  state: string;
  conference: string;
  region: "Midwest" | "South" | "West" | "Northeast";
  domain: string;
  lat: number;
  lng: number;
  logo: string | null;

  // live (College Scorecard) - null when the API has no value
  enrollment: number | null;
  enrollmentGrowth: number | null; // annualized %
  acceptanceRate: number | null; // %
  retentionRate: number | null; // % (4-year full-time)
  roomBoardOnCampus: number | null; // $/yr
  roomBoardOffCampus: number | null; // $/yr

  // live (Census ACS) - county-level demographics
  countyPopulation: number | null;
  medianAge: number | null;
  renterPct: number | null; // % of occupied units that are renter-occupied
  medianRent: number | null; // $/mo
  medianIncome: number | null; // $/yr

  // live (BLS LAUS) - county-level labor market
  unemploymentRate: number | null; // %

  // live (FRED) - macro indicators
  mortgageRate: number | null; // % (30-yr fixed)
  stateHpi: number | null; // housing price index (FHFA)

  // live (FEMA National Risk Index) - county natural-hazard risk
  hazardRiskScore: number | null; // 0-100 composite (higher = more risk)
  hazardRiskRating: string | null; // e.g. "Very High", "Relatively Moderate"

  // live (HUD USER) - official Fair Market Rents by bedroom ($/mo)
  fmrEfficiency: number | null;
  fmrOneBed: number | null;
  fmrTwoBed: number | null; // 2BR is the standard FMR benchmark
  fmrThreeBed: number | null;
  fmrFourBed: number | null;
  fmrArea: string | null; // HUD FMR area label
  fmrYear: string | null;

  // live (Wikipedia REST) - encyclopedic context + campus photo
  wikiSummary: string | null;
  wikiThumb: string | null; // image URL
  wikiUrl: string | null;

  // live (Open-Meteo) - climate normals for the prior full calendar year
  climateAvgTempF: number | null; // annual mean temperature (°F)
  climateSunHours: number | null; // total annual sunshine (hours)
  climatePrecipIn: number | null; // total annual precipitation (inches)

  // live (USGS) - seismic exposure near campus
  quakeCount: number | null; // M3.0+ earthquakes within 100 km, last 25 yrs

  // live (Google News) - recent housing-related article volume
  newsCount: number;

  // modeled from live inputs (transparently labeled "estimated")
  estRentGrowth: number; // %
  estOccupancy: number; // 0-1

  fetchedAt: string; // ISO
}

export interface ScoreFactor {
  key: string;
  label: string;
  weight: number; // 0-1
  value: number; // 0-100 normalized factor score
  detail: string;
  provenance: Provenance;
}

export interface ScoreResult {
  score: number; // 0-100
  label: OpportunityLabel;
  factors: ScoreFactor[];
}

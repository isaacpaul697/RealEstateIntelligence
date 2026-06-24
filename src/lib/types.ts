/** Every figure shown is either pulled live or transparently modeled. */
export type Provenance = "live" | "estimated";

export type OpportunityLabel =
  | "Strong Buy Signal"
  | "Watchlist"
  | "Needs More Diligence"
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
  estMonthlyRent: number;
  estAnnualRevenue: number;
}

/** Live market record. Raw inputs only — the score is computed from these. */
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

  // live (College Scorecard) — null when the API has no value
  enrollment: number | null;
  enrollmentGrowth: number | null; // annualized %
  acceptanceRate: number | null; // %

  // live (Google News) — recent housing-related article volume
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

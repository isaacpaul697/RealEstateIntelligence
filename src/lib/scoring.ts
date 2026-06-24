import type {
  LiveMarket,
  OpportunityLabel,
  ScoreFactor,
  ScoreResult,
} from "./types";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Default factor weights — adjustable in Settings (persisted to localStorage). */
export const DEFAULT_WEIGHTS: Record<string, number> = {
  enrollmentGrowth: 0.22,
  selectivity: 0.2,
  demandMomentum: 0.18,
  rentGrowth: 0.15,
  occupancy: 0.13,
  scale: 0.12,
};

export type Weights = typeof DEFAULT_WEIGHTS;

export const FACTOR_META: Record<
  string,
  { label: string; provenance: "live" | "estimated" }
> = {
  enrollmentGrowth: { label: "Enrollment growth", provenance: "live" },
  selectivity: { label: "Admissions selectivity", provenance: "live" },
  demandMomentum: { label: "Demand momentum (news)", provenance: "live" },
  rentGrowth: { label: "Rent growth", provenance: "estimated" },
  occupancy: { label: "Occupancy strength", provenance: "estimated" },
  scale: { label: "Renter-base scale", provenance: "live" },
};

export function labelFor(score: number): OpportunityLabel {
  if (score >= 71) return "Strong Buy Signal";
  if (score >= 60) return "Watchlist";
  if (score >= 48) return "Needs More Diligence";
  return "Overpriced / Weak Demand";
}

export const LABEL_TONE: Record<OpportunityLabel, string> = {
  "Strong Buy Signal": "good",
  Watchlist: "warn",
  "Needs More Diligence": "info",
  "Overpriced / Weak Demand": "bad",
};

function factor(
  key: string,
  weight: number,
  value: number,
  detail: string,
): ScoreFactor {
  return {
    key,
    label: FACTOR_META[key].label,
    weight,
    value: Math.round(clamp(value)),
    detail,
    provenance: FACTOR_META[key].provenance,
  };
}

/** Acquisition score for a market, blended from live + modeled inputs. */
export function scoreMarket(
  m: LiveMarket,
  weights: Weights = DEFAULT_WEIGHTS,
): ScoreResult {
  const growth = m.enrollmentGrowth;
  const accept = m.acceptanceRate;

  const factors: ScoreFactor[] = [
    factor(
      "enrollmentGrowth",
      weights.enrollmentGrowth,
      growth != null ? 50 + growth * 11 : 45,
      growth != null ? `${growth.toFixed(1)}% / yr (5-yr)` : "data unavailable",
    ),
    factor(
      "selectivity",
      weights.selectivity,
      accept != null ? 100 - accept : 50,
      accept != null ? `${accept.toFixed(0)}% acceptance rate` : "data unavailable",
    ),
    factor(
      "demandMomentum",
      weights.demandMomentum,
      m.newsCount * 9,
      `${m.newsCount} recent housing headlines`,
    ),
    factor(
      "rentGrowth",
      weights.rentGrowth,
      40 + m.estRentGrowth * 8,
      `~${m.estRentGrowth.toFixed(1)}% YoY (est.)`,
    ),
    factor(
      "occupancy",
      weights.occupancy,
      (m.estOccupancy - 0.8) * 500,
      `~${(m.estOccupancy * 100).toFixed(0)}% occupied (est.)`,
    ),
    factor(
      "scale",
      weights.scale,
      m.enrollment != null ? (m.enrollment - 15000) / 550 : 40,
      m.enrollment != null
        ? `${m.enrollment.toLocaleString()} students`
        : "data unavailable",
    ),
  ];

  const total = factors.reduce((s, f) => s + f.weight, 0) || 1;
  const score = Math.round(
    factors.reduce((s, f) => s + f.value * f.weight, 0) / total,
  );
  return { score, label: labelFor(score), factors };
}

export const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
export const fmtNum = (n: number) => n.toLocaleString("en-US");

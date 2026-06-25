import type { Development, PropertyType } from "./types";
import type { DemandData } from "./live/demand";
import type { LandUseMix } from "./live/overpass";

/* ==================================================================
   Supply-gap model. Compares the mix of property types being ADDED via
   permits (supply) against a modeled demand mix blended from Census ACS
   growth/vacancy/tenure and the existing OSM built land-use mix.
   Output is provenance:"estimated" — the live inputs are surfaced so the
   recommendation is auditable, never a black box.
   ================================================================== */

const GAP_TYPES: PropertyType[] = [
  "multifamily", "single-family", "office", "retail", "industrial", "mixed-use",
];

export type Verdict = "under-supplied" | "balanced" | "over-supplied";

export interface TypeGap {
  type: PropertyType;
  supplyShare: number; // 0..1
  demandShare: number; // 0..1
  gap: number; // demand - supply
  verdict: Verdict;
  rationale: string;
}

export interface GapResult {
  available: boolean;
  note?: string;
  gaps: TypeGap[];
  inputs: {
    permitCount: number;
    demand: DemandData;
    landUse: LandUseMix;
  };
}

function normalize(v: Record<PropertyType, number>): Record<PropertyType, number> {
  const sum = GAP_TYPES.reduce((s, t) => s + (v[t] || 0), 0) || 1;
  const out = {} as Record<PropertyType, number>;
  for (const t of GAP_TYPES) out[t] = (v[t] || 0) / sum;
  return out;
}

export function computeGap(
  devs: Development[],
  demand: DemandData,
  landUse: LandUseMix,
): GapResult {
  const inputs = { permitCount: devs.length, demand, landUse };

  if (devs.length === 0 || (!demand.available && !landUse.available)) {
    return {
      available: false,
      note: "Not enough live inputs (permits + ACS demand or OSM land-use) to model a gap here.",
      gaps: [],
      inputs,
    };
  }

  // ---- Supply share: how new permits split across types ----
  const supplyCounts = {} as Record<PropertyType, number>;
  for (const t of GAP_TYPES) supplyCounts[t] = 0;
  for (const d of devs) if (d.type in supplyCounts) supplyCounts[d.type]++;
  const supply = normalize(supplyCounts);

  // ---- Demand share: existing built mix (OSM) nudged by ACS signals ----
  const renterFrac =
    demand.renterPct != null ? Math.min(0.9, Math.max(0.1, demand.renterPct / 100)) : 0.5;

  const s = landUse.available
    ? landUse.shares
    : { residential: 0.5, commercial: 0.2, industrial: 0.1, retail: 0.1, office: 0.1 };

  const demandRaw = {} as Record<PropertyType, number>;
  demandRaw.multifamily = s.residential * renterFrac;
  demandRaw["single-family"] = s.residential * (1 - renterFrac);
  demandRaw.office = s.office + s.commercial * 0.5;
  demandRaw.retail = s.retail + s.commercial * 0.3;
  demandRaw.industrial = s.industrial;
  demandRaw["mixed-use"] = s.commercial * 0.2;

  // Population/household growth + tight vacancy boost residential demand.
  if (demand.available) {
    const growth = demand.popGrowthPct ?? demand.householdGrowthPct ?? 0;
    const growthMult = 1 + Math.max(-0.2, Math.min(0.4, (growth / 100) * 3));
    const vac = demand.vacancyPct;
    const vacMult = vac != null ? 1 + Math.max(-0.2, Math.min(0.25, (6 - vac) / 100)) : 1;
    demandRaw.multifamily *= growthMult * vacMult;
    demandRaw["single-family"] *= growthMult * vacMult;
  }

  const demandShare = normalize(demandRaw);

  const gaps: TypeGap[] = GAP_TYPES.map((t) => {
    const gap = demandShare[t] - supply[t];
    const verdict: Verdict =
      gap > 0.06 ? "under-supplied" : gap < -0.06 ? "over-supplied" : "balanced";
    const rationale = buildRationale(t, supply[t], demandShare[t], demand, landUse);
    return { type: t, supplyShare: supply[t], demandShare: demandShare[t], gap, verdict, rationale };
  }).sort((a, b) => b.gap - a.gap);

  return { available: true, gaps, inputs };
}

function buildRationale(
  type: PropertyType,
  supply: number,
  demand: number,
  d: DemandData,
  lu: LandUseMix,
): string {
  const parts: string[] = [];
  parts.push(`${Math.round(supply * 100)}% of recent permits vs ${Math.round(demand * 100)}% modeled demand`);
  if ((type === "multifamily" || type === "single-family") && d.available) {
    if (d.popGrowthPct != null) parts.push(`population ${d.popGrowthPct >= 0 ? "+" : ""}${d.popGrowthPct.toFixed(1)}% (5yr)`);
    if (d.vacancyPct != null) parts.push(`${d.vacancyPct.toFixed(1)}% vacancy`);
  }
  if (lu.available) {
    const share = lu.shares[mapToOsm(type)];
    if (share != null) parts.push(`${Math.round(share * 100)}% of existing built land is ${type === "multifamily" || type === "single-family" ? "residential" : mapToOsm(type)}`);
  }
  return parts.join(" · ");
}

function mapToOsm(t: PropertyType): keyof LandUseMix["shares"] {
  switch (t) {
    case "multifamily":
    case "single-family":
      return "residential";
    case "industrial":
      return "industrial";
    case "retail":
      return "retail";
    case "office":
      return "office";
    default:
      return "commercial";
  }
}

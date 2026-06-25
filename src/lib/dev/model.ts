import type { Development, Metric, PropertyType } from "./types";

/* ==================================================================
   Modeled economics. Every value returned here is either pulled live
   (declared valuation / recorded dates) or modeled from live inputs and
   tagged provenance:"estimated". All constants below are documented
   modeling assumptions surfaced on the Methodology page — not data points.
   ================================================================== */

/** 2019-base national new-construction hard cost, $/sqft (RSMeans-style). */
export const BASE_COST_PER_SQFT: Record<PropertyType, number> = {
  multifamily: 180,
  "single-family": 150,
  office: 230,
  retail: 160,
  industrial: 110,
  "mixed-use": 200,
  other: 160,
};

/** Fallback all-in cost per dwelling unit when sqft is absent, $ (2019 base). */
export const COST_PER_UNIT: Partial<Record<PropertyType, number>> = {
  multifamily: 250_000,
  "single-family": 320_000,
  "mixed-use": 280_000,
};

/** RSMeans-style city construction cost index (US avg = 1.00). */
export const CITY_COST_FACTOR: Record<string, number> = {
  austin: 0.92, chicago: 1.18, nyc: 1.35, seattle: 1.12, sf: 1.3, la: 1.1, neworleans: 0.95,
};

/** Land as a share of total development cost for urban infill (city-specific). */
export const CITY_LAND_SHARE: Record<string, number> = {
  austin: 0.2, chicago: 0.22, nyc: 0.45, seattle: 0.3, sf: 0.42, la: 0.35, neworleans: 0.22,
};

/** Typical entitlement→completion duration in months, by type. */
export const DURATION_MONTHS: Record<PropertyType, number> = {
  "single-family": 7,
  multifamily: 20,
  office: 26,
  retail: 12,
  industrial: 11,
  "mixed-use": 24,
  other: 12,
};

const m = (value: number | null, provenance: "live" | "estimated", note?: string): Metric => ({
  value,
  provenance,
  note,
});

/**
 * Development (hard) cost. Live when the permit declares a valuation;
 * otherwise modeled from sqft (preferred) or unit count, scaled by the
 * FRED construction-cost multiplier and the city cost factor.
 */
export function estimateCost(dev: Development, costMultiplier: number): Metric {
  if (dev.declaredValue != null) return m(dev.declaredValue, "live", "Declared permit valuation");

  const factor = CITY_COST_FACTOR[dev.city] ?? 1;
  const infl = costMultiplier || 1;

  if (dev.sqft != null && dev.sqft > 0) {
    const v = dev.sqft * BASE_COST_PER_SQFT[dev.type] * factor * infl;
    return m(v, "estimated", `${dev.sqft.toLocaleString()} sqft × $${BASE_COST_PER_SQFT[dev.type]}/sqft × ${factor} city × ${infl.toFixed(2)} FRED`);
  }
  const perUnit = COST_PER_UNIT[dev.type];
  if (dev.units != null && dev.units > 0 && perUnit) {
    const v = dev.units * perUnit * factor * infl;
    return m(v, "estimated", `${dev.units} units × $${perUnit.toLocaleString()}/unit × ${factor} city × ${infl.toFixed(2)} FRED`);
  }
  return m(null, "estimated", "No sqft, unit count, or declared valuation available");
}

/** Land cost — no free national feed; modeled as a city land-share of dev cost. */
export function estimateLand(dev: Development, costMetric: Metric): Metric {
  const share = CITY_LAND_SHARE[dev.city] ?? 0.25;
  if (costMetric.value == null) return m(null, "estimated", "Depends on development cost (unavailable)");
  return m(costMetric.value * share, "estimated", `${Math.round(share * 100)}% land share (city infill assumption) × development cost`);
}

/** Development duration — live from issue→completion dates, else typical-by-type. */
export function estimateDuration(dev: Development): Metric {
  if (dev.issueDate && dev.completeDate) {
    const days = (Date.parse(dev.completeDate) - Date.parse(dev.issueDate)) / 86_400_000;
    if (days > 0) return m(Math.round(days), "live", "Permit issue → completion/CO dates");
  }
  return m(DURATION_MONTHS[dev.type] * 30, "estimated", `Typical ${DURATION_MONTHS[dev.type]}-month build for ${dev.type}`);
}

export interface DevEconomics {
  cost: Metric;
  land: Metric;
  durationDays: Metric;
}

export function economics(dev: Development, costMultiplier: number): DevEconomics {
  const cost = estimateCost(dev, costMultiplier);
  return { cost, land: estimateLand(dev, cost), durationDays: estimateDuration(dev) };
}

/** Methodology registry — drives the /methodology page. */
export const METHODOLOGY: { metric: string; provenance: "live" | "estimated"; formula: string; source: string }[] = [
  { metric: "Declared development value", provenance: "live", formula: "As reported on the building permit", source: "City open-data portal (Socrata)" },
  { metric: "Development cost (no declared value)", provenance: "estimated", formula: "sqft × base $/sqft(type) × city cost factor × FRED cost multiplier; or units × $/unit when sqft absent", source: "Permit sqft/units + RSMeans-style base + FRED WPUSI012011" },
  { metric: "Land cost", provenance: "estimated", formula: "development cost × city land-share assumption (20–45% urban infill)", source: "Modeled; no free national land-price feed" },
  { metric: "Development duration", provenance: "live", formula: "completion/CO date − issue date", source: "City open-data portal" },
  { metric: "Development duration (no dates)", provenance: "estimated", formula: "typical months-by-type × 30 days", source: "Modeled industry-typical durations" },
  { metric: "Construction cost multiplier", provenance: "live", formula: "latest PPI / Jan-2019 PPI", source: "FRED series WPUSI012011" },
  { metric: "National permit activity & trend", provenance: "live", formula: "Sum of units/value by structure type per state-year", source: "Census Building Permits Survey (annual state files)" },
  { metric: "Supply-gap recommendation", provenance: "estimated", formula: "permit supply-share(type) vs blended demand-share(type) from ACS growth, vacancy, income & OSM land-use mix", source: "Permits + Census ACS + OSM Overpass" },
  { metric: "Mapped developments (cities w/o a portal)", provenance: "live", formula: "Tagged building footprints near the place center, classified to property type by OSM building/landuse tags", source: "OpenStreetMap Overpass (geometry + tags)" },
  { metric: "Floor area (OSM buildings)", provenance: "estimated", formula: "footprint polygon area (from live geometry) × building:levels (or typical-by-type when untagged)", source: "OSM geometry + modeled level assumption" },
];

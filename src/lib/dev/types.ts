/* ------------------------------------------------------------------ */
/*  Shared domain types                                                */
/* ------------------------------------------------------------------ */

/** Every displayed metric is tagged so the UI can badge it honestly. */
export type Provenance = "live" | "estimated";

/** A number plus where it came from. */
export interface Metric {
  value: number | null;
  provenance: Provenance;
  /** Short note on how an estimated value was derived (shown on hover). */
  note?: string;
}

export const PROPERTY_TYPES = [
  "multifamily",
  "industrial",
  "office",
  "retail",
  "mixed-use",
  "single-family",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const TYPE_LABEL: Record<PropertyType, string> = {
  multifamily: "Multifamily",
  industrial: "Industrial",
  office: "Office",
  retail: "Retail",
  "mixed-use": "Mixed-use",
  "single-family": "Single-family",
  other: "Other",
};

/** Color-coding for map pins + charts (CSS variable tokens where possible). */
export const TYPE_COLOR: Record<PropertyType, string> = {
  multifamily: "#3a6ea5", // blue
  industrial: "#7a5c8f", // purple
  office: "#3f7a4f", // green
  retail: "#d9760a", // orange
  "mixed-use": "#9a7b2e", // gold
  "single-family": "#3aa6a0", // teal
  other: "#8a8273", // muted
};

/** A normalized development/permit record (one row from a city portal). */
export interface Development {
  id: string;
  city: string; // registry city id
  permitNumber: string;
  type: PropertyType;
  rawType: string; // original portal classification text
  description: string;
  address: string;
  lat: number;
  lng: number;
  /** Declared construction valuation in USD, when the portal carries it. */
  declaredValue: number | null;
  issueDate: string | null; // ISO
  completeDate: string | null; // ISO
  status: string | null;
  /** Developer / owner / contractor as reported on the permit. */
  developer: string | null;
  /** Building floor area in sqft when present (drives modeled cost). */
  sqft: number | null;
  /** Dwelling units proposed/added when present. */
  units: number | null;
}

/** A supported city + its open-data endpoint + bounding box. */
export interface CityConfig {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** Socrata domain + dataset 4x4, or null when only BPS/OSM is available. */
  socrata?: { domain: string; dataset: string };
  /** Default map zoom for the city view. */
  zoom: number;
}

/** Census Building Permits Survey row for the national overview. */
export interface BpsStateRow {
  state: string; // 2-letter
  fips: string;
  /** Units permitted by structure type for the period. */
  units1: number; // 1-unit (single family)
  units2: number; // 2-units
  units34: number; // 3-4 units
  units5: number; // 5+ units (multifamily)
  totalUnits: number;
  /** Declared construction value, thousands of USD. */
  valueThousands: number;
}

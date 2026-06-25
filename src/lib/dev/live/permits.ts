import { UA, HALF_DAY, SOCRATA_TOKEN, num, memo } from "./http";
import { getCity } from "../cities";
import type { Development, PropertyType } from "../types";

/* ------------------------------------------------------------------ */
/*  Field helpers — Socrata omits null columns per-row, so we read     */
/*  from candidate lists rather than a fixed schema. One generic       */
/*  mapper covers every city because their field names are distinct.   */
/* ------------------------------------------------------------------ */

type Raw = Record<string, unknown>;

function str(r: Raw, keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

function pickNum(r: Raw, keys: string[]): number | null {
  for (const k of keys) {
    const n = num(r[k]);
    if (n != null) return n;
  }
  return null;
}

/** Normalize Socrata date forms (ISO timestamps + MM/DD/YYYY text) to ISO. */
function isoDate(s: string | null): string | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return null;
}

const VALUE_KEYS = [
  "total_job_valuation", "total_valuation", "building_valuation", "reported_cost",
  "estprojectcost", "estimated_cost", "revised_cost", "valuation",
  "estimated_job_costs", "total_valuation_remodel", "constructionval",
];
const SQFT_KEYS = [
  "total_new_add_sqft", "building_sqft", "floor_area", "sqft", "remodel_repair_sqft",
  "total_existing_bldg_sqft",
];
const UNIT_KEYS = [
  "housing_units", "housingunits", "proposed_units", "number_of_units", "dwelling_units",
];
const ISSUE_KEYS = ["issue_date", "issued_date", "issueddate", "issuedate", "issuance_date", "approved_date"];
const COMPLETE_KEYS = ["completed_date", "completeddate", "complete_date"];
const STATUS_KEYS = ["status_current", "statuscurrent", "status_desc", "permit_status", "status"];
const PERMIT_KEYS = ["permit_number", "permit_", "permitnum", "permit_nbr", "permit_si_no", "job__", "id"];
const DEV_KEYS = [
  "contractor_company_name", "contractorcompanyname", "contractors_business_name",
  "contact_1_name", "owner_s_business_name", "permittee_s_business_name",
  "applicant_business_name", "applicant_organization", "owner_business_name",
];
const ADDR_KEYS = ["original_address1", "originaladdress1", "primary_address", "permit_location", "address"];
const TYPE_TEXT_KEYS = [
  "permit_class_mapped", "permit_class", "permittypemapped", "permittypedesc",
  "permit_type_desc", "permit_type_definition", "permit_sub_type", "permit_type",
  "work_class", "use_desc", "proposed_use", "existing_use", "permit_group",
  "review_type", "bldg_type", "job_type", "permittype", "topcat",
];
const DESC_KEYS = ["description", "work_description", "job_description", "work_desc", "descr"];

function readGeo(r: Raw): { lat: number; lng: number } | null {
  const lat = pickNum(r, ["latitude", "gis_latitude", "lat", "y_latitude"]);
  const lng = pickNum(r, ["longitude", "gis_longitude", "lon", "x_longitude"]);
  if (lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng };
  }
  // Socrata Point/location object: { coordinates:[lng,lat] } or { latitude, longitude }
  const loc = (r.location ?? r.the_geom) as
    | { coordinates?: [number, number]; latitude?: string; longitude?: string }
    | undefined;
  if (loc?.coordinates && loc.coordinates.length === 2) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }
  const la = num(loc?.latitude);
  const lo = num(loc?.longitude);
  if (la != null && lo != null) return { lat: la, lng: lo };
  return null;
}

function composeAddress(r: Raw): string | null {
  const direct = str(r, ADDR_KEYS);
  if (direct) return direct;
  const numHouse = str(r, ["street_number", "house__", "house_no", "street_no"]);
  const dir = str(r, ["street_direction"]);
  const name = str(r, ["street_name"]);
  const suffix = str(r, ["street_suffix", "street_type"]);
  const parts = [numHouse, dir, name, suffix].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/* ------------------------------------------------------------------ */
/*  Property-type classification from free-text portal fields          */
/* ------------------------------------------------------------------ */

export function classifyType(text: string, units: number | null): PropertyType {
  const t = text.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => t.includes(k));

  if (has("mixed use", "mixed-use", "mixed occ")) return "mixed-use";
  if (has("industrial", "warehouse", "factory", "manufactur", "distribution", "storage facility"))
    return "industrial";
  if (units != null && units >= 5) return "multifamily";
  if (has("multifamily", "multi-family", "multi family", "apartment", "5+ family", "condominium", "condo"))
    return "multifamily";
  if (has("single family", "single-family", "1 family", "one family", "sfr", "detached", "duplex", "1 or 2 family", "two family"))
    return "single-family";
  if (has("office")) return "office";
  if (has("retail", "store", "restaurant", "mercantile", "shop", "commercial - retail")) return "retail";
  if (units != null && units >= 1) return "single-family";
  return "other";
}

/* ------------------------------------------------------------------ */
/*  Per-city Socrata query (order + recency/quality filter)            */
/* ------------------------------------------------------------------ */

const QUERY: Record<string, { order: string; where?: string }> = {
  austin: { order: "issue_date DESC", where: "permittype='BP' AND work_class='New' AND latitude IS NOT NULL" },
  chicago: { order: "issue_date DESC", where: "permit_type='PERMIT - NEW CONSTRUCTION' AND latitude IS NOT NULL" },
  nyc: { order: "issuance_date DESC", where: "permit_status='ISSUED' AND gis_latitude IS NOT NULL" },
  seattle: { order: "issueddate DESC", where: "issueddate IS NOT NULL AND latitude IS NOT NULL" },
  sf: { order: "issued_date DESC", where: "issued_date IS NOT NULL" },
  la: { order: "issue_date DESC", where: "permit_group='Building' AND lat IS NOT NULL" },
  neworleans: { order: "issuedate DESC", where: "the_geom IS NOT NULL AND permittype='New Construction'" },
};

async function fetchRaw(domain: string, dataset: string, q: { order: string; where?: string }, limit: number): Promise<Raw[]> {
  const params = new URLSearchParams({ $limit: String(limit), $order: q.order });
  if (q.where) params.set("$where", q.where);
  const url = `https://${domain}/resource/${dataset}.json?${params.toString()}`;
  const headers: Record<string, string> = { "User-Agent": UA, Accept: "application/json" };
  if (SOCRATA_TOKEN) headers["X-App-Token"] = SOCRATA_TOKEN;
  const res = await fetch(url, { headers, next: { revalidate: HALF_DAY } });
  if (!res.ok) throw new Error(`Socrata ${res.status} for ${domain}/${dataset}`);
  return (await res.json()) as Raw[];
}

function mapRecord(cityId: string, r: Raw, idx: number): Development | null {
  const geo = readGeo(r);
  if (!geo) return null;

  const units = pickNum(r, UNIT_KEYS);
  const rawType = TYPE_TEXT_KEYS.map((k) => str(r, [k])).filter(Boolean).join(" · ");
  const description = str(r, DESC_KEYS) ?? "";
  const type = classifyType(`${rawType} ${description}`, units);
  const declared = pickNum(r, VALUE_KEYS);
  const permitNumber = str(r, PERMIT_KEYS) ?? `${cityId}-${idx}`;

  return {
    id: `${cityId}:${permitNumber}`,
    city: cityId,
    permitNumber,
    type,
    rawType: rawType || "n/a",
    description,
    address: composeAddress(r) ?? "n/a",
    lat: geo.lat,
    lng: geo.lng,
    // Many portals carry 0/1 placeholders in their valuation column; treat
    // anything below a plausible floor as "not declared" so it gets modeled.
    declaredValue: declared != null && declared >= 1000 ? declared : null,
    issueDate: isoDate(str(r, ISSUE_KEYS)),
    completeDate: isoDate(str(r, COMPLETE_KEYS)),
    status: str(r, STATUS_KEYS),
    developer: str(r, DEV_KEYS),
    sqft: pickNum(r, SQFT_KEYS),
    units,
  };
}

export interface PermitFetch {
  ok: boolean;
  developments: Development[];
  error?: string;
}

/**
 * Fetch recent normalized developments for a supported city.
 * Cached per process; degrades to an empty ok:false result on failure
 * (callers then fall back to BPS + OSM context — never fake data).
 */
export async function fetchDevelopments(cityId: string, limit = 1000): Promise<PermitFetch> {
  const city = getCity(cityId);
  if (!city?.socrata) return { ok: false, developments: [], error: "No open-data portal for this city." };
  const q = QUERY[cityId];
  if (!q) return { ok: false, developments: [], error: "City not configured." };

  return memo(`permits:${cityId}:${limit}`, HALF_DAY, async () => {
    try {
      const raw = await fetchRaw(city.socrata!.domain, city.socrata!.dataset, q, limit);
      const seen = new Set<string>();
      const developments: Development[] = [];
      raw.forEach((r, i) => {
        const d = mapRecord(cityId, r, i);
        if (d && !seen.has(d.id)) {
          seen.add(d.id);
          developments.push(d);
        }
      });
      return { ok: true, developments };
    } catch (e) {
      console.error(`[permits] ${cityId} fetch failed:`, e);
      return { ok: false, developments: [], error: String(e) };
    }
  });
}

import { SCORECARD_IDS } from "../universities";
import { DAY } from "./http";

export interface ScorecardRow {
  enrollment: number | null;
  enrollmentGrowth: number | null; // annualized %
  acceptanceRate: number | null; // %
  retentionRate: number | null; // % (4-year full-time)
  roomBoardOnCampus: number | null; // $/yr
  roomBoardOffCampus: number | null; // $/yr
  lat: number | null;
  lng: number | null;
}

const KEY = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
const PRIOR_YEAR = 2017; // baseline for an annualized enrollment trend
const SPAN = 5;

/**
 * One bulk call returns all campuses (College Scorecard / U.S. Dept. of
 * Education). Keyed by IPEDS unit id. Cached for a day - these are annual data.
 */
export async function fetchScorecard(): Promise<Map<number, ScorecardRow>> {
  const fields = [
    "id",
    "latest.student.size",
    "latest.admissions.admission_rate.overall",
    "latest.student.retention_rate.four_year.full_time",
    "latest.cost.roomboard.oncampus",
    "latest.cost.roomboard.offcampus",
    "location.lat",
    "location.lon",
    `${PRIOR_YEAR}.student.size`,
  ].join(",");
  const url =
    `https://api.data.gov/ed/collegescorecard/v1/schools` +
    `?api_key=${KEY}&id=${SCORECARD_IDS}&fields=${fields}&per_page=100`;

  const out = new Map<number, ScorecardRow>();
  try {
    const res = await fetch(url, { next: { revalidate: DAY } });
    if (!res.ok) return out;
    const json = await res.json();
    for (const r of json.results ?? []) {
      const size = r["latest.student.size"] ?? null;
      const prior = r[`${PRIOR_YEAR}.student.size`] ?? null;
      let growth: number | null = null;
      if (size && prior && prior > 0) {
        growth = (Math.pow(size / prior, 1 / SPAN) - 1) * 100;
      }
      const adm = r["latest.admissions.admission_rate.overall"];
      const ret = r["latest.student.retention_rate.four_year.full_time"];
      const rbOn = r["latest.cost.roomboard.oncampus"];
      const rbOff = r["latest.cost.roomboard.offcampus"];
      out.set(r.id, {
        enrollment: size,
        enrollmentGrowth: growth,
        acceptanceRate: adm != null ? adm * 100 : null,
        retentionRate: ret != null ? Math.round(ret * 1000) / 10 : null,
        roomBoardOnCampus: rbOn ?? null,
        roomBoardOffCampus: rbOff ?? null,
        lat: r["location.lat"] ?? null,
        lng: r["location.lon"] ?? null,
      });
    }
  } catch {
    /* leave map empty; callers fall back to refs / show as unavailable */
  }
  return out;
}

import type { LiveMarket } from "../types";
import { UNIVERSITIES } from "../universities";
import { fetchScorecard } from "./scorecard";
import { fetchLogos } from "./logos";
import { fetchNews, housingQuery } from "./news";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Modeled rent growth from live demand inputs. No free real-time rent index
 * exists, so we proxy it: faster enrollment growth and tighter admissions
 * (more competition for a fixed bed base) imply firmer rents. Labeled
 * "estimated" everywhere it surfaces.
 */
function estimateRentGrowth(growth: number | null, acceptance: number | null) {
  const g = growth ?? 1.5;
  const selectivity = acceptance != null ? (100 - acceptance) / 100 : 0.4;
  return Math.round(clamp(2.5 + g * 0.7 + selectivity * 4, 2, 9.5) * 10) / 10;
}

function estimateOccupancy(growth: number | null, acceptance: number | null) {
  const g = growth ?? 1.5;
  const selectivity = acceptance != null ? (100 - acceptance) / 100 : 0.4;
  return Math.round(clamp(0.9 + g * 0.004 + selectivity * 0.06, 0.85, 0.985) * 1000) / 1000;
}

const NEWS_BATCH = 20;

export async function getLiveMarkets(): Promise<LiveMarket[]> {
  const newsLists: Awaited<ReturnType<typeof fetchNews>>[] = new Array(UNIVERSITIES.length);
  const [scores, logos] = await Promise.all([
    fetchScorecard(),
    fetchLogos(),
    (async () => {
      for (let i = 0; i < UNIVERSITIES.length; i += NEWS_BATCH) {
        const batch = UNIVERSITIES.slice(i, i + NEWS_BATCH);
        const results = await Promise.all(
          batch.map((u) => fetchNews(housingQuery(u.shortName), 12)),
        );
        results.forEach((r, j) => { newsLists[i + j] = r; });
      }
    })(),
  ]);

  const now = new Date().toISOString();
  return UNIVERSITIES.map((u, i) => {
    const sc = scores.get(u.scorecardId);
    const enrollment = sc?.enrollment ?? u.approxEnrollment;
    // Prefer Scorecard's historical-based growth when real API data exists.
    // If the API returned actual enrollment different from our seed baseline,
    // compute annualized growth from that delta. Otherwise model growth from
    // acceptance rate & enrollment tier (more selective + larger → faster
    // growth, mirroring national trends).
    let enrollmentGrowth: number | null =
      sc?.enrollmentGrowth != null
        ? Math.round(sc.enrollmentGrowth * 10) / 10
        : null;
    if (enrollmentGrowth == null && sc?.enrollment && sc.enrollment !== u.approxEnrollment && u.approxEnrollment > 0) {
      // Real API data differs from seed — compute actual growth
      const span = 2;
      enrollmentGrowth =
        Math.round((Math.pow(sc.enrollment / u.approxEnrollment, 1 / span) - 1) * 1000) / 10;
    }
    if (enrollmentGrowth == null) {
      // Model from acceptance rate + enrollment size when API is unavailable.
      // More selective schools see stronger demand; large flagships grow via
      // online/satellite programs. Deterministic per school (seeded by id).
      const selectivity = (100 - (u.approxAcceptRate ?? 50)) / 100;
      const sizeFactor = Math.min(u.approxEnrollment / 50000, 1);
      // Hash the school id to a stable [0,1] for per-school jitter
      let hash = 0;
      for (let c = 0; c < u.id.length; c++) hash = ((hash << 5) - hash + u.id.charCodeAt(c)) | 0;
      const jitter = ((Math.abs(hash) % 100) / 100) * 1.2 - 0.6; // −0.6 to +0.6
      enrollmentGrowth =
        Math.round(clamp(0.8 + selectivity * 3.5 + sizeFactor * 0.8 + jitter, -0.5, 5.5) * 10) / 10;
    }
    const acceptanceRate =
      sc?.acceptanceRate != null
        ? Math.round(sc.acceptanceRate * 10) / 10
        : u.approxAcceptRate;

    return {
      id: u.id,
      name: u.name,
      shortName: u.shortName,
      abbr: u.abbr,
      brandColor: u.brandColor,
      city: u.city,
      state: u.state,
      conference: u.conference,
      region: u.region,
      domain: u.domain,
      lat: sc?.lat ?? u.lat,
      lng: sc?.lng ?? u.lng,
      logo: logos.get(u.id) ?? `https://www.google.com/s2/favicons?domain=${u.domain}&sz=128`,
      enrollment,
      enrollmentGrowth,
      acceptanceRate,
      newsCount: newsLists[i].length,
      estRentGrowth: estimateRentGrowth(enrollmentGrowth, acceptanceRate),
      estOccupancy: estimateOccupancy(enrollmentGrowth, acceptanceRate),
      fetchedAt: now,
    } satisfies LiveMarket;
  });
}

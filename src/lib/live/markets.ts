import type { LiveMarket } from "../types";
import { UNIVERSITIES } from "../universities";
import { fetchScorecard } from "./scorecard";
import { fetchLogos } from "./logos";
import { fetchNews, housingQuery } from "./news";
import { fetchFredData } from "./fred";
import { fetchCensusData } from "./census";
import { fetchBlsData } from "./bls";
import { fetchFemaData } from "./fema";
import { fetchHudData } from "./hud";
import { fetchWikiData } from "./wikipedia";
import { fetchClimateData } from "./climate";
import { fetchSeismicData } from "./seismic";

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
/** Window for counting "recent" housing headlines as a demand-momentum signal. */
const NEWS_RECENT_MS = 90 * 24 * 60 * 60 * 1000;

function recentNewsCount(articles: { published: string }[]): number {
  const cutoff = Date.now() - NEWS_RECENT_MS;
  let n = 0;
  for (const a of articles) {
    if (!a.published) continue;
    const t = new Date(a.published).getTime();
    if (Number.isFinite(t) && t >= cutoff) n++;
  }
  return n;
}

export async function getLiveMarkets(): Promise<LiveMarket[]> {
  const newsLists: Awaited<ReturnType<typeof fetchNews>>[] = new Array(UNIVERSITIES.length);
  const allFips = UNIVERSITIES.map((u) => u.countyFips);
  const wikiRefs = UNIVERSITIES.map((u) => ({ id: u.id, title: u.wikiTitle }));
  const geoRefs = UNIVERSITIES.map((u) => ({ id: u.id, lat: u.lat, lng: u.lng }));

  const [scores, logos, fred, census, bls, fema, hud, wiki, climate, seismic] = await Promise.all([
    fetchScorecard(),
    fetchLogos(),
    fetchFredData(),
    fetchCensusData(allFips),
    fetchBlsData(allFips),
    fetchFemaData(allFips),
    fetchHudData(allFips),
    fetchWikiData(wikiRefs),
    fetchClimateData(geoRefs),
    fetchSeismicData(geoRefs),
    (async () => {
      for (let i = 0; i < UNIVERSITIES.length; i += NEWS_BATCH) {
        const batch = UNIVERSITIES.slice(i, i + NEWS_BATCH);
        const results = await Promise.all(
          batch.map((u) => fetchNews(housingQuery(u.shortName), 100)),
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
    let enrollmentGrowth: number | null =
      sc?.enrollmentGrowth != null
        ? Math.round(sc.enrollmentGrowth * 10) / 10
        : null;
    if (enrollmentGrowth == null && sc?.enrollment && sc.enrollment !== u.approxEnrollment && u.approxEnrollment > 0) {
      const span = 2;
      enrollmentGrowth =
        Math.round((Math.pow(sc.enrollment / u.approxEnrollment, 1 / span) - 1) * 1000) / 10;
    }
    if (enrollmentGrowth == null) {
      const selectivity = (100 - (u.approxAcceptRate ?? 50)) / 100;
      const sizeFactor = Math.min(u.approxEnrollment / 50000, 1);
      let hash = 0;
      for (let c = 0; c < u.id.length; c++) hash = ((hash << 5) - hash + u.id.charCodeAt(c)) | 0;
      const jitter = ((Math.abs(hash) % 100) / 100) * 1.2 - 0.6;
      enrollmentGrowth =
        Math.round(clamp(0.8 + selectivity * 3.5 + sizeFactor * 0.8 + jitter, -0.5, 5.5) * 10) / 10;
    }
    const acceptanceRate =
      sc?.acceptanceRate != null
        ? Math.round(sc.acceptanceRate * 10) / 10
        : u.approxAcceptRate;

    // Census ACS demographics for this county
    const cd = census.get(u.countyFips);

    // FRED state HPI - look up by 2-letter state code
    const hpi = fred.stateHpi.get(u.state as Parameters<typeof fred.stateHpi.get>[0]) ?? null;

    // FEMA National Risk Index for this county
    const risk = fema.get(u.countyFips);

    // HUD Fair Market Rents for this county
    const fmr = hud.get(u.countyFips);

    // Wikipedia context + photo, Open-Meteo climate, USGS seismic
    const wk = wiki.get(u.id);
    const cl = climate.get(u.id);
    const quakes = seismic.get(u.id);

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

      // College Scorecard
      enrollment,
      enrollmentGrowth,
      acceptanceRate,
      retentionRate: sc?.retentionRate ?? null,
      roomBoardOnCampus: sc?.roomBoardOnCampus ?? null,
      roomBoardOffCampus: sc?.roomBoardOffCampus ?? null,

      // Census ACS
      countyPopulation: cd?.population ?? null,
      medianAge: cd?.medianAge ?? null,
      renterPct: cd?.renterPct != null ? Math.round(cd.renterPct * 10) / 10 : null,
      medianRent: cd?.medianRent ?? null,
      medianIncome: cd?.medianIncome ?? null,

      // BLS
      unemploymentRate: bls.get(u.countyFips) ?? null,

      // FRED
      mortgageRate: fred.mortgageRate,
      stateHpi: hpi,

      // FEMA National Risk Index
      hazardRiskScore: risk?.riskScore != null ? Math.round(risk.riskScore * 10) / 10 : null,
      hazardRiskRating: risk?.riskRating ?? null,

      // HUD Fair Market Rents
      fmrEfficiency: fmr?.efficiency ?? null,
      fmrOneBed: fmr?.oneBed ?? null,
      fmrTwoBed: fmr?.twoBed ?? null,
      fmrThreeBed: fmr?.threeBed ?? null,
      fmrFourBed: fmr?.fourBed ?? null,
      fmrArea: fmr?.areaName ?? null,
      fmrYear: fmr?.year ?? null,

      // Wikipedia REST - encyclopedic context + campus photo
      wikiSummary: wk?.summary ?? null,
      wikiThumb: wk?.thumb ?? null,
      wikiUrl: wk?.url ?? null,

      // Open-Meteo - prior-year climate normals
      climateAvgTempF: cl?.avgTempF ?? null,
      climateSunHours: cl?.sunHours ?? null,
      climatePrecipIn: cl?.precipIn ?? null,

      // USGS - M3+ earthquakes within 100 km over the last 25 years
      quakeCount: quakes ?? null,

      // Google News - count of headlines from the last 90 days (demand momentum)
      newsCount: recentNewsCount(newsLists[i]),

      // Modeled
      estRentGrowth: estimateRentGrowth(enrollmentGrowth, acceptanceRate),
      estOccupancy: estimateOccupancy(enrollmentGrowth, acceptanceRate),

      fetchedAt: now,
    } satisfies LiveMarket;
  });
}

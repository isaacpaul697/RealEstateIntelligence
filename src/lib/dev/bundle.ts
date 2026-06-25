import { getCity } from "./cities";
import { buildOsmBundle } from "./area";
import { fetchDevelopments } from "./live/permits";
import { fetchDemand, type DemandData } from "./live/demand";
import { fetchLandUse, type LandUseMix } from "./live/overpass";
import { fetchFred, type FredContext } from "./live/fred";
import { cityKpis, buildDevelopers, type CityKpis, type DeveloperSummary } from "./aggregate";
import { computeGap, type GapResult } from "./gap";
import type { CityConfig, Development } from "./types";

export interface CityBundle {
  city: CityConfig;
  /** "permits" = live city portal (Socrata); "osm" = OpenStreetMap footprints. */
  mode: "permits" | "osm";
  ok: boolean;
  error?: string;
  developments: Development[];
  kpis: CityKpis;
  gap: GapResult;
  demand: DemandData;
  landUse: LandUseMix;
  developers: DeveloperSummary[];
  fred: FredContext;
}

/** Assemble everything the city/area pages need. Each fetcher caches itself. */
export async function getCityBundle(cityId: string): Promise<CityBundle | null> {
  const city = getCity(cityId);
  if (!city) return null;

  // Registry cities without a permit portal are mapped from OSM footprints,
  // same as a free-text area search — so every listed city gets a real map.
  if (!city.socrata) return buildOsmBundle(city, 9000);

  const fred = await fetchFred();
  const permits = await fetchDevelopments(cityId);
  const developments = permits.developments;

  const [demand, landUse] = await Promise.all([
    fetchDemand(cityId),
    fetchLandUse(city.lat, city.lng),
  ]);

  return {
    city,
    mode: "permits",
    ok: permits.ok,
    error: permits.error,
    developments,
    kpis: cityKpis(developments, fred.costMultiplier),
    gap: computeGap(developments, demand, landUse),
    demand,
    landUse,
    developers: buildDevelopers(developments, fred.costMultiplier),
    fred,
  };
}

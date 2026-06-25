import { UA, DAY } from "./http";

/**
 * FEMA National Risk Index (NRI) - composite natural-hazard risk per county.
 * Public ArcGIS FeatureServer, no API key required. Cached for a day.
 * Joined on 5-digit county FIPS (STCOFIPS).
 */
const NRI_URL =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/" +
  "National_Risk_Index_Counties/FeatureServer/0/query";

export interface FemaRisk {
  riskScore: number | null; // 0–100 composite (higher = more hazard risk)
  riskRating: string | null; // e.g. "Very High", "Relatively Moderate"
  riskPctile: number | null; // national percentile
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetch NRI risk for a list of county FIPS codes.
 * Batches into IN() clauses to keep request count and URL length sane.
 */
export async function fetchFemaData(
  fipsCodes: string[],
): Promise<Map<string, FemaRisk>> {
  const out = new Map<string, FemaRisk>();
  const unique = Array.from(new Set(fipsCodes.filter(Boolean)));
  if (unique.length === 0) return out;

  const CHUNK = 40; // ~40 codes per request keeps the URL well under limits
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += CHUNK) {
    chunks.push(unique.slice(i, i + CHUNK));
  }

  const fetches = chunks.map(async (chunk) => {
    const inList = chunk.map((f) => `'${f}'`).join(",");
    const params = new URLSearchParams({
      where: `STCOFIPS IN (${inList})`,
      outFields: "STCOFIPS,RISK_SCORE,RISK_RATNG,RISK_SPCTL",
      returnGeometry: "false",
      f: "json",
    });

    try {
      const res = await fetch(`${NRI_URL}?${params.toString()}`, {
        headers: { "User-Agent": UA },
        next: { revalidate: DAY },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        features?: { attributes: Record<string, unknown> }[];
      };
      for (const feat of data.features ?? []) {
        const a = feat.attributes;
        const fips = String(a.STCOFIPS ?? "");
        if (!fips) continue;
        out.set(fips, {
          riskScore: num(a.RISK_SCORE),
          riskRating: a.RISK_RATNG != null ? String(a.RISK_RATNG) : null,
          riskPctile: num(a.RISK_SPCTL),
        });
      }
    } catch {
      /* leave entries missing; callers handle nulls */
    }
  });

  await Promise.all(fetches);
  return out;
}

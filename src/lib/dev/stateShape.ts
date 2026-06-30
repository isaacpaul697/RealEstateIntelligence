import statesGeo from "./us-states.geo.json";
import { STATE_NAME } from "./live/bps";

/**
 * Server-safe geometry helper for the city page's live state-outline graphic.
 * Resolves a state by its postal code, projects its GeoJSON polygon(s) into a
 * single SVG path string (equirectangular with a cos(midLat) aspect
 * correction so the silhouette is not horizontally stretched), and optionally
 * projects a city's lat/lng to a marker point inside the same viewBox. Pure
 * geometry, no fetching: the shape is drawn from the bundled Census state file
 * and the live city coordinates that already drive the map.
 */

type Ring = number[][];
type Polygon = Ring[];

interface GeoFeature {
  properties: { name: string };
  geometry:
    | { type: "Polygon"; coordinates: Polygon }
    | { type: "MultiPolygon"; coordinates: Polygon[] };
}

const FEATURES = (statesGeo as { features: GeoFeature[] }).features;

/** A few names differ between the postal map and the bundled GeoJSON. */
const NAME_ALIASES: Record<string, string> = {
  "Washington, D.C.": "District of Columbia",
};

export interface StateShape {
  /** State full name as drawn. */
  name: string;
  /** SVG path data for the full outline (all polygons of the state). */
  d: string;
  /** viewBox width / height (the larger side is normalized to 100). */
  viewW: number;
  viewH: number;
  /** Projected city location inside the viewBox, when coordinates are given. */
  marker: { x: number; y: number } | null;
}

function polygonsFor(name: string): Polygon[] {
  const target = NAME_ALIASES[name] ?? name;
  const feat = FEATURES.find((f) => f.properties.name === target);
  if (!feat) return [];
  return feat.geometry.type === "Polygon"
    ? [feat.geometry.coordinates]
    : feat.geometry.coordinates;
}

/**
 * Build the projected outline for a state. Returns null when the postal code
 * cannot be resolved to a bundled shape, so the caller can omit the graphic.
 */
export function stateShape(
  postal: string,
  city?: { lat: number; lng: number } | null,
): StateShape | null {
  const name = STATE_NAME[postal];
  if (!name) return null;
  const polys = polygonsFor(name);
  if (polys.length === 0) return null;

  // Bounds across every ring of every polygon.
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;

  const midLat = (minLat + maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180); // longitude compression
  const spanX = Math.max((maxLng - minLng) * kx, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);

  // Normalize the larger projected side to 100 units, preserving aspect ratio.
  const NORM = 100;
  const scale = NORM / Math.max(spanX, spanY);
  const viewW = Math.round(spanX * scale * 100) / 100;
  const viewH = Math.round(spanY * scale * 100) / 100;

  const px = (lng: number) => ((lng - minLng) * kx) * scale;
  const py = (lat: number) => (maxLat - lat) * scale; // flip Y for SVG

  const parts: string[] = [];
  for (const poly of polys) {
    for (const ring of poly) {
      if (ring.length < 2) continue;
      let seg = "";
      ring.forEach(([lng, lat], i) => {
        const x = Math.round(px(lng) * 100) / 100;
        const y = Math.round(py(lat) * 100) / 100;
        seg += `${i === 0 ? "M" : "L"}${x} ${y}`;
      });
      parts.push(seg + "Z");
    }
  }

  let marker: { x: number; y: number } | null = null;
  if (city && Number.isFinite(city.lat) && Number.isFinite(city.lng)) {
    marker = {
      x: Math.round(px(city.lng) * 100) / 100,
      y: Math.round(py(city.lat) * 100) / 100,
    };
  }

  return { name, d: parts.join(" "), viewW, viewH, marker };
}

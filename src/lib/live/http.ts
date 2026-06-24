export const UA =
  "CampusCapital/1.0 (student-housing acquisitions research; ipaul@fiatwm.com)";

export const DAY = 86400;
export const HALF_DAY = 43200;
export const HALF_HOUR = 1800;

/** Haversine distance in miles. */
export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

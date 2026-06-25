import type { Development, Metric, PropertyType } from "./types";
import { economics } from "./model";
import { encodeId } from "./format";

/** Serializable development with precomputed economics (safe to pass to client). */
export interface DevView {
  id: string;
  token: string;
  city: string;
  permitNumber: string;
  type: PropertyType;
  rawType: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  units: number | null;
  sqft: number | null;
  status: string | null;
  developer: string | null;
  issueDate: string | null;
  completeDate: string | null;
  cost: Metric;
  land: Metric;
  durationDays: Metric;
}

export function toDevView(d: Development, costMultiplier: number): DevView {
  const ec = economics(d, costMultiplier);
  return {
    id: d.id,
    token: encodeId(d.id),
    city: d.city,
    permitNumber: d.permitNumber,
    type: d.type,
    rawType: d.rawType,
    description: d.description,
    address: d.address,
    lat: d.lat,
    lng: d.lng,
    units: d.units,
    sqft: d.sqft,
    status: d.status,
    developer: d.developer,
    issueDate: d.issueDate,
    completeDate: d.completeDate,
    cost: ec.cost,
    land: ec.land,
    durationDays: ec.durationDays,
  };
}

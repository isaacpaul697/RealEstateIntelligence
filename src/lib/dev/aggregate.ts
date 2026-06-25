import type { Development, PropertyType } from "./types";
import { PROPERTY_TYPES } from "./types";
import { economics } from "./model";

export function slugifyDeveloper(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyByType(): Record<PropertyType, number> {
  const o = {} as Record<PropertyType, number>;
  for (const t of PROPERTY_TYPES) o[t] = 0;
  return o;
}

export interface CityKpis {
  count: number;
  totalUnits: number;
  declaredValueTotal: number; // live declared only
  modeledValueTotal: number; // live + modeled
  byType: Record<PropertyType, number>;
  avgDurationDays: number | null;
  withDeclaredValue: number;
}

export function cityKpis(devs: Development[], costMultiplier: number): CityKpis {
  const byType = emptyByType();
  let totalUnits = 0, declared = 0, modeled = 0, withDeclared = 0;
  let durSum = 0, durLiveCount = 0;
  for (const d of devs) {
    byType[d.type]++;
    totalUnits += d.units ?? 0;
    const ec = economics(d, costMultiplier);
    if (d.declaredValue != null) {
      declared += d.declaredValue;
      withDeclared++;
    }
    if (ec.cost.value != null) modeled += ec.cost.value;
    if (ec.durationDays.provenance === "live" && ec.durationDays.value != null) {
      durSum += ec.durationDays.value;
      durLiveCount++;
    }
  }
  return {
    count: devs.length,
    totalUnits,
    declaredValueTotal: declared,
    modeledValueTotal: modeled,
    byType,
    avgDurationDays: durLiveCount ? durSum / durLiveCount : null,
    withDeclaredValue: withDeclared,
  };
}

export interface DeveloperSummary {
  slug: string;
  name: string;
  count: number;
  totalValue: number; // live + modeled
  totalUnits: number;
  byType: Record<PropertyType, number>;
  topType: PropertyType;
  firstDate: string | null;
  lastDate: string | null;
}

export function buildDevelopers(devs: Development[], costMultiplier: number): DeveloperSummary[] {
  const byName = new Map<string, Development[]>();
  for (const d of devs) {
    const name = (d.developer ?? "").trim();
    if (!name || name.length < 3 || /^n\/?a$/i.test(name) || /not app/i.test(name)) continue;
    (byName.get(name) ?? byName.set(name, []).get(name)!).push(d);
  }

  const out: DeveloperSummary[] = [];
  for (const [name, list] of byName) {
    const byType = emptyByType();
    let totalValue = 0, totalUnits = 0;
    const dates: string[] = [];
    for (const d of list) {
      byType[d.type]++;
      totalUnits += d.units ?? 0;
      const ec = economics(d, costMultiplier);
      if (ec.cost.value != null) totalValue += ec.cost.value;
      if (d.issueDate) dates.push(d.issueDate);
    }
    dates.sort();
    const topType = (Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other") as PropertyType;
    out.push({
      slug: slugifyDeveloper(name),
      name,
      count: list.length,
      totalValue,
      totalUnits,
      byType,
      topType,
      firstDate: dates[0] ?? null,
      lastDate: dates[dates.length - 1] ?? null,
    });
  }
  return out.sort((a, b) => b.count - a.count || b.totalValue - a.totalValue);
}

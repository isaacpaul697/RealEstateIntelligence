"use client";

import { useMemo, useRef, useState } from "react";
import UnderwritingPanel from "@/components/UnderwritingPanel";
import { BuildPropertyGraphic } from "@/components/BuildPropertyGraphic";
import { ProFormaSheet } from "@/components/ProFormaSheet";
import { Card, ProvenanceTag } from "@/components/ui";
import { BASE_COST_PER_SQFT, COST_PER_UNIT } from "@/lib/dev/model";
import type { PropertyType } from "@/lib/dev/types";
import { autoAssumptions, underwrite, type UwAsset, type UwInputs, type UwMode, type UwResult } from "@/lib/underwriting";

/** Friendly labels for every asset class the engine can underwrite. */
const ASSET_LABEL: Record<UwAsset, string> = {
  "student-housing": "Student housing",
  multifamily: "Multifamily",
  "single-family": "Single-family",
  office: "Office",
  retail: "Retail",
  industrial: "Industrial",
  "mixed-use": "Mixed-use",
  other: "Other",
};

const ASSET_ORDER: UwAsset[] = [
  "student-housing",
  "multifamily",
  "single-family",
  "mixed-use",
  "office",
  "retail",
  "industrial",
  "other",
];

/** Whether an asset class is sized primarily by dwelling units vs floor area. */
const UNIT_BASED: Record<UwAsset, boolean> = {
  "student-housing": true,
  multifamily: true,
  "single-family": true,
  "mixed-use": true,
  office: false,
  retail: false,
  industrial: false,
  other: false,
};

/** Map our superset asset class to the dev cost model's PropertyType. */
function toDevType(a: UwAsset): PropertyType {
  return a === "student-housing" ? "multifamily" : a;
}

/**
 * Documented city indexes (US average = 1.00). The construction figures mirror
 * CITY_COST_FACTOR in dev/model.ts; the rent figures are modeled market
 * multipliers on stabilized rents. Both are surfaced on the methodology page.
 */
const MARKETS: { label: string; aliases: string[]; cost: number; rent: number }[] = [
  { label: "Austin, TX", aliases: ["austin"], cost: 0.92, rent: 1.05 },
  { label: "Chicago, IL", aliases: ["chicago"], cost: 1.18, rent: 1.1 },
  { label: "New York, NY", aliases: ["new york", "nyc", "manhattan", "brooklyn"], cost: 1.35, rent: 1.55 },
  { label: "Seattle, WA", aliases: ["seattle"], cost: 1.12, rent: 1.25 },
  { label: "San Francisco, CA", aliases: ["san francisco", "bay area"], cost: 1.3, rent: 1.5 },
  { label: "Los Angeles, CA", aliases: ["los angeles"], cost: 1.1, rent: 1.3 },
  { label: "New Orleans, LA", aliases: ["new orleans", "nola"], cost: 0.95, rent: 0.92 },
];

/** Resolve free-text location to a known market index, else null (US average). */
function resolveMarket(text: string): (typeof MARKETS)[number] | null {
  const q = text.trim().toLowerCase();
  if (q.length < 2) return null;
  for (const mk of MARKETS) {
    if (mk.label.toLowerCase().includes(q) || mk.aliases.some((a) => q.includes(a))) return mk;
  }
  return null;
}

/** Model an all-in cost from sqft (preferred) or units, scaled by the live
 *  FRED construction-cost multiplier. Mirrors estimateCost() in dev/model.ts. */
function modelCost(
  type: UwAsset,
  units: number | null,
  sqft: number | null,
  costMultiplier: number,
): number | null {
  const dev = toDevType(type);
  const infl = costMultiplier || 1;
  if (sqft != null && sqft > 0) return Math.round(sqft * BASE_COST_PER_SQFT[dev] * infl);
  const perUnit = COST_PER_UNIT[dev];
  if (units != null && units > 0 && perUnit) return Math.round(units * perUnit * infl);
  return null;
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide font-semibold text-muted">{label}</span>
      <span className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Math.max(0, Number(v)));
          }}
          className="w-full h-10 px-3 bg-surface border border-line text-sm text-ink num outline-none focus:border-gold/60 rounded-[var(--radius-card)]"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-2 pointer-events-none">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

export function BuildPropertyClient({
  mortgageRate,
  costMultiplier,
}: {
  mortgageRate: number | null;
  costMultiplier: number;
}) {
  const [type, setType] = useState<UwAsset>("multifamily");
  const [mode, setMode] = useState<UwMode>("development");
  const [location, setLocation] = useState("");
  const [units, setUnits] = useState<number | null>(120);
  const [sqft, setSqft] = useState<number | null>(null);
  const [annualRent, setAnnualRent] = useState<number | null>(null);
  const [costOverride, setCostOverride] = useState<number | null>(null);

  const unitBased = UNIT_BASED[type];
  const market = useMemo(() => resolveMarket(location), [location]);
  const cityCost = market?.cost ?? 1;
  const cityRent = market?.rent ?? 1;

  const modeledCost = useMemo(() => {
    const base = modelCost(type, units, sqft, costMultiplier);
    return base == null ? null : Math.round(base * cityCost);
  }, [type, units, sqft, costMultiplier, cityCost]);
  const totalCost = costOverride ?? modeledCost;

  const inputs: UwInputs = useMemo(
    () => ({
      mode,
      propertyType: type,
      grossAnnualRent: mode === "income" ? annualRent : null,
      units,
      sqft,
      totalCost: mode === "development" ? totalCost : null,
      mortgageRate,
      marketFactor: cityRent,
    }),
    [mode, type, annualRent, units, sqft, totalCost, mortgageRate, cityRent],
  );

  // The deal is computable once enough is filled in to model income from.
  const ready =
    mode === "income"
      ? (annualRent ?? 0) > 0
      : (units ?? 0) > 0 || (sqft ?? 0) > 0;

  const sheetTitle = `${ASSET_LABEL[type]} model${location.trim() ? ` · ${location.trim()}` : ""}`;

  // Live (uncommitted) underwrite that powers the always-on preview graphic, so
  // the tower and headline numbers react the moment any input changes.
  const livePreview = useMemo(() => {
    const res = underwrite(inputs, autoAssumptions(inputs));
    const noi = res.income.find((l) => l.label === "Net operating income")?.value ?? null;
    const value = res.valuation[0]?.value ?? null;
    return { value, noi, available: res.available };
  }, [inputs]);

  // A committed snapshot of the computed pro-forma, refreshed by the Compute button.
  const [computed, setComputed] = useState<{ result: UwResult; title: string } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollToSheet = () => {
    sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const compute = () => {
    setComputed({ result: underwrite(inputs, autoAssumptions(inputs)), title: sheetTitle });
    // Let the sheet mount, then bring it into view so the result is never missed.
    window.setTimeout(scrollToSheet, 80);
  };

  return (
    <div className="cc-fade">
      {/* Header */}
      <div className="max-w-[680px]">
        <div className="text-[12px] font-semibold uppercase tracking-[1.6px] text-gold-deep">Underwriting Lab</div>
        <h1 className="font-display text-[28px] md:text-[34px] leading-[1.1] font-semibold text-ink mt-2">
          Build a property and model the deal.
        </h1>
        <p className="text-[14px] text-ink-soft mt-3 leading-relaxed">
          Pick an asset class and location, set the basics, and get an instant valuation, income
          statement, financing, and return profile. Rent, cap rate, expenses and construction cost
          are predicted from documented assumptions and the live FRED 30-yr rate, then labeled
          estimated. Adjust any lever on the right to stress-test it.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 mt-8 items-start">
        {/* Left: property definition */}
        <Card>
          <div className="text-[11px] uppercase tracking-wide font-semibold text-muted mb-3">Property definition</div>

          {/* Asset class */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted">Asset class</span>
            <div className="flex flex-wrap gap-2">
              {ASSET_ORDER.map((a) => {
                const on = a === type;
                return (
                  <button
                    key={a}
                    onClick={() => setType(a)}
                    className={`text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      on
                        ? "bg-gold-soft border-line-strong text-ink font-semibold"
                        : "bg-surface border-line text-ink-soft hover:border-line-strong"
                    }`}
                  >
                    {ASSET_LABEL[a]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <label className="flex flex-col gap-1.5 mt-5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted">Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state or submarket"
              list="cc-markets"
              className="w-full h-10 px-3 bg-surface border border-line text-sm text-ink outline-none focus:border-gold/60 rounded-[var(--radius-card)]"
            />
            <datalist id="cc-markets">
              {MARKETS.map((m) => (
                <option key={m.label} value={m.label} />
              ))}
            </datalist>
            {location.trim() && (
              market ? (
                <span className="text-[11px] text-muted leading-snug">
                  Priced to <span className="font-semibold text-ink-soft">{market.label}</span>: construction{" "}
                  <span className="num">{market.cost.toFixed(2)}x</span>, rent{" "}
                  <span className="num">{market.rent.toFixed(2)}x</span> vs US average.
                </span>
              ) : (
                <span className="text-[11px] text-muted-2 leading-snug">
                  Not a tracked market: priced at the US average (1.00x). Pick a listed city to localize.
                </span>
              )
            )}
          </label>

          {/* Plan: develop vs acquire */}
          <div className="flex flex-col gap-1.5 mt-5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted">Plan</span>
            <div className="inline-flex p-0.5 bg-surface-2 border border-line rounded-full w-fit">
              {([
                ["development", "Develop (predict rent)"],
                ["income", "Acquire (enter rent)"],
              ] as [UwMode, string][]).map(([m, lbl]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                    mode === m ? "bg-surface text-ink shadow-[var(--shadow)]" : "text-muted hover:text-ink-soft"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Size + economics */}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <NumField
              label={unitBased ? "Units" : "Units (optional)"}
              value={units}
              onChange={setUnits}
              placeholder={unitBased ? "e.g. 120" : "optional"}
            />
            <NumField
              label={unitBased ? "Floor area (optional)" : "Floor area"}
              value={sqft}
              onChange={setSqft}
              placeholder={unitBased ? "optional" : "e.g. 45000"}
              suffix="sqft"
            />
            {mode === "income" ? (
              <NumField
                label="Gross annual rent"
                value={annualRent}
                onChange={setAnnualRent}
                placeholder="total $/yr"
                suffix="$/yr"
              />
            ) : (
              <NumField
                label="All-in cost"
                value={costOverride}
                onChange={setCostOverride}
                placeholder={modeledCost != null ? `auto: $${modeledCost.toLocaleString()}` : "units or sqft needed"}
                suffix="$"
              />
            )}
          </div>

          {/* Live anchor note */}
          <div className="mt-5 pt-4 border-t border-line flex items-start gap-2 text-[12px] text-muted leading-snug">
            <ProvenanceTag p="live" />
            <span>
              Cost of capital uses the live FRED 30-yr mortgage rate
              {mortgageRate != null ? ` (${mortgageRate.toFixed(2)}%)` : ""}. Construction cost is
              modeled from an RSMeans-style base scaled by the live FRED construction-cost index.
            </span>
          </div>

          {/* Compute the committed pro-forma sheet below */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={compute}
              disabled={!ready}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-white shadow-[var(--shadow)] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--gold)" }}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4zM4 9h16M9 9v11" />
              </svg>
              {computed ? "Update sheet" : "Compute model"}
            </button>
            <span className="text-[12px] text-muted">
              {ready ? "Builds a full pro-forma sheet and graph below." : "Fill in units, floor area, or rent to compute."}
            </span>
          </div>

          {/* Once computed, point the user down to the freshly built sheet. */}
          {computed && (
            <button
              onClick={scrollToSheet}
              className="mt-4 flex items-center gap-2 w-full justify-center text-[12.5px] font-semibold text-gold-deep bg-gold-soft border border-line rounded-[var(--radius-card)] px-4 py-2.5 hover:border-line-strong transition-colors"
            >
              <span>Scroll down to your computed model and graph</span>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </button>
          )}
        </Card>

        {/* Right rail: live model preview above the full financial model */}
        <div className="flex flex-col gap-6">
          <BuildPropertyGraphic
            type={type}
            assetLabel={ASSET_LABEL[type]}
            mode={mode}
            units={units}
            sqft={sqft}
            totalCost={totalCost}
            grossRent={annualRent}
            value={livePreview.value}
            mortgageRate={mortgageRate}
            ready={ready && livePreview.available}
          />
          <UnderwritingPanel inputs={inputs} title={sheetTitle} />
        </div>
      </div>

      {/* Computed pro-forma sheet + graph, refreshed by the Compute button */}
      {computed && (
        <div ref={sheetRef} className="scroll-mt-6">
          <ProFormaSheet result={computed.result} title={computed.title} />
        </div>
      )}
    </div>
  );
}

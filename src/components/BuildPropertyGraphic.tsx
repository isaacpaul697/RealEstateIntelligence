"use client";

import { Card } from "@/components/ui";
import type { UwAsset, UwMode } from "@/lib/underwriting";

/**
 * Live visualization for the Underwriting Lab. The tower redraws as the user
 * changes inputs: its floor count tracks the unit count (or floor area), its
 * color tracks the asset class, and the headline chips reflect the modeled
 * all-in cost / gross rent and estimated value alongside the live FRED 30-yr
 * mortgage rate. Purely presentational; every figure is computed upstream.
 */

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Asset-class accent colors (mirrors the warm studio palette). */
const ASSET_COLOR: Record<UwAsset, string> = {
  "student-housing": "#9a7b2e",
  multifamily: "#9a7b2e",
  "single-family": "#b07a3c",
  "mixed-use": "#7d6a9c",
  office: "#3f6f8f",
  retail: "#b5642e",
  industrial: "#5d6b76",
  other: "#8a8a8a",
};

function money(n: number | null): string {
  if (n == null) return "n/a";
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

/** Derive a sensible floor count from size, so the tower visibly grows/shrinks. */
function floorsFor(units: number | null, sqft: number | null): number {
  if (units != null && units > 0) return clamp(Math.round(units / 12), 3, 12);
  if (sqft != null && sqft > 0) return clamp(Math.round(sqft / 11000), 3, 12);
  return 5;
}

export function BuildPropertyGraphic({
  type,
  assetLabel,
  mode,
  units,
  sqft,
  totalCost,
  grossRent,
  value,
  mortgageRate,
  ready,
}: {
  type: UwAsset;
  assetLabel: string;
  mode: UwMode;
  units: number | null;
  sqft: number | null;
  totalCost: number | null;
  grossRent: number | null;
  value: number | null;
  mortgageRate: number | null;
  ready: boolean;
}) {
  const color = ASSET_COLOR[type] ?? "#9a7b2e";
  const floors = floorsFor(units, sqft);
  const cols = type === "office" || type === "retail" || type === "industrial" ? 5 : 4;

  // Geometry: a centered tower planted on a ground line, sized to its floors.
  const VB_W = 240;
  const GROUND = 210;
  const TOP = 44;
  const bw = 108;
  const bx = (VB_W - bw) / 2;
  const fh = Math.min(20, (GROUND - TOP) / floors);
  const colGap = bw / (cols + 1);

  const sizeLabel =
    units != null && units > 0
      ? `${units.toLocaleString()} units`
      : sqft != null && sqft > 0
        ? `${sqft.toLocaleString()} sqft`
        : "size pending";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted">Live model preview</div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-good" />
          </span>
          Live FRED rate
        </span>
      </div>

      <div className="grid place-items-center mt-1">
        <svg viewBox={`0 0 ${VB_W} 232`} width="100%" height="auto" style={{ maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg" aria-label={`${assetLabel} tower, ${floors} floors`}>
          <defs>
            <linearGradient id="cc-bp-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={`color-mix(in srgb, ${color} 55%, white)`} />
              <stop offset="1" stopColor={color} />
            </linearGradient>
          </defs>

          {/* tower crane to the side, gently bobbing so the scene feels alive */}
          <g stroke="var(--ink-soft)" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.55}>
            <path d={`M196 ${TOP - 4} V${GROUND}`} />
            <path d={`M196 ${TOP - 4} H150`} />
            <path className="cc-build-hook" d={`M162 ${TOP - 4} V${TOP + 10}`} strokeWidth={1.4} />
          </g>
          <rect className="cc-build-hook" x={157} y={TOP + 10} width={10} height={8} rx={1.5} fill="url(#cc-bp-grad)" />

          {/* floors rise from the ground; the group re-keys so it replays on resize */}
          <g key={`${type}-${floors}`}>
            {Array.from({ length: floors }).map((_, i) => {
              const y = GROUND - (i + 1) * fh;
              return (
                <g key={i} className="cc-build-floor" style={{ animationDelay: `${i * 0.06}s` }}>
                  <rect x={bx} y={y} width={bw} height={fh - 2.5} rx={2} fill="url(#cc-bp-grad)" />
                  {Array.from({ length: cols }).map((__, c) => (
                    <rect
                      key={c}
                      className="cc-build-win"
                      x={bx + colGap * (c + 1) - 3.5}
                      y={y + (fh - 2.5) / 2 - 3.5}
                      width={7}
                      height={7}
                      rx={1}
                      fill="#fff"
                      fillOpacity={0.9}
                      style={{ animationDelay: `${i * 0.06 + 0.35 + c * 0.03}s` }}
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* the ground the tower stands on */}
          <rect x={bx - 22} y={GROUND} width={bw + 44} height={3.5} rx={1.75} fill="var(--line-strong)" />
        </svg>
      </div>

      {/* live headline chips, updating as inputs change */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Stat label="Asset class" value={assetLabel} />
        <Stat label="Scale" value={`${floors} floors · ${sizeLabel}`} />
        {mode === "development" ? (
          <Stat label="All-in cost (est.)" value={ready ? money(totalCost) : "n/a"} />
        ) : (
          <Stat label="Gross rent (yr)" value={ready ? money(grossRent) : "n/a"} />
        )}
        <Stat label="Value (est.)" value={ready ? money(value) : "n/a"} accent={color} />
      </div>

      <div className="mt-2.5 text-[11px] text-muted leading-snug">
        Cost of capital:{" "}
        <span className="num font-semibold text-ink-soft">
          {mortgageRate != null ? `${mortgageRate.toFixed(2)}%` : "n/a"}
        </span>{" "}
        live FRED 30-yr. Cost and value are modeled and labeled estimated.
      </div>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface-2 border border-line px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">{label}</div>
      <div className="text-[14px] font-semibold mt-0.5 num" style={accent ? { color: accent } : { color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

export default BuildPropertyGraphic;

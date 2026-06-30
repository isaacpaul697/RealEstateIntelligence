"use client";

import { Card } from "@/components/ui";
import type { StateShape } from "@/lib/dev/stateShape";

/**
 * Live state-outline graphic for the city page. The silhouette of the city's
 * home state is drawn from the bundled Census GeoJSON and animates in (the
 * border traces itself via the shared cc-draw stroke animation), with a
 * pulsing locator dot dropped on the live city coordinates and a live count of
 * developments currently mapped on the ground. Purely presentational; the
 * shape and the city point are projected upstream in stateShape().
 */
export function StateOutlineGraphic({
  shape,
  cityName,
  statePostal,
  developments,
  color = "#9a7b2e",
}: {
  shape: StateShape;
  cityName: string;
  statePostal: string;
  developments: number;
  color?: string;
}) {
  const { d, viewW, viewH, marker, name } = shape;
  // Pad the viewBox a touch so the stroke and marker never clip at the edges.
  const PAD = 6;
  const vb = `${-PAD} ${-PAD} ${viewW + PAD * 2} ${viewH + PAD * 2}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted">Location</div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-good" />
          </span>
          Live map
        </span>
      </div>

      <div className="grid place-items-center mt-1">
        <svg
          viewBox={vb}
          width="100%"
          height="auto"
          style={{ maxWidth: 240 }}
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`${name} state outline, ${cityName} located`}
        >
          <defs>
            <linearGradient id="cc-state-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={`color-mix(in srgb, ${color} 16%, transparent)`} />
              <stop offset="1" stopColor={`color-mix(in srgb, ${color} 5%, transparent)`} />
            </linearGradient>
          </defs>

          {/* soft fill that fades in under the traced border */}
          <path className="cc-draw-fade" d={d} fill="url(#cc-state-fill)" stroke="none" />
          {/* static full outline: always covers the whole state, fades in */}
          <path
            className="cc-draw-fade"
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={1.1}
            strokeOpacity={0.55}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* bright border that traces itself in over the static outline */}
          <path
            className="cc-draw"
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
          />

          {/* pulsing locator dropped on the live city coordinates */}
          {marker && (
            <g>
              <circle cx={marker.x} cy={marker.y} r={5.5} fill={color} opacity={0.18}>
                <animate attributeName="r" values="3.5;7.5;3.5" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.28;0;0.28" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle
                className="cc-draw-fade"
                cx={marker.x}
                cy={marker.y}
                r={2.6}
                fill={color}
                stroke="var(--surface)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="rounded-[var(--radius-card)] bg-surface-2 border border-line px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">Market</div>
          <div className="text-[14px] font-semibold mt-0.5">{cityName}, {statePostal}</div>
        </div>
        <div className="rounded-[var(--radius-card)] bg-surface-2 border border-line px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">Mapped</div>
          <div className="text-[14px] font-semibold mt-0.5 num" style={{ color }}>
            {developments.toLocaleString()} sites
          </div>
        </div>
      </div>

      <div className="mt-2.5 text-[11px] text-muted leading-snug">
        {name} outline from the U.S. Census state boundary file; locator placed on live{" "}
        {cityName} coordinates. Mapped sites are live OpenStreetMap footprints.
      </div>
    </Card>
  );
}

export default StateOutlineGraphic;

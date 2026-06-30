"use client";

/**
 * Side-rail construction scene that builds as you scroll. Anchored to the lower
 * right of the viewport: towers rise from the ground floor-by-floor keyed to
 * overall page-scroll progress, a tower crane hoists a load beside them, hard-
 * hatted workers appear on the ground, and the finished floors light up with
 * tiny people working at the windows.
 *
 * Growth/appearance is driven by the page-scroll fraction (0..1) via the shared
 * ScrollFX hook; the small idle motions (crane bob, hammering arm, window
 * people) are CSS keyframes that pause under prefers-reduced-motion.
 *
 * Decorative only: pointer-events-none, low opacity, behind page content, and
 * hidden on narrow viewports where there is no spare gutter.
 */

import { useScrollFraction } from "@/components/ScrollFX";

const VB_W = 200;
const GROUND = 422;
// Trim the canvas just below the ground line so the base of the scene sits flush
// with the bottom of the viewport (the rail is anchored bottom via justify-end).
const VB_H = GROUND + 4;
// Crop the dead space above the crane so the scene's vertical scope tracks the
// height of the towers rather than floating in an empty canvas.
const VB_TOP = 40;

type Bldg = { x: number; w: number; h: number; cols: number; start: number; end: number };
/** Three towers; each carries the scroll window (0..1) over which it grows. */
const BLDGS: Bldg[] = [
  { x: 22, w: 44, h: 198, cols: 2, start: 0.06, end: 0.46 },
  { x: 74, w: 52, h: 332, cols: 2, start: 0.14, end: 0.72 }, // tallest, center
  { x: 134, w: 38, h: 248, cols: 2, start: 0.22, end: 0.56 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Eased 0..1 sub-progress of p across [start, end] (smoothstep). */
function seg(p: number, start: number, end: number): number {
  const t = clamp01((p - start) / (end - start));
  return t * t * (3 - 2 * t);
}

type Cell = { x: number; y: number; person: boolean };
/** Window grid for a tower; about half the windows get a working figure. */
function windowsFor(b: Bldg): Cell[] {
  const cells: Cell[] = [];
  const colGap = b.w / (b.cols + 1);
  const top = GROUND - b.h + 16;
  let row = 0;
  for (let y = top; y < GROUND - 18; y += 22) {
    for (let ci = 0; ci < b.cols; ci++) {
      cells.push({ x: b.x + colGap * (ci + 1) - 5, y, person: (row + ci) % 2 === 0 });
    }
    row++;
  }
  return cells;
}

/** A small hard-hatted worker standing on the ground at x; optionally hammering.
 *  `flip` mirrors the figure horizontally so it faces left (toward the towers). */
function Worker({ x, hammer, flip }: { x: number; hammer?: boolean; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${GROUND - 20})${flip ? " scale(-1 1) translate(-14 0)" : ""}`}>
      {/* legs */}
      <line x1={3.6} y1={13} x2={2.4} y2={19} stroke="var(--ink-soft)" strokeWidth={1.8} strokeLinecap="round" />
      <line x1={5.4} y1={13} x2={6.6} y2={19} stroke="var(--ink-soft)" strokeWidth={1.8} strokeLinecap="round" />
      {/* torso */}
      <rect x={2.9} y={6.2} width={3.4} height={7.4} rx={1.6} fill="var(--ink-soft)" />
      {/* head */}
      <circle cx={4.6} cy={4.1} r={2.1} fill="var(--ink-soft)" />
      {/* hard hat: dome + brim */}
      <path d="M1.9 3.5 A2.7 2.7 0 0 1 7.3 3.5 Z" fill="var(--gold-deep)" />
      <line x1={1.4} y1={3.6} x2={7.8} y2={3.6} stroke="var(--gold-deep)" strokeWidth={1.2} strokeLinecap="round" />
      {/* back arm resting at the side */}
      <line x1={3.4} y1={7.2} x2={1.7} y2={10.8} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
      {/* front arm, swings to hammer when flagged */}
      <g className={hammer ? "cc-worker-arm" : undefined}>
        <line x1={5.7} y1={7} x2={9.2} y2={8.8} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={9.2} y1={8.8} x2={10.9} y2={5.8} stroke="var(--ink-soft)" strokeWidth={1.4} strokeLinecap="round" />
        <rect x={9.9} y={4.8} width={3} height={2} rx={0.4} fill="var(--ink-soft)" />
      </g>
    </g>
  );
}

export function ScrollSkylineRail() {
  const f = useScrollFraction();
  const craneOpacity = seg(f, 0.03, 0.22);
  const workerOpacity = seg(f, 0.1, 0.32);
  const windowsOpacity = seg(f, 0.5, 0.9);

  return (
    <div
      className="hidden md:flex fixed top-0 right-0 h-screen flex-col justify-end pointer-events-none"
      style={{ width: "clamp(110px, 12vw, 190px)", opacity: 0.55, zIndex: -1 }}
      aria-hidden
    >
      <svg
        viewBox={`0 ${VB_TOP} ${VB_W} ${VB_H - VB_TOP}`}
        width="100%"
        height="auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cc-rail-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--gold-bright)" }} />
            <stop offset="1" style={{ stopColor: "var(--gold-deep)" }} />
          </linearGradient>
        </defs>

        {/* towers grow up from the ground as you scroll */}
        {BLDGS.map((b) => (
          <rect
            key={b.x}
            className="cc-rail-tower"
            x={b.x}
            y={GROUND - b.h}
            width={b.w}
            height={b.h}
            rx={3}
            fill="url(#cc-rail-grad)"
            style={{ transform: `scaleY(${seg(f, b.start, b.end)})` }}
          />
        ))}

        {/* finished floors light up, with tiny people working at the windows */}
        <g style={{ opacity: windowsOpacity }}>
          {BLDGS.flatMap((b) =>
            windowsFor(b).map((c, i) => (
              <g key={`${c.x}-${c.y}`}>
                <rect x={c.x} y={c.y} width={10} height={13} rx={1} fill="#fff" fillOpacity={0.92} />
                {c.person && (
                  <g className="cc-window-person" style={{ animationDelay: `${(i % 5) * 0.3}s` }}>
                    <path d={`M${c.x + 2} ${c.y + 12.5} Q${c.x + 5} ${c.y + 6.5} ${c.x + 8} ${c.y + 12.5} Z`} fill="var(--ink-soft)" />
                    <circle cx={c.x + 5} cy={c.y + 5} r={1.7} fill="var(--ink)" />
                  </g>
                )}
              </g>
            )),
          )}
        </g>

        {/* tower crane: mast on clear ground to the right of the towers, jib
            reaching back over them, trolley hoisting a load (drawn after the
            towers so the load reads in front of them, never hidden behind) */}
        <g style={{ opacity: craneOpacity }}>
          <rect x={185} y={60} width={5} height={GROUND - 60} fill="var(--ink-soft)" />
          <rect x={183} y={GROUND - 4} width={9} height={5} rx={1} fill="var(--line-strong)" />
          <rect x={54} y={60} width={137} height={4} rx={1} fill="var(--ink-soft)" />
          <rect x={183} y={56} width={11} height={11} rx={1.5} fill="var(--ink-soft)" />
          <path d={`M187.5 50 L187.5 60 M183 62 L192 50`} stroke="var(--ink-soft)" strokeWidth={1.4} fill="none" />
          {/* trolley rides along the jib, hoisting a load up and down the cable */}
          <g className="cc-crane-trolley">
            <rect x={91} y={57} width={10} height={6} rx={1} fill="var(--ink-soft)" />
            <line className="cc-crane-cable" x1={96} y1={62} x2={96} y2={120} stroke="var(--ink-soft)" strokeWidth={1.2} />
            <g className="cc-crane-hoist">
              <line x1={96} y1={103} x2={96} y2={106} stroke="var(--ink-soft)" strokeWidth={1.4} />
              <rect x={89} y={106} width={14} height={11} rx={1.5} fill="url(#cc-rail-grad)" />
            </g>
          </g>
        </g>

        {/* hard-hatted workers on the ground, one at the foot of each end tower */}
        <g style={{ opacity: workerOpacity }}>
          <Worker x={9} hammer />
          <Worker x={174} hammer flip />
        </g>

        {/* the ground the scene stands on */}
        <rect x={6} y={GROUND} width={VB_W - 12} height={3} rx={1.5} fill="var(--line-strong)" />
      </svg>
    </div>
  );
}

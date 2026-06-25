/**
 * Animated hero for the hub landing: a skyline that builds itself, windows
 * that flicker on, a swinging construction crane, and a rising trend line.
 * Pure CSS animation (keyframes in globals.css) — respects reduced-motion.
 */

type Tower = { x: number; w: number; top: number; delay: number };

const BASE = 300;
const TOWERS: Tower[] = [
  { x: 34, w: 46, top: 206, delay: 0 },
  { x: 90, w: 54, top: 150, delay: 0.12 },
  { x: 154, w: 50, top: 112, delay: 0.24 },
  { x: 214, w: 60, top: 66, delay: 0.36 },
  { x: 284, w: 46, top: 174, delay: 0.48 },
];

function Windows({ t }: { t: Tower }) {
  const cols = t.w > 50 ? 3 : 2;
  const colGap = t.w / (cols + 1);
  const rows: number[] = [];
  for (let y = t.top + 16; y < BASE - 12; y += 22) rows.push(y);
  const cells: { x: number; y: number; d: number }[] = [];
  rows.forEach((y, ri) =>
    Array.from({ length: cols }).forEach((_, ci) => {
      cells.push({ x: t.x + colGap * (ci + 1) - 4, y, d: (ri + ci) * 0.4 + t.delay });
    }),
  );
  return (
    <>
      {cells.map((c, i) => (
        <rect
          key={i}
          className="cc-hero-lite"
          x={c.x}
          y={c.y}
          width={8}
          height={9}
          rx={1}
          fill="#fff"
          style={{ animationDelay: `${1.1 + c.d}s` }}
        />
      ))}
    </>
  );
}

export function HubHero() {
  return (
    <svg viewBox="0 0 420 340" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="An animated city skyline under construction">
      <defs>
        <linearGradient id="hh-tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--gold-bright)" }} />
          <stop offset="1" style={{ stopColor: "var(--gold-deep)" }} />
        </linearGradient>
        <linearGradient id="hh-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--gold)", stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: "var(--gold)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* soft glow behind the skyline */}
      <rect x="0" y="40" width="420" height="262" fill="url(#hh-glow)" rx="20" />

      {/* towers + windows */}
      {TOWERS.map((t) => (
        <g key={t.x}>
          <rect
            className="cc-hero-build"
            x={t.x}
            y={t.top}
            width={t.w}
            height={BASE - t.top}
            rx={3}
            fill="url(#hh-tower)"
            style={{ animationDelay: `${t.delay}s` }}
          />
          <Windows t={t} />
        </g>
      ))}

      {/* construction crane over the tallest tower */}
      <g className="cc-hero-crane">
        <rect x="343" y="70" width="6" height="230" rx="2" fill="var(--ink-soft)" />
        <rect x="300" y="64" width="110" height="6" rx="3" fill="var(--ink-soft)" />
        <rect x="338" y="52" width="16" height="14" rx="2" fill="var(--ink-soft)" />
        <line x1="392" y1="70" x2="392" y2="70" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <g className="cc-hero-hook">
          <line x1="392" y1="70" x2="392" y2="110" stroke="var(--ink-soft)" strokeWidth="1.5" />
          <rect x="386" y="110" width="12" height="9" rx="1.5" fill="var(--gold)" />
        </g>
      </g>

      {/* rising trend line over the skyline */}
      <path
        className="cc-hero-trend"
        d="M30 232 L96 176 L160 134 L228 88 L300 120"
        fill="none"
        stroke="var(--gold-deep)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="cc-hero-node" cx="300" cy="120" r="6" fill="var(--gold-deep)" />

      {/* ground line */}
      <rect x="0" y={BASE} width="420" height="3" rx="1.5" fill="var(--line-strong)" />
    </svg>
  );
}

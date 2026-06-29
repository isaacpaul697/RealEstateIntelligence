"use client";

/**
 * Full-screen interstitial that plays a ~1s "building being built" animation
 * before navigating. Floors rise from the ground floor-by-floor, windows light
 * up, and a crane tops it out. Used by the hub when launching into a workspace.
 *
 * Mounts only while active so the CSS keyframes replay fresh on every launch.
 * Respects prefers-reduced-motion at the call site (navigation skips straight
 * through), so this component is purely the visual.
 */

const FLOORS = [
  { y: 92, delay: 0.0 },
  { y: 76, delay: 0.12 },
  { y: 60, delay: 0.24 },
  { y: 44, delay: 0.36 },
  { y: 28, delay: 0.48 },
];

const FLOOR_W = 56;
const FLOOR_H = 15;
const FLOOR_X = 32;

export function BuildOverlay({ show, label = "Building your workspace" }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cc-build-overlay"
      style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)", backdropFilter: "blur(6px)" }}
      aria-live="polite"
      role="status"
    >
      <svg viewBox="0 0 140 120" width={180} height={154} xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="cc-build-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--gold-bright)" }} />
            <stop offset="1" style={{ stopColor: "var(--gold-deep)" }} />
          </linearGradient>
        </defs>

        {/* crane mast + jib that hoists the topping-out block */}
        <g stroke="var(--ink-soft)" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.8}>
          <path d="M104 16 V104" />
          <path d="M104 16 H58" />
          <path className="cc-build-hook" d="M70 16 V30" strokeWidth={1.5} />
        </g>
        <rect className="cc-build-hook" x={64} y={30} width={12} height={9} rx={1.5} fill="url(#cc-build-grad)" />

        {/* floors rise from the ground, one after another */}
        {FLOORS.map((f) => (
          <g key={f.y} className="cc-build-floor" style={{ animationDelay: `${f.delay}s` }}>
            <rect x={FLOOR_X} y={f.y} width={FLOOR_W} height={FLOOR_H} rx={2} fill="url(#cc-build-grad)" />
            <rect className="cc-build-win" x={FLOOR_X + 8} y={f.y + 4} width={7} height={7} rx={1} fill="#fff" fillOpacity={0.9} style={{ animationDelay: `${f.delay + 0.5}s` }} />
            <rect className="cc-build-win" x={FLOOR_X + 24} y={f.y + 4} width={7} height={7} rx={1} fill="#fff" fillOpacity={0.9} style={{ animationDelay: `${f.delay + 0.55}s` }} />
            <rect className="cc-build-win" x={FLOOR_X + 40} y={f.y + 4} width={7} height={7} rx={1} fill="#fff" fillOpacity={0.9} style={{ animationDelay: `${f.delay + 0.6}s` }} />
          </g>
        ))}

        {/* the ground the tower stands on */}
        <rect x={18} y={107} width={104} height={3} rx={1.5} fill="var(--line-strong)" />
      </svg>

      <div className="font-display text-[15px] font-semibold text-ink mt-1">{label}</div>
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-deep cc-build-dot" style={{ animationDelay: "0s" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-deep cc-build-dot" style={{ animationDelay: "0.15s" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-deep cc-build-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}

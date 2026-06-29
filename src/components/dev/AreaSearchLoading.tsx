/**
 * Loading scene shown while an area search sweeps OpenStreetMap. A radar rotates
 * over a map grid and lights up building-site pins one by one, echoing the
 * empty-state hero so the wait reads as "scanning the map". Pure CSS animation
 * (keyframes in globals.css); respects reduced-motion.
 */

const CX = 160;
const CY = 130;

type Pin = { x: number; y: number; delay: number };
const PINS: Pin[] = [
  { x: 92, y: 78, delay: 0 },
  { x: 226, y: 92, delay: 0.5 },
  { x: 118, y: 178, delay: 1.0 },
  { x: 236, y: 168, delay: 1.5 },
  { x: 70, y: 150, delay: 2.0 },
  { x: 196, y: 60, delay: 2.5 },
];

export function AreaSearchLoading({ label = "Sweeping OpenStreetMap for developments" }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <svg
        viewBox="0 0 320 260"
        width={300}
        height={244}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="A radar sweeping a map grid for building sites"
      >
        <defs>
          <radialGradient id="al-glow" cx="50%" cy="50%" r="52%">
            <stop offset="0" style={{ stopColor: "var(--gold)", stopOpacity: 0.18 }} />
            <stop offset="1" style={{ stopColor: "var(--gold)", stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id="al-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "var(--gold)", stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: "var(--gold)", stopOpacity: 0.45 }} />
          </linearGradient>
        </defs>

        {/* map grid */}
        <g stroke="var(--line-strong)" strokeWidth="1" opacity="0.4">
          {[40, 80, 120, 160, 200, 240, 280].map((x) => (
            <line key={`v${x}`} x1={x} y1="22" x2={x} y2="238" />
          ))}
          {[50, 90, 130, 170, 210].map((y) => (
            <line key={`h${y}`} x1="28" y1={y} x2="292" y2={y} />
          ))}
        </g>

        <rect x="0" y="0" width="320" height="260" fill="url(#al-glow)" />

        {/* range rings */}
        {[40, 80, 118].map((r) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="var(--gold)" strokeOpacity="0.18" />
        ))}

        {/* expanding ping */}
        <circle className="cc-radar-ping" cx={CX} cy={CY} r="40" fill="none" stroke="var(--gold)" strokeWidth="2" />

        {/* rotating sweep wedge + leading edge */}
        <g className="cc-radar-sweep" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <path d={`M${CX} ${CY} L${CX + 118} ${CY - 44} A126 126 0 0 1 ${CX + 118} ${CY + 44} Z`} fill="url(#al-sweep)" />
          <line x1={CX} y1={CY} x2={CX + 126} y2={CY} stroke="var(--gold)" strokeWidth="2" />
        </g>

        {/* building-site pins the radar discovers */}
        {PINS.map((p) => (
          <g key={`${p.x}-${p.y}`} className="cc-radar-pin" style={{ animationDelay: `${p.delay}s` }}>
            <circle cx={p.x} cy={p.y} r="9" fill="none" stroke="var(--gold)" strokeOpacity="0.4" />
            <circle cx={p.x} cy={p.y} r="4.5" fill="var(--gold-deep)" />
          </g>
        ))}

        <circle cx={CX} cy={CY} r="4" fill="var(--ink)" />
      </svg>

      <div className="font-display text-[17px] font-semibold text-ink mt-4">{label}</div>
      <p className="text-[13px] text-muted mt-1.5 max-w-sm">
        Reading building footprints and modeling each site. This can take a few seconds for larger areas.
      </p>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-deep cc-build-dot" style={{ animationDelay: "0s" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-deep cc-build-dot" style={{ animationDelay: "0.15s" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-deep cc-build-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}

import type { ScoreFactor } from "@/lib/types";

const toneHex: Record<string, string> = {
  vivid: "var(--c-vivid)",
  good: "var(--c-good)",
  warn: "var(--c-warn)",
  risk: "var(--c-risk)",
  bad: "var(--c-bad)",
  info: "var(--c-info)",
  orangeLight: "var(--c-orange-light)",
  orange: "var(--c-orange)",
  redBright: "var(--c-red-bright)",
  gold: "var(--gold)",
};

export function scoreTone(score: number) {
  if (score >= 80) return "vivid"; // bright green
  if (score >= 70) return "good"; // dark green
  if (score >= 65) return "info"; // blue
  if (score >= 60) return "orangeLight"; // light orange
  if (score >= 50) return "orange"; // darker orange
  return "redBright"; // bright red
}

export function ScoreRing({ score, size = 132, label }: { score: number; size?: number; label?: string }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = toneHex[scoreTone(score)];
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[28px] font-bold text-ink num leading-none">{score}</div>
        <div className="text-[10px] text-muted mt-1 uppercase tracking-wide">{label ?? "Score"}</div>
      </div>
    </div>
  );
}

export function FactorBars({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {factors.map((f) => (
        <div key={f.key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-ink-soft">
              {f.label}
              <span className="text-muted-2 ml-1.5">· {(f.weight * 100).toFixed(0)}%</span>
            </span>
            <span className="text-ink num font-medium">{Math.round(f.value)}</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${f.value}%`, background: toneHex[scoreTone(f.value)] }}
            />
          </div>
          <div className="text-[10.5px] text-muted mt-0.5">{f.detail}</div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  values,
  width = 160,
  height = 42,
  color = "var(--chart-1)",
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - 3 - ((v - min) / span) * (height - 6);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill={color} />
    </svg>
  );
}

export function Donut({
  segments,
  size = 132,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export function BarList({
  items,
  format = (n: number) => String(n),
}: {
  items: { label: string; value: number; color?: string }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value)) || 1;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-ink-soft w-32 truncate">{it.label}</span>
          <div className="flex-1 h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(it.value / max) * 100}%`, background: it.color ?? "var(--chart-1)" }}
            />
          </div>
          <span className="text-xs text-ink num w-16 text-right">{format(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Meter({ value, max, color = "var(--chart-3)" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  );
}

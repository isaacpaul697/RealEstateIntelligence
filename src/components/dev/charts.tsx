import type { PropertyType } from "@/lib/dev/types";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/dev/types";

/** Simple vertical bars for a yearly time series. Pure SVG, server-safe. */
export function TrendBars({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 22);
        return (
          <g key={i}>
            <rect
              x={i * bw + bw * 0.18}
              y={height - 16 - h}
              width={bw * 0.64}
              height={h}
              rx={1.5}
              fill="var(--chart-1)"
              opacity={i === data.length - 1 ? 1 : 0.55}
            />
            <text x={i * bw + bw / 2} y={height - 4} fontSize={5} textAnchor="middle" fill="var(--muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal share bars for a type breakdown. */
export function TypeBars({
  counts,
  total,
}: {
  counts: Record<PropertyType, number>;
  total: number;
}) {
  const entries = (Object.entries(counts) as [PropertyType, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const denom = total || 1;
  return (
    <div className="flex flex-col gap-2">
      {entries.map(([t, v]) => (
        <div key={t} className="flex items-center gap-2.5">
          <span className="w-24 text-xs text-ink-soft shrink-0">{TYPE_LABEL[t]}</span>
          <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(v / denom) * 100}%`, background: TYPE_COLOR[t] }} />
          </div>
          <span className="w-12 text-right text-xs num text-muted">{Math.round((v / denom) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

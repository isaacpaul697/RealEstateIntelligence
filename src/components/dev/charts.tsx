import type { PropertyType } from "@/lib/dev/types";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/dev/types";

function compactUnits(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return `${Math.round(n)}`;
}

/**
 * Vertical bars for a yearly time series. Real flex layout (not a stretched
 * SVG), so labels stay crisp: value on top of each bar, year underneath,
 * latest year highlighted.
 */
export function TrendBars({
  data,
  height = 132,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barArea = height - 18; // leave room for the value label above each bar
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const last = i === data.length - 1;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={`${d.label}: ${Math.round(d.value).toLocaleString("en-US")} units authorized`}
            >
              <span className={`text-[10px] num leading-none mb-1 ${last ? "text-ink font-semibold" : "text-muted-2"}`}>
                {compactUnits(d.value)}
              </span>
              <div
                className="w-full max-w-[26px] rounded-t-[3px] transition-[height]"
                style={{
                  height: Math.max(2, (d.value / max) * barArea),
                  background: "var(--chart-1)",
                  opacity: last ? 1 : 0.5,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5 border-t border-line pt-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] num ${i === data.length - 1 ? "text-ink-soft font-semibold" : "text-muted-2"}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
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

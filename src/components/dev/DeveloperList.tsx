import Link from "next/link";
import type { DeveloperSummary } from "@/lib/dev/aggregate";
import { firmLogo } from "@/lib/dev/live/wikipedia";
import { FirmLogo, TypePill } from "./ui";
import { fmtCompactUSD } from "@/lib/dev/format";

export function DeveloperList({ city, developers }: { city: string; developers: DeveloperSummary[] }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2">
      {developers.map((d, i) => (
        <Link
          key={d.slug}
          href={`/development/developer/${city}/${d.slug}`}
          className="flex items-center gap-3 bg-surface border border-line rounded-[var(--radius-card)] p-4 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
        >
          <span className="text-sm font-semibold text-muted-2 w-5 num">{i + 1}</span>
          <FirmLogo src={firmLogo(d.name)} name={d.name} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-semibold text-ink truncate">{d.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <TypePill type={d.topType} dot={false} />
              <span className="text-xs text-muted num">{d.count} projects</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-[15px] font-semibold text-ink num">{fmtCompactUSD(d.totalValue)}</div>
            <div className="text-[10px] text-muted-2 uppercase tracking-wide">est. portfolio</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

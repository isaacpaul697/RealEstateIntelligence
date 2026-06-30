"use client";

import { Card, Logo } from "@/components/ui";
import { fmtNum } from "@/lib/scoring";

/**
 * Live school-logo graphic for the student-housing market detail page. The
 * institution's real logo (fetched live, with an abbreviation fallback) sits
 * inside an animated brand-colored ring that traces itself in via the shared
 * cc-draw stroke animation, ringed by a pulsing live indicator. Beneath it,
 * two live figures (enrollment and recent housing headlines) anchor the badge
 * to real data. Purely presentational; every value is computed upstream.
 */
export function SchoolLogoGraphic({
  logo,
  abbr,
  shortName,
  color,
  conference,
  enrollment,
  newsCount,
}: {
  logo: string | null;
  abbr: string;
  shortName: string;
  color: string;
  conference: string;
  enrollment: number | null;
  newsCount: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted">Institution</div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-good" />
          </span>
          Live logo
        </span>
      </div>

      <div className="grid place-items-center mt-2 mb-1">
        <div className="relative grid place-items-center" style={{ width: 132, height: 132 }}>
          {/* brand-colored ring that traces itself in */}
          <svg
            viewBox="0 0 120 120"
            className="absolute inset-0"
            width={132}
            height={132}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <circle cx={60} cy={60} r={56} fill="none" stroke="var(--line)" strokeWidth={2} />
            <circle
              className="cc-draw"
              cx={60}
              cy={60}
              r={56}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              pathLength={1}
              transform="rotate(-90 60 60)"
            />
          </svg>
          {/* soft brand halo behind the mark */}
          <span
            className="absolute rounded-full"
            style={{
              width: 92,
              height: 92,
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
            }}
          />
          <div className="relative cc-draw-fade">
            <Logo src={logo} abbr={abbr} color={color} size={76} />
          </div>
        </div>
      </div>

      <div className="text-center text-[13px] font-semibold text-ink leading-tight">{shortName}</div>
      <div className="text-center text-[11px] text-muted mt-0.5">{conference}</div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-[var(--radius-card)] bg-surface-2 border border-line px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">Enrollment</div>
          <div className="text-[14px] font-semibold mt-0.5 num">{enrollment != null ? fmtNum(enrollment) : "n/a"}</div>
        </div>
        <div className="rounded-[var(--radius-card)] bg-surface-2 border border-line px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-2">Headlines</div>
          <div className="text-[14px] font-semibold mt-0.5 num" style={{ color }}>{newsCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-2.5 text-[11px] text-muted leading-snug">
        Logo fetched live; enrollment from College Scorecard, headline count from live Google News.
      </div>
    </Card>
  );
}

export default SchoolLogoGraphic;

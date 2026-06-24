"use client";

import dynamic from "next/dynamic";
import type { ScoredMarket } from "@/lib/compute";

const Inner = dynamic(() => import("./CampusMapInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 grid place-items-center" style={{ height: 560 }}>
      <span className="text-sm text-muted">Loading map…</span>
    </div>
  ),
});

export function CampusMap(props: {
  markets: ScoredMarket[];
  initialSelected?: string;
  height?: number;
}) {
  return <Inner {...props} />;
}

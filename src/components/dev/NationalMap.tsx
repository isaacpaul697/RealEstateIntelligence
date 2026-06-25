"use client";

import dynamic from "next/dynamic";
import type { BpsStateRow } from "@/lib/dev/types";

const Inner = dynamic(() => import("./NationalMapInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 grid place-items-center" style={{ height: 460 }}>
      <span className="text-sm text-muted">Loading map…</span>
    </div>
  ),
});

export function NationalMap({ states, height }: { states: BpsStateRow[]; height?: number }) {
  return <Inner states={states} height={height} />;
}

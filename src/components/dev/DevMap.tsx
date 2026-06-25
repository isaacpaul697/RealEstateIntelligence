"use client";

import dynamic from "next/dynamic";
import type { DevView } from "@/lib/dev/view";

const Inner = dynamic(() => import("./DevMapInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 grid place-items-center" style={{ height: 520 }}>
      <span className="text-sm text-muted">Loading map…</span>
    </div>
  ),
});

export function DevMap(props: {
  devs: DevView[];
  center: [number, number];
  zoom: number;
  scan?: { lat: number; lng: number; radius: number } | null;
  cityLabel?: string;
  height?: number;
}) {
  return <Inner {...props} />;
}

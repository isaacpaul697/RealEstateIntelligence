"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DevView } from "@/lib/dev/view";
import { PROPERTY_TYPES, TYPE_COLOR, TYPE_LABEL } from "@/lib/dev/types";
import type { PropertyType } from "@/lib/dev/types";
import { DevMap } from "./DevMap";
import { TypePill, ProvenanceTag, Card } from "./ui";
import { fmtCompactUSD, fmtDate } from "@/lib/dev/format";

const DATE_PRESETS = [
  { id: "all", label: "All time", months: 0 },
  { id: "12", label: "Last 12 mo", months: 12 },
  { id: "24", label: "Last 24 mo", months: 24 },
  { id: "60", label: "Last 5 yr", months: 60 },
] as const;

const VALUE_PRESETS = [
  { id: "0", label: "Any value", min: 0 },
  { id: "1", label: "$1M+", min: 1_000_000 },
  { id: "5", label: "$5M+", min: 5_000_000 },
  { id: "20", label: "$20M+", min: 20_000_000 },
] as const;

export function CityExplorer({
  devs,
  center,
  zoom,
  cityLabel,
}: {
  devs: DevView[];
  center: [number, number];
  zoom: number;
  cityLabel?: string;
}) {
  const [active, setActive] = useState<Set<PropertyType>>(new Set(PROPERTY_TYPES));
  const [datePreset, setDatePreset] = useState<string>("all");
  const [valuePreset, setValuePreset] = useState<string>("0");

  const filtered = useMemo(() => {
    const months = DATE_PRESETS.find((p) => p.id === datePreset)?.months ?? 0;
    const minVal = VALUE_PRESETS.find((p) => p.id === valuePreset)?.min ?? 0;
    const cutoff = months ? Date.now() - months * 30.44 * 86_400_000 : 0;
    return devs.filter((d) => {
      if (!active.has(d.type)) return false;
      if (minVal && (d.cost.value == null || d.cost.value < minVal)) return false;
      if (cutoff && (!d.issueDate || Date.parse(d.issueDate) < cutoff)) return false;
      return true;
    });
  }, [devs, active, datePreset, valuePreset]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (b.cost.value ?? 0) - (a.cost.value ?? 0)),
    [filtered],
  );

  // The shaded "scanned area" circle — centered on the city, sized to enclose
  // ~92% of the developments (a percentile so a lone far-flung permit doesn't
  // balloon it). Computed from the full set so it stays fixed as filters change.
  const scan = useMemo(() => {
    const dists = devs
      .map((d) => haversineM(center[0], center[1], d.lat, d.lng))
      .sort((a, b) => a - b);
    if (!dists.length) return null;
    const p = dists[Math.floor(dists.length * 0.92)] ?? dists[dists.length - 1];
    return { lat: center[0], lng: center[1], radius: Math.max(1200, Math.round(p)) };
  }, [devs, center]);

  function toggle(t: PropertyType) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next.size === 0 ? new Set(PROPERTY_TYPES) : next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((t) => {
            const on = active.has(t);
            return (
              <button
                key={t}
                onClick={() => toggle(t)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                style={{
                  borderColor: on ? TYPE_COLOR[t] : "var(--line)",
                  background: on ? `${TYPE_COLOR[t]}1f` : "transparent",
                  color: on ? TYPE_COLOR[t] : "var(--muted)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                {TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4">
          <PresetRow label="Issued" presets={DATE_PRESETS} value={datePreset} onChange={setDatePreset} />
          <PresetRow label="Est. value" presets={VALUE_PRESETS} value={valuePreset} onChange={setValuePreset} />
          <span className="ml-auto text-xs text-muted self-center num">
            {filtered.length.toLocaleString()} of {devs.length.toLocaleString()} developments
          </span>
        </div>
      </Card>

      <DevMap devs={filtered} center={center} zoom={zoom} scan={scan} cityLabel={cityLabel} />

      {/* Results list */}
      <div className="grid gap-2.5 md:grid-cols-2">
        {sorted.slice(0, 60).map((d) => (
          <Link
            key={d.id}
            href={`/development/project/${d.token}`}
            className="block bg-surface border border-line rounded-[var(--radius-card)] p-4 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <TypePill type={d.type} />
              <ProvenanceTag p={d.cost.provenance} note={d.cost.note} />
            </div>
            <div className="font-display text-[15px] font-semibold text-ink mt-2 leading-snug">{d.address}</div>
            <div className="text-xs text-muted mt-0.5 line-clamp-1">{d.description || d.rawType}</div>
            <div className="flex items-center justify-between mt-2.5">
              <span className="font-display text-[17px] font-semibold text-ink num">{fmtCompactUSD(d.cost.value)}</span>
              <span className="text-xs text-muted num">{fmtDate(d.issueDate)}</span>
            </div>
            {d.developer && <div className="text-[11px] text-muted-2 mt-1 truncate">{d.developer}</div>}
          </Link>
        ))}
      </div>
      {sorted.length > 60 && (
        <p className="text-center text-xs text-muted">Showing the 60 highest-value developments of {sorted.length.toLocaleString()} matching.</p>
      )}
    </div>
  );
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function PresetRow<T extends { id: string; label: string }>({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: readonly T[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-2 font-semibold">{label}</span>
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              value === p.id ? "bg-gold-soft text-gold-deep border-gold" : "border-line text-muted hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

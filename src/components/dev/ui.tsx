"use client";

import Link from "next/link";
import { useState } from "react";
import type { Provenance, PropertyType } from "@/lib/dev/types";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/dev/types";

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={`bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow)] ${pad ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  sub,
  right,
}: {
  children: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4 gap-3">
      <div>
        <h2 className="font-display text-[19px] font-semibold text-ink tracking-tight leading-tight">{children}</h2>
        {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Provenance: live = pulled from a source, estimated = modeled from live inputs. */
export function ProvenanceTag({ p, note }: { p: Provenance; note?: string }) {
  const live = p === "live";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
        live ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
      }`}
      title={note ?? (live ? "Pulled live from an external source" : "Modeled from live inputs")}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-good" : "bg-warn"}`} />
      {p}
    </span>
  );
}

export function TypePill({ type, dot = true }: { type: PropertyType; dot?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: `${TYPE_COLOR[type]}1f`, color: TYPE_COLOR[type] }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLOR[type] }} />}
      {TYPE_LABEL[type]}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  provenance,
}: {
  label: string;
  value: string;
  sub?: string;
  provenance?: Provenance;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-muted flex items-center gap-2">
        {label}
        {provenance && <ProvenanceTag p={provenance} />}
      </span>
      <span className="font-display text-[26px] font-semibold text-ink num leading-none">{value}</span>
      {sub && <span className="text-xs text-muted num">{sub}</span>}
    </Card>
  );
}

export function StateBlock({ title, note }: { title: string; note?: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="font-display text-lg text-ink">{title}</div>
      {note && <div className="text-sm text-muted mt-1.5 max-w-md mx-auto">{note}</div>}
    </Card>
  );
}

export function Spinner({ label = "Loading live data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="w-4 h-4 rounded-full border-2 border-line-strong border-t-gold animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Domain-logo disc with graceful fallback to a neutral building glyph. */
export function FirmLogo({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = name.replace(/[^a-zA-Z ]/g, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const ok = src && !err;
  return (
    <span
      className="inline-grid place-items-center rounded-full shrink-0 overflow-hidden border border-line"
      style={{ width: size, height: size, background: ok ? "#fff" : "var(--surface-2)" }}
    >
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt="" width={size * 0.6} height={size * 0.6} style={{ objectFit: "contain" }} onError={() => setErr(true)} />
      ) : (
        <span className="font-semibold text-muted" style={{ fontSize: size * 0.3 }}>{initials || "·"}</span>
      )}
    </span>
  );
}

export { Link };

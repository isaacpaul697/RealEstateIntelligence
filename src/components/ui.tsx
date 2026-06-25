"use client";

import Link from "next/link";
import { useState } from "react";
import type { OpportunityLabel, Provenance } from "@/lib/types";
import { LABEL_TONE } from "@/lib/scoring";

export type Tone =
  | "vivid"
  | "good"
  | "warn"
  | "risk"
  | "bad"
  | "info"
  | "orangeLight"
  | "orange"
  | "redBright"
  | "gold";

const toneClass: Record<Tone, string> = {
  vivid: "bg-vivid-soft text-vivid",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  risk: "bg-risk-soft text-risk",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  orangeLight: "bg-orange-light-soft text-orange-light",
  orange: "bg-orange-soft text-orange",
  redBright: "bg-red-bright-soft text-red-bright",
  gold: "bg-gold-soft text-gold-deep",
};

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
        <h2 className="font-display text-[18px] font-semibold text-ink tracking-tight leading-tight">{children}</h2>
        {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

export function LabelChip({ label }: { label: OpportunityLabel }) {
  return <Chip tone={LABEL_TONE[label] as Tone}>{label}</Chip>;
}

/** Provenance: live = pulled from an external source, estimated = modeled from live inputs. */
export function ProvenanceTag({ p }: { p: Provenance }) {
  const live = p === "live";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
        live ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
      }`}
      title={live ? "Pulled live from an external source" : "Modeled from live inputs; no free real-time feed exists"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-good" : "bg-warn"}`} />
      {p}
    </span>
  );
}

export function Stat({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-display text-[26px] font-semibold text-ink num leading-none">{value}</span>
      {delta && (
        <span className={`text-xs font-medium num ${tone ? toneClass[tone].split(" ")[1] : "text-muted"}`}>
          {delta}
        </span>
      )}
    </Card>
  );
}

/** Real university logo on a white disc, with brand-color monogram fallback. */
export function Logo({
  src,
  abbr,
  color,
  size = 44,
  ring = "var(--surface)",
}: {
  src?: string | null;
  abbr: string;
  color: string;
  size?: number;
  ring?: string;
}) {
  const [err, setErr] = useState(false);
  const ok = src && !err;
  return (
    <span
      className="inline-grid place-items-center rounded-full shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: ok ? "#fff" : color,
        boxShadow: `0 0 0 2px ${ring}, var(--shadow)`,
      }}
    >
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={`${abbr} logo`}
          width={size * 0.82}
          height={size * 0.82}
          style={{ objectFit: "contain" }}
          onError={() => setErr(true)}
        />
      ) : (
        <span className="font-bold text-white" style={{ fontSize: size * 0.34, letterSpacing: "-0.02em" }}>
          {abbr}
        </span>
      )}
    </span>
  );
}

export function ToneText({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={toneClass[tone].split(" ")[1]}>{children}</span>;
}

export function CardLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`block hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all ${className}`}>
      {children}
    </Link>
  );
}

/** Lightweight loading / empty / error states. */
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

"use client";

import { useEffect, useRef, useState } from "react";
import { fmtNum, fmtCompactUSD } from "@/lib/dev/format";

/**
 * Named formatters, keyed by a plain string so a server component can hand the
 * choice across the client boundary (functions can't be passed as props).
 */
const FORMATS = {
  num: (n: number) => fmtNum(n),
  compactUsd: (n: number) => fmtCompactUSD(n),
  pct2: (n: number) => `${n.toFixed(2)}%`,
  pct0: (n: number) => `${n.toFixed(0)}%`,
  startsK: (n: number) => `${fmtNum(n)}K`,
} as const;

export type CountFormat = keyof typeof FORMATS;

/**
 * Animates a number from 0 up to `to` when it first scrolls into view, then
 * formats each frame with the named `format`. Pure requestAnimationFrame, no
 * deps. Respects prefers-reduced-motion (jumps straight to the final value) so
 * the count-up is a progressive enhancement, never a barrier to reading it.
 */
export function CountUp({
  to,
  format = "num",
  durationMs = 1100,
  className,
}: {
  to: number;
  format?: CountFormat;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  const fmt = FORMATS[format];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion, or no IntersectionObserver: skip the animation and show
    // the final figure so the number is never stuck at 0.
    if (reduce || typeof IntersectionObserver === "undefined") {
      setVal(to);
      return;
    }

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setVal(to * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setVal(to);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !ran.current) {
            ran.current = true;
            run();
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {fmt(val)}
    </span>
  );
}

/**
 * Count-up for an already-formatted string. Parses the first numeric run in
 * `value` (commas and a decimal part allowed), animates it from 0 to its target
 * on scroll-in, and re-renders each frame preserving the surrounding text
 * (currency prefix, "%", "M", "/mo", " units", etc.) plus the original decimal
 * places and thousands separators. Strings with no number (e.g. "n/a") render
 * unchanged. Respects prefers-reduced-motion. This lets the shared Stat cards on
 * every screen run their numbers up without each call site passing a raw value.
 */
const NUM_RE = /-?\d[\d,]*(?:\.\d+)?/;

export function CountUpText({
  value,
  durationMs = 1100,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  const match = value.match(NUM_RE);
  const numStr = match?.[0] ?? null;
  const target = numStr != null ? Number(numStr.replace(/,/g, "")) : NaN;
  const decimals = numStr && numStr.includes(".") ? numStr.split(".")[1].length : 0;
  const hasThousands = numStr ? numStr.includes(",") : false;
  const prefix = match ? value.slice(0, match.index) : "";
  const suffix = match ? value.slice((match.index ?? 0) + numStr!.length) : "";

  const render = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: hasThousands,
    });

  const [val, setVal] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Nothing numeric to animate (e.g. "n/a"): render the string verbatim.
    if (!el || numStr == null || !Number.isFinite(target)) {
      setDone(true);
      return;
    }

    // Re-arm whenever the value changes: async live data often arrives as "0"
    // first, so a fresh target must be allowed to count up again.
    ran.current = false;
    setDone(false);
    setVal(0);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setVal(target);
      setDone(true);
      return;
    }

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setVal(target * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setDone(true);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !ran.current) {
            ran.current = true;
            run();
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs, numStr, target, decimals, hasThousands, prefix, suffix]);

  // While animating, format the interpolated number; once done, show the exact
  // original string so any nuance in the source formatting is preserved.
  const text = numStr == null || done ? value : prefix + render(val) + suffix;

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

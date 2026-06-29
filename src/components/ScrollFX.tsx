"use client";

/**
 * Small scroll-driven visual effects for the hub landing, computed with a
 * requestAnimationFrame scroll handler (reliable across browsers). Both respect
 * prefers-reduced-motion: the bar simply tracks scroll, the hero stays put.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Hook: fraction (0..1) of the page that has been scrolled. */
export function useScrollFraction(): number {
  const [f, setF] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setF(max > 0 ? clamp01(window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return f;
}

/** Thin bar fixed across the very top that fills as the page scrolls. */
export function ScrollProgressBar() {
  const f = useScrollFraction();
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none" aria-hidden>
      <div
        className="h-full bg-gold-deep origin-left"
        style={{ transform: `scaleX(${f})` }}
      />
    </div>
  );
}

/**
 * Wraps the hero graphic and gives it a parallax drift: it rises, shrinks and
 * fades a little as you scroll past the first screen, for a camera-pull feel.
 */
export function ParallaxHero({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0); // 0..1 over the first ~80vh of scroll

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const span = window.innerHeight * 0.8;
      setT(span > 0 ? clamp01(window.scrollY / span) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="hidden md:block"
      style={{
        transform: `translateY(${-44 * t}px) scale(${1 - 0.045 * t})`,
        opacity: 1 - 0.45 * t,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

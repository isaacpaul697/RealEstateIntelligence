"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { BuildOverlay } from "@/components/BuildTransition";
import { useAboutTransition } from "@/components/AboutTransition";
import { HubHero } from "@/components/HubHero";
import { ScrollSkylineRail } from "@/components/ScrollSkylineRail";
import { ScrollProgressBar, ParallaxHero } from "@/components/ScrollFX";
import { AppBackground } from "@/components/AppBackground";
import { Reveal } from "@/components/Reveal";
import { useSettings } from "@/lib/settings";
import { SECTORS, SECTOR_ORDER, SECTOR_ICON, STUDENT_HOUSING_ICON } from "@/lib/dev/sectorDefs";

type Entry = { href: string; eyebrow: string; title: string; desc: string; color: string };

/** The two primary launch cards: the national monitor and area search. */
const ENTRIES: Entry[] = [
  {
    href: "/national",
    eyebrow: "Development Intelligence",
    title: "National overview",
    desc: "Live permit activity and construction trends across all 50 states from the Census Building Permits Survey, on a clickable national map.",
    color: "#9a7b2e",
  },
  {
    href: "/area",
    eyebrow: "Development Intelligence",
    title: "Area search",
    desc: "Sweep OpenStreetMap building footprints for any US city or area to see what has actually been built on the ground.",
    color: "#9a7b2e",
  },
  {
    href: "/build",
    eyebrow: "Underwriting Lab",
    title: "Build a property",
    desc: "Design your own deal: pick a property type and location, set the basics, and get an instant valuation, income statement, financing, and return model.",
    color: "#9a7b2e",
  },
];

type AssetLink = { href: string; label: string; color: string; icon: string };

/** Every asset-class workspace, surfaced as a quick launcher row. */
const ASSET_CLASSES: AssetLink[] = [
  { href: "/student-housing", label: "Student housing", color: "#9a7b2e", icon: STUDENT_HOUSING_ICON },
  ...SECTOR_ORDER.map((slug): AssetLink => ({
    href: `/sector/${slug}`,
    label: SECTORS[slug].label,
    color: SECTORS[slug].color,
    icon: SECTOR_ICON[slug],
  })),
];

type DataSource = { name: string; feeds: string };

/** The real public feeds every figure in the app traces back to. */
const DATA_SOURCES: DataSource[] = [
  { name: "U.S. Census BPS", feeds: "Permit volumes by state and structure type." },
  { name: "FRED", feeds: "Mortgage rates, housing starts, construction cost." },
  { name: "SEC EDGAR", feeds: "Live corporate filings from public operators." },
  { name: "Google News", feeds: "Real-time market and deal headlines." },
  { name: "HUD Fair Market Rents", feeds: "Rent anchors for underwriting." },
  { name: "OpenStreetMap", feeds: "On-the-ground building footprints." },
];

export default function Hub() {
  const { dark, toggleDark } = useSettings();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const about = useAboutTransition();

  /**
   * Launch a workspace through a ~1s "building being built" interstitial, then
   * navigate. Modifier-clicks (new tab) and reduced-motion users skip the show.
   */
  const launch = (ev: React.MouseEvent, href: string) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
    ev.preventDefault();
    if (pending) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    router.prefetch(href);
    setPending(href);
    // Hold long enough for the full build animation (floors rise + windows
    // light up, ~1.1s) to play through and linger a beat before navigating.
    window.setTimeout(() => router.push(href), 1900);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <AppBackground />
      <BuildOverlay show={pending !== null} />

      {/* scroll-progress bar: fills left-to-right as the page scrolls */}
      <ScrollProgressBar />

      {/* ambient side-rail skyline that builds floor-by-floor as you scroll */}
      <ScrollSkylineRail />


      <header className="h-[60px] flex items-center justify-between px-6 md:px-10 border-b border-line">
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <div className="font-display text-[17px] font-semibold text-ink leading-none tracking-tight">Real Estate Intelligence</div>
            <div className="text-[11px] mt-1 text-muted">Live public-data analytics</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <button onClick={toggleDark} aria-label="Toggle theme"
          className="grid place-items-center w-9 h-9 rounded-[10px] bg-surface-2 border border-line text-ink-soft hover:text-ink hover:border-line-strong">
          {dark ? (
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={12} cy={12} r={4} /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1080px] mx-auto px-6 md:px-10 py-8 md:py-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-8 lg:gap-12 items-center">
          <div className="max-w-[640px]">
            <div className="text-[12px] font-semibold uppercase tracking-[1.6px] text-gold-deep">Real Estate Intelligence</div>
            <h1 className="font-display text-[30px] md:text-[38px] leading-[1.08] font-semibold text-ink mt-2.5">
              One workspace for the deals you buy and the supply you watch.
            </h1>
            <p className="text-[14.5px] text-ink-soft mt-3 leading-relaxed">
              Every number traces to live public data. Pick a workspace to begin: a national development monitor,
              a per-asset-class deep dive, or the student-housing acquisitions desk.
            </p>
            <Link href="/about" onClick={about.onClick}
              className="group mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink px-4 py-2.5 rounded-[12px] bg-surface border border-line-strong shadow-[var(--shadow)] hover:border-gold hover:shadow-[var(--shadow-lg)] transition-all">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--gold-deep)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={12} cy={12} r={9} /><path d="M12 16v-4M12 8h.01" />
              </svg>
              How this works: About &amp; methodology
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gold-deep group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            {about.overlay}
          </div>
          <ParallaxHero>
            <HubHero />
          </ParallaxHero>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {ENTRIES.map((e, i) => (
            <Reveal key={e.href} delayMs={i * 60}>
            <Link href={e.href} onClick={(ev) => launch(ev, e.href)}
              className="group block h-full rounded-[var(--radius)] bg-surface border border-line p-5 md:p-6 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:border-line-strong transition-all">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                <div className="text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted">{e.eyebrow}</div>
              </div>
              <div className="font-display text-[19px] font-semibold text-ink leading-tight mt-2">{e.title}</div>
              <p className="text-[13px] text-ink-soft mt-2 leading-relaxed">{e.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold-deep group-hover:gap-2.5 transition-all">
                Open
                <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>

        {/* Asset-class workspaces, as a single-row launcher beneath the main cards. */}
        <Reveal delayMs={ENTRIES.length * 60}>
          <div className="mt-8">
            <div className="text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted">Explore by asset class</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-3.5">
              {ASSET_CLASSES.map((a) => (
                <Link key={a.href} href={a.href} onClick={(ev) => launch(ev, a.href)}
                  className="group flex flex-col items-center text-center gap-2 rounded-[var(--radius)] bg-surface border border-line px-2 py-3.5 shadow-[var(--shadow)] hover:border-line-strong hover:shadow-[var(--shadow-lg)] transition-all">
                  <span className="grid place-items-center w-9 h-9 rounded-full shrink-0 transition-transform group-hover:-translate-y-0.5"
                    style={{ background: `color-mix(in srgb, ${a.color} 16%, transparent)` }}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={a.color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      <path d={a.icon} />
                    </svg>
                  </span>
                  <span className="text-[12px] font-semibold text-ink-soft leading-tight group-hover:text-ink transition-colors">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Trust band: the live public feeds every workspace is built on. */}
        <Reveal delayMs={(ENTRIES.length + 1) * 60}>
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-good opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-good" />
              </span>
              <div className="text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted">Built entirely on live public data</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3.5">
              {DATA_SOURCES.map((s) => (
                <div key={s.name}
                  className="rounded-[var(--radius)] bg-surface border border-line px-3 py-3 shadow-[var(--shadow)]">
                  <div className="text-[12px] font-semibold text-ink leading-tight">{s.name}</div>
                  <p className="text-[11px] text-muted mt-1.5 leading-snug">{s.feeds}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

      </main>

      <footer className="border-t border-line px-6 md:px-10 py-5 text-[12px] text-muted">
        100% live public data · No mock numbers · Figures are live or modeled-and-badged
      </footer>
    </div>
  );
}

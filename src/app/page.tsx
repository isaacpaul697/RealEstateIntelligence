"use client";

import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { useSettings } from "@/lib/settings";

const SECTIONS = [
  {
    href: "/student-housing",
    eyebrow: "Acquisitions IQ",
    title: "Student Housing",
    desc: "Screen university markets on live demand, supply, and rent signals — with a transparent 0–100 acquisition score, apartment-level diligence, and a print-ready scorecard.",
    points: ["University market screening", "On-the-ground apartment supply", "Acquisition scorecard & watchlist"],
    icon: (
      <svg viewBox="0 0 32 32" width={26} height={26} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 7L3 14l13 7 13-7L16 7Z" fill="white" />
        <path d="M8 16v5c0 1.8 3.6 3.5 8 3.5s8-1.7 8-3.5v-5l-8 4.3L8 16Z" fill="white" fillOpacity={0.85} />
      </svg>
    ),
  },
  {
    href: "/development",
    eyebrow: "Development Intelligence",
    title: "Development",
    desc: "Explore recent construction by city from live permit data — supply-gap recommendations, development economics, and developer portfolio profiles, all from free public sources.",
    points: ["National permit activity & trends", "City explorer with supply-gap model", "Developer leaderboards & profiles"],
    icon: (
      <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V8l6-3v16M11 21V5l8 3v13M9 11h0M9 15h0M15 12h0M15 16h0" />
      </svg>
    ),
  },
];

export default function Hub() {
  const { dark, toggleDark } = useSettings();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-[60px] flex items-center justify-between px-6 md:px-10 border-b border-line">
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <div className="font-display text-[17px] font-semibold text-ink leading-none tracking-tight">Real Estate Intelligence</div>
            <div className="text-[11px] mt-1 text-muted">Live public-data analytics</div>
          </div>
        </div>
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
      </header>

      <main className="flex-1 w-full max-w-[1080px] mx-auto px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-[640px]">
          <div className="text-[12px] font-semibold uppercase tracking-[1.6px] text-gold-deep">Real Estate Intelligence</div>
          <h1 className="font-display text-[34px] md:text-[44px] leading-[1.08] font-semibold text-ink mt-3">
            One workspace for the deals you buy and the supply you watch.
          </h1>
          <p className="text-[15px] text-ink-soft mt-4 leading-relaxed">
            Two intelligence suites, one source of truth — every number traces to live public data. Pick a workspace to begin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href}
              className="group block rounded-[var(--radius)] bg-surface border border-line p-6 md:p-7 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:border-line-strong transition-all">
              <div className="flex items-center gap-3">
                <span className="inline-grid place-items-center w-11 h-11 rounded-[12px]"
                  style={{ background: "linear-gradient(150deg, var(--gold-bright), var(--gold-deep))", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>
                  {s.icon}
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-muted">{s.eyebrow}</div>
                  <div className="font-display text-[20px] font-semibold text-ink leading-tight">{s.title}</div>
                </div>
              </div>
              <p className="text-[13.5px] text-ink-soft mt-4 leading-relaxed">{s.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--gold)" }} />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep group-hover:gap-2.5 transition-all">
                Open {s.title}
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-line px-6 md:px-10 py-5 text-[12px] text-muted">
        100% live public data · No mock numbers · Figures are live or modeled-and-badged
      </footer>
    </div>
  );
}

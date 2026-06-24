"use client";

import Link from "next/link";
import { Card, SectionTitle, Chip } from "@/components/ui";

const SKILLS = [
  "Real estate market research",
  "Student housing acquisitions",
  "Data analytics",
  "Investment screening",
  "AI / data automation",
  "Dashboard development",
];

const METHOD = [
  { h: "1 · Define the market set", b: "Ten major university markets configured with real federal identifiers (IPEDS unit IDs), geographic coordinates, and conference/region metadata." },
  { h: "2 · Fetch live enrollment data", b: "The College Scorecard API (api.data.gov) provides official enrollment, acceptance rates, and historical student counts. Growth is annualized over a 5-year baseline." },
  { h: "3 · Pull demand signals", b: "Google News RSS surfaces recent student-housing headlines per campus. Article volume serves as a proxy for market activity and demand momentum." },
  { h: "4 · Map real apartments", b: "OpenStreetMap's Overpass API returns named apartment buildings within 3 km of each campus — with addresses, websites, and exact distances." },
  { h: "5 · Score 0–100", b: "A transparent weighted model across six factors (enrollment growth, selectivity, demand momentum, rent growth, occupancy, renter-base scale). Rent and occupancy are modeled from live inputs and labeled \"estimated.\"" },
  { h: "6 · Label & rank", b: "Markets are banded into Strong Buy / Watchlist / Needs Diligence / Overpriced, ranked on the map, leaderboard, and a print-ready IC scorecard." },
];

const SOURCES = [
  { name: "College Scorecard", url: "https://collegescorecard.ed.gov/data/", what: "Enrollment, acceptance rate, 5-year growth", provenance: "live" as const },
  { name: "Google News RSS", url: "https://news.google.com", what: "Student housing headlines per market", provenance: "live" as const },
  { name: "OpenStreetMap Overpass", url: "https://overpass-api.de", what: "Apartment buildings near campus with websites", provenance: "live" as const },
  { name: "Wikipedia Pageimages", url: "https://en.wikipedia.org", what: "Official university seals and logos", provenance: "live" as const },
];

export default function AboutPage() {
  return (
    <div className="cc-fade max-w-[900px] mx-auto">
      <Card className="mb-6 relative overflow-hidden" pad={false}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, var(--ink) 0%, var(--ink-soft) 60%)" }} />
        <div className="relative px-7 py-8 text-white">
          <h1 className="font-display text-[24px] font-semibold">About this project</h1>
          <p className="text-white/60 mt-3 text-sm leading-relaxed max-w-2xl">
            Campus Capital is a portfolio project: a student-housing acquisitions screening platform built to
            look and behave like the desk of a commercial real-estate acquisitions analyst. It combines live university
            enrollment data, real apartment maps, news-driven demand signals, and a transparent acquisition score into one
            research tool — powered entirely by free, public data sources.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {SKILLS.map((s) => (
              <span key={s} className="rounded-full px-3 py-1 text-xs font-medium text-white/90 bg-white/10">{s}</span>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle sub="How the screening pipeline works">Methodology</SectionTitle>
        <div className="flex flex-col gap-4">
          {METHOD.map((m) => (
            <div key={m.h} className="border-l-2 pl-4" style={{ borderColor: "var(--gold)" }}>
              <div className="text-sm font-semibold text-ink">{m.h}</div>
              <div className="text-sm text-ink-soft mt-0.5">{m.b}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle sub="Every number is sourced or transparently labeled">Live data sources</SectionTitle>
        <div className="flex flex-col gap-3">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex items-start gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-good-soft text-good shrink-0 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-good" />
                {s.provenance}
              </span>
              <div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:underline">{s.name}</a>
                <div className="text-xs text-muted">{s.what}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <SectionTitle sub="What's under the hood">Tech stack</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {["Next.js (App Router)", "TypeScript", "Tailwind CSS v4", "React-Leaflet", "College Scorecard API", "OpenStreetMap"].map((t) => (
              <Chip key={t} tone="info">{t}</Chip>
            ))}
          </div>
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Zero mock data. Every figure is fetched from a live API or transparently modeled from live inputs and labeled "estimated."
            Rate-limit–safe caching ensures the app stays fast without burning API quotas.
          </p>
        </Card>
        <Card>
          <SectionTitle sub="Provenance model">Data transparency</SectionTitle>
          <ul className="text-sm text-ink-soft space-y-2 list-disc pl-4">
            <li><strong className="text-ink">Live</strong> — pulled directly from an external source (Scorecard, Google News, OSM, Wikipedia).</li>
            <li><strong className="text-ink">Estimated</strong> — modeled from live inputs. Rent growth and occupancy are derived from enrollment growth and admissions selectivity.</li>
            <li>Every data point on every page carries a provenance tag so you always know what's real and what's modeled.</li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display font-semibold text-ink">Explore the tool</div>
          <div className="text-sm text-muted">Start with the demand-hotspot map or the ranked leaderboard.</div>
        </div>
        <div className="flex gap-2">
          <Link href="/map" className="px-5 h-10 inline-flex items-center rounded-full text-sm font-semibold text-white" style={{ background: "var(--gold)" }}>Map</Link>
          <Link href="/top10" className="px-5 h-10 inline-flex items-center rounded-full text-sm font-semibold border border-line text-ink">Top 10</Link>
        </div>
      </Card>
    </div>
  );
}

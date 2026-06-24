# Campus Capital — Student Housing Acquisitions IQ

An institutional commercial-real-estate acquisitions dashboard for **student housing**. It
screens university markets and the properties around them, blends enrollment, supply/demand,
rent and live demand signals into a transparent **0–100 acquisition score**, and flags where the
conviction is — on an interactive **US demand-hotspot map**, ranked leaderboards, and print-ready
investment-committee scorecards.

> **Demo build** — ships with all-synthetic seed data (clearly tagged `mock`). The render layer
> reads only from a thin data interface, so swapping to live Supabase tables + public APIs is a
> one-line change (see [Going live](#going-live)).

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS v4** — "Steel & Teal" theme (dark-slate command-center sidebar, cool-slate canvas,
  white flat cards, deep-teal accents) matching the PACK design family. Light + dark mode.
- **Supabase (Postgres)** — live data source, behind a mock fallback.
- **d3-geo + TopoJSON (`us-atlas`)** — Albers USA projection for the campus-hotspot map.
- **Hand-rolled SVG charts** — score rings, factor bars, donuts, sparklines, bar lists (no chart lib).

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000  (preview config runs on :8185)
```

## Pages

| Route | Page |
|---|---|
| `/` | Home — project overview, KPIs, hotspot map, signal feed |
| `/map` | Map View — full US hotspot map with metric/region/score filters |
| `/markets` | University Market Overview — sortable market grid |
| `/market/[id]` | University Market Detail — supply/demand, signals, employers, comps |
| `/properties` | Property Comparison — dense sortable/filterable comp table |
| `/property/[id]` | Property Detail — score breakdown, rent card, comps, **PDF export** |
| `/scorecard` | Acquisition Scorecard — print-ready IC one-pager |
| `/top10` | Top 10 Markets — ranked leaderboard with rationale |
| `/about` | About / Resume — methodology, stack, live-data roadmap |
| `/settings` | Settings — tune model weights, data source, theme |

## The acquisition score

A transparent weighted composite (0–100), surfaced everywhere with a full per-factor breakdown.
Default weights (adjustable live in **Settings**, persisted to `localStorage`):

| Factor | Weight |
|---|---|
| Supply / demand imbalance | 20% |
| Enrollment growth | 15% |
| Rent growth | 15% |
| Occupancy strength | 12% |
| Proximity to campus | 10% |
| Competition (inverse) | 8% |
| Review sentiment | 8% |
| New-supply risk (inverse) | 7% |
| Affordability vs peers | 5% |

Bands → labels: **Strong Buy Signal** (71+), **Watchlist** (60–70), **Needs More Diligence**
(48–59), **Overpriced / Weak Demand** (<48). Logic lives in [`src/lib/scoring.ts`](src/lib/scoring.ts).

## The map

`src/components/USMap.tsx` draws US states from `us-atlas` TopoJSON via `d3.geoPath` under a
`geoAlbersUsa()` projection (scale 1300, translate `[487.5, 305]`, 975×610 viewBox). The same
projection places each campus by lng/lat as a **pulsing hotspot** (color + size encode the selected
metric) anchored by a **circular school-logo badge**. Hover for a stat card; click to open the market.

### Swapping in real school logos

Logos render as colored monogram badges (`LogoBadge` in `src/components/ui.tsx`, and inline `<text>`
in the map) keyed off `abbr` + `brandColor` in [`src/lib/data.ts`](src/lib/data.ts). To use real
artwork, drop files in `public/logos/` (e.g. `wisconsin.svg`) and render an `<image>` clipped to a
circle in place of the monogram. Avoid hot-linking trademarked logos.

## Going live

Everything reads through [`src/lib/supabase.ts`](src/lib/supabase.ts): `fetchMarkets()` /
`fetchProperties()` return live Supabase rows when env vars are set, otherwise the synthetic seed.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

1. Create `markets` and `properties` tables matching the shapes in [`src/lib/types.ts`](src/lib/types.ts).
2. Schedule jobs to populate signal time-series (Google Trends, rental listings, review velocity,
   social engagement) and enrollment feeds (IPEDS / Common Data Set).
3. Toggle **Use live data** in Settings. Each metric carries a `live | mock` provenance tag in the UI.

## Notes

All figures are illustrative synthetic data for demonstration and are not investment advice.

import { UA, DAY, memo } from "./http";

/**
 * FRED — keyless CSV endpoint. Used for (a) a construction-cost inflation
 * multiplier that keeps modeled $/sqft current, and (b) national housing
 * context shown on the overview. No key required.
 */
const CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

async function series(id: string): Promise<{ date: string; value: number }[]> {
  const res = await fetch(`${CSV}?id=${id}`, {
    headers: { "User-Agent": UA },
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`FRED ${res.status} ${id}`);
  const text = await res.text();
  const lines = text.trim().split("\n").slice(1);
  const out: { date: string; value: number }[] = [];
  for (const l of lines) {
    const [date, v] = l.split(",");
    const n = parseFloat(v);
    if (date && !Number.isNaN(n)) out.push({ date: date.trim(), value: n });
  }
  return out;
}

function latest(rows: { date: string; value: number }[]) {
  return rows.length ? rows[rows.length - 1] : null;
}

export interface FredContext {
  /** Construction-input PPI: latest value + multiplier vs a 2019 base. */
  costIndexLatest: number | null;
  costIndexDate: string | null;
  /** latest / 2019-baseline — scales modeled construction cost to today. */
  costMultiplier: number;
  mortgageRate: number | null;
  housingStartsK: number | null; // thousands, SAAR
  housingStartsDate: string | null;
}

export async function fetchFred(): Promise<FredContext> {
  return memo("fred:context", DAY, async () => {
    const fallback: FredContext = {
      costIndexLatest: null, costIndexDate: null, costMultiplier: 1,
      mortgageRate: null, housingStartsK: null, housingStartsDate: null,
    };
    try {
      const [ppi, mort, houst] = await Promise.all([
        series("WPUSI012011").catch(() => []), // inputs to construction industries
        series("MORTGAGE30US").catch(() => []),
        series("HOUST").catch(() => []),
      ]);

      const ppiLatest = latest(ppi);
      const base2019 = ppi.find((r) => r.date.startsWith("2019-01"))?.value;
      const multiplier =
        ppiLatest && base2019 && base2019 > 0 ? ppiLatest.value / base2019 : 1;

      const mortLatest = latest(mort);
      const houLatest = latest(houst);

      return {
        costIndexLatest: ppiLatest?.value ?? null,
        costIndexDate: ppiLatest?.date ?? null,
        costMultiplier: multiplier,
        mortgageRate: mortLatest?.value ?? null,
        housingStartsK: houLatest?.value ?? null,
        housingStartsDate: houLatest?.date ?? null,
      };
    } catch (e) {
      console.error("[fred] context fetch failed:", e);
      return fallback;
    }
  });
}

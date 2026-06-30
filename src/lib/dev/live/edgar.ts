import { UA, HALF_DAY, memo } from "./http";

/**
 * Live corporate activity from the SEC's EDGAR system. Every public real-estate
 * operator files material events, results, and offerings here, with real dates
 * and linkable documents, so this is an honest "recent moves" feed with zero
 * fabrication. Free, no key; SEC only asks for a descriptive User-Agent.
 */

export interface Filing {
  form: string;
  label: string;
  date: string; // ISO yyyy-mm-dd
  url: string;
}

/** Human-readable meaning for the SEC form codes worth surfacing as a "move". */
const FORM_LABEL: Record<string, string> = {
  "8-K": "Material event",
  "10-Q": "Quarterly results",
  "10-K": "Annual report",
  "S-11": "Property securities registration",
  "424B5": "Securities offering",
  "424B2": "Securities offering",
  "424B3": "Securities offering",
  "FWP": "Offering term sheet",
  "DEF 14A": "Proxy statement",
  "SC 13D": "Activist ownership stake",
  "SC 13D/A": "Ownership stake update",
};

/**
 * Forms that represent a company *doing something* (events, results, raises),
 * as opposed to insider-trade and passive-ownership noise (3/4/5/144/13G).
 */
function labelFor(form: string): string | null {
  if (FORM_LABEL[form]) return FORM_LABEL[form];
  if (form.startsWith("424B")) return "Securities offering";
  if (form.startsWith("S-11")) return "Property securities registration";
  if (form.startsWith("8-K")) return "Material event";
  if (form.startsWith("10-Q")) return "Quarterly results";
  if (form.startsWith("10-K")) return "Annual report";
  return null;
}

interface SubmissionsRecent {
  accessionNumber: string[];
  filingDate: string[];
  form: string[];
  primaryDocument: string[];
}

/** Public company facts carried at the top of the EDGAR submissions file. */
export interface CompanyProfile {
  name: string | null;
  tickers: string[];
  exchanges: string[];
  sicDescription: string | null;
  category: string | null;
  /** Fiscal year end as a human "Mon DD" when parseable. */
  fiscalYearEnd: string | null;
  stateOfIncorporation: string | null;
  /** Headquarters as "City, ST". */
  hq: string | null;
  website: string | null;
  formerNames: string[];
}

interface SubmissionsMeta {
  name?: string;
  tickers?: string[];
  exchanges?: string[];
  sicDescription?: string;
  category?: string;
  fiscalYearEnd?: string; // MMDD
  stateOfIncorporation?: string;
  website?: string;
  addresses?: { business?: { city?: string; stateOrCountry?: string } };
  formerNames?: { name?: string }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Turn an EDGAR "MMDD" fiscal-year-end code into "Mon DD". */
function fiscalYearEndLabel(mmdd?: string): string | null {
  if (!mmdd || mmdd.length !== 4) return null;
  const mo = Number(mmdd.slice(0, 2));
  const day = Number(mmdd.slice(2));
  if (!mo || mo > 12 || !day || day > 31) return null;
  return `${MONTHS[mo - 1]} ${day}`;
}

/** Fetch the public company profile (facts) for one company by CIK. */
export async function fetchCompanyProfile(cik: string | number): Promise<CompanyProfile | null> {
  const cikInt = Number(cik);
  if (!Number.isFinite(cikInt) || cikInt <= 0) return null;
  const padded = String(cikInt).padStart(10, "0");

  return memo(`edgar-profile:${padded}`, HALF_DAY, async () => {
    try {
      const res = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: HALF_DAY },
      });
      if (!res.ok) return null;
      const d = (await res.json()) as SubmissionsMeta;
      const city = d.addresses?.business?.city;
      const st = d.addresses?.business?.stateOrCountry;
      const hq = city && st ? `${city}, ${st}` : city ?? st ?? null;
      return {
        name: d.name ?? null,
        tickers: d.tickers ?? [],
        exchanges: d.exchanges ?? [],
        sicDescription: d.sicDescription ?? null,
        category: d.category ?? null,
        fiscalYearEnd: fiscalYearEndLabel(d.fiscalYearEnd),
        stateOfIncorporation: d.stateOfIncorporation ?? null,
        hq,
        website: d.website ?? null,
        formerNames: (d.formerNames ?? []).map((f) => f.name).filter((n): n is string => !!n),
      } satisfies CompanyProfile;
    } catch {
      return null;
    }
  });
}

/** Fetch the most recent material filings for one company by CIK. */
export async function fetchFilings(cik: string | number, limit = 4): Promise<Filing[]> {
  const cikInt = Number(cik);
  if (!Number.isFinite(cikInt) || cikInt <= 0) return [];
  const padded = String(cikInt).padStart(10, "0");

  return memo(`edgar:${padded}:${limit}`, HALF_DAY, async () => {
    try {
      const res = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: HALF_DAY },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { filings?: { recent?: SubmissionsRecent } };
      const r = data.filings?.recent;
      if (!r) return [];

      const out: Filing[] = [];
      for (let i = 0; i < r.form.length && out.length < limit; i++) {
        const form = r.form[i];
        const label = labelFor(form);
        if (!label) continue; // skip insider/ownership noise
        const acc = r.accessionNumber[i].replace(/-/g, "");
        const doc = r.primaryDocument[i];
        const base = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${acc}`;
        out.push({
          form,
          label,
          date: r.filingDate[i],
          url: doc ? `${base}/${doc}` : `${base}/`,
        });
      }
      return out;
    } catch {
      return [];
    }
  });
}

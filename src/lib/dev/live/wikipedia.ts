import { DAY, UA, memo } from "./http";

/**
 * Wikipedia REST summary — a short encyclopedic blurb for a recognizable
 * developer/builder firm. Keyless. We only surface a result when the page
 * looks like a real company match; otherwise the profile shows permit-derived
 * activity only. Never fabricated.
 */
export interface WikiInfo {
  summary: string | null;
  thumb: string | null;
  url: string | null;
}

interface WikiResp {
  type?: string;
  extract?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
  description?: string;
}

const COMPANYISH = /(compan|develop|properti|realty|real estate|construct|builder|group|holdings|partners|capital|homes|associat|corp|inc|llc)/i;

export async function fetchWiki(firm: string): Promise<WikiInfo | null> {
  const name = firm.trim();
  if (name.length < 4) return null;
  return memo(`wiki:${name.toLowerCase()}`, DAY, async () => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}?redirect=true`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: DAY },
      });
      if (!res.ok) return null;
      const j = (await res.json()) as WikiResp;
      if (j.type === "disambiguation") return null;
      const summary = j.extract?.trim() || null;
      // Only keep when the article reads like a company, to avoid surfacing a
      // same-named person/place as if it were the developer.
      const looksLikeFirm =
        (j.description && COMPANYISH.test(j.description)) ||
        (summary != null && COMPANYISH.test(summary.slice(0, 200)));
      if (!summary || !looksLikeFirm) return null;
      return {
        summary,
        thumb: j.thumbnail?.source ?? null,
        url: j.content_urls?.desktop?.page ?? null,
      };
    } catch {
      return null;
    }
  });
}

/** Domain-based logo via Clearbit/Google favicon — no monogram placeholders. */
export function firmLogo(firm: string): string | null {
  const slug = firm
    .toLowerCase()
    .replace(/\b(llc|inc|corp|corporation|co|company|ltd|lp|llp|group|holdings)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (slug.length < 3) return null;
  // Google's favicon service resolves a best-effort domain icon; returns a
  // generic globe when unknown, so the UI treats failures gracefully.
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`;
}

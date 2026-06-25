import type { Article } from "../types";
import { HALF_DAY, UA } from "./http";

function decode(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return null;
  return decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim());
}

/**
 * Real headlines from Google News RSS for a campus housing query.
 * Titles arrive as "Headline - Source"; we split off the source.
 */
export async function fetchNews(query: string, limit = 10): Promise<Article[]> {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}` +
    `&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: HALF_DAY },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.split("<item>").slice(1);
    const out: Article[] = [];
    for (const raw of items.slice(0, limit)) {
      const block = raw.split("</item>")[0];
      const rawTitle = tag(block, "title") ?? "";
      const link = tag(block, "link") ?? "";
      const pub = tag(block, "pubDate") ?? "";
      const sourceTag = tag(block, "source");
      let title = rawTitle;
      let source = sourceTag ?? "";
      // Google News formats titles as "Headline - Source". Strip the trailing
      // source so it isn't duplicated next to the dedicated source line.
      const idx = rawTitle.lastIndexOf(" - ");
      if (idx > 0) {
        const tail = rawTitle.slice(idx + 3);
        if (source) {
          if (tail === source) title = rawTitle.slice(0, idx);
        } else {
          title = rawTitle.slice(0, idx);
          source = tail;
        }
      }
      if (!title || !link) continue;
      out.push({
        title,
        link,
        source: source || "Google News",
        published: pub ? new Date(pub).toISOString() : "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

export const housingQuery = (school: string) =>
  `"${school}" (student housing OR apartments OR enrollment OR off-campus)`;

import type { Article } from "@/lib/types";
import { Card, SectionTitle, ProvenanceTag } from "@/components/dev/ui";

function ago(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const mo = Math.floor(days / 30);
  return mo === 1 ? "1 month ago" : `${mo} months ago`;
}

/** Live construction & development headlines for a city (Google News RSS). */
export function CityNews({ articles, city }: { articles: Article[]; city: string }) {
  if (!articles.length) return null;
  return (
    <Card pad={false}>
      <div className="p-5 pb-3">
        <SectionTitle
          sub={`Construction, permitting, and real-estate coverage for ${city}`}
          right={<ProvenanceTag p="live" note="Live from Google News" />}
        >
          In the news
        </SectionTitle>
      </div>
      <div className="divide-y divide-line">
        {articles.slice(0, 6).map((a, i) => (
          <a
            key={i}
            href={a.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-4 px-5 py-3 hover:bg-surface-2 transition-colors group"
          >
            <div className="min-w-0">
              <div className="text-sm text-ink font-medium leading-snug group-hover:text-gold-deep">{a.title}</div>
              <div className="text-xs text-muted-2 mt-0.5">
                {a.source}
                {a.published ? ` · ${ago(a.published)}` : ""}
              </div>
            </div>
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-muted-2 shrink-0 mt-1 group-hover:text-gold-deep">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        ))}
      </div>
    </Card>
  );
}

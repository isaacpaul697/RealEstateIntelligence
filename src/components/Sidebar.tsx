"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./LogoMark";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { useMobileNav } from "./MobileNav";
import { CITIES } from "@/lib/dev/cities";
import { SECTORS, SECTOR_ORDER, sectorSubnav, SECTOR_ICON } from "@/lib/dev/sectorDefs";

const PIN = "M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z";

type Item = { href: string; name: string; icon: string; exact?: boolean };
type Group = { label: string; items: Item[] };

/** Top-level sections, in the order Isaac specified. Each is its own world with
 *  its own sub-navigation, mirroring how student housing is set up. */
type SectionTab = {
  key: string;
  href: string;
  label: string;
  icon: string;
  match: (p: string) => boolean;
};

const NATIONAL_ICON = "M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3Zm6 0v12m6-9v12";
const AREA_ICON = "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3";
const HOUSING_ICON =
  "M12 5 2 10l10 5 10-5-10-5ZM6 12v4.4c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5V12M22 10v6.5M21 17.5a1 1 0 1 0 2 0 1 1 0 1 0 -2 0";
const CLASS_ICON = "M3 21h18M5 21V8l6-3v16M11 21V5l8 3v13";
const BUILD_ICON = "M3 21h18M5 21V11l4-2v12M13 21V7l6-3v17M9 13h0M17 9h0";

const SECTIONS: SectionTab[] = [
  {
    key: "national",
    href: "/national",
    label: "National overview",
    icon: NATIONAL_ICON,
    match: (p) =>
      p === "/national" ||
      p.startsWith("/national/") ||
      p.startsWith("/city/") ||
      p.startsWith("/project/") ||
      p.startsWith("/developer/"),
  },
  { key: "area", href: "/area", label: "Area search", icon: AREA_ICON, match: (p) => p.startsWith("/area") },
  { key: "student-housing", href: "/student-housing", label: "Student housing", icon: HOUSING_ICON, match: (p) => p.startsWith("/student-housing") },
  ...SECTOR_ORDER.map((slug) => ({
    key: slug,
    href: `/sector/${slug}`,
    label: SECTORS[slug].label,
    icon: SECTOR_ICON[slug] ?? CLASS_ICON,
    match: (p: string) => p === `/sector/${slug}` || p.startsWith(`/sector/${slug}/`),
  })),
  { key: "build", href: "/build", label: "Build a property", icon: BUILD_ICON, match: (p) => p.startsWith("/build") },
];

/** Student housing keeps its rich, multi-tool sidebar exactly as before. */
const HOUSING_GROUPS: Group[] = [
  {
    label: "In this section",
    items: [
      { href: "/student-housing", name: "Home", icon: "M3 11.5 12 4l9 7.5M5 10v10h14V10", exact: true },
      { href: "/student-housing/map", name: "Map View", icon: "M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3Zm6 0v12m6-9v12" },
    ],
  },
  {
    label: "Screening",
    items: [
      { href: "/student-housing/markets", name: "University Markets", icon: "M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" },
      { href: "/student-housing/apartments", name: "Apartments", icon: "M4 6h16M4 12h16M4 18h16" },
      { href: "/student-housing/top10", name: "Top 10 Markets", icon: "M5 19h4V9H5v10Zm6 0h4V5h-4v14Zm6 0h4v-6h-4v6Z" },
      { href: "/student-housing/top-apartments", name: "Top 10 Apartments", icon: "M3 21h18M9 21V9h6v12M6 21V12h3v9m6 0V12h3v9" },
      { href: "/student-housing/players", name: "Major Players & Moves", icon: "M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 14a8 8 0 0 1 16 0M19 8l1.5 1.5L23 7" },
    ],
  },
  {
    label: "Diligence",
    items: [
      { href: "/student-housing/scorecard", name: "Acquisition Scorecard", icon: "M7 3h10l3 4v14H4V7l3-4Zm1 9 2.5 2.5L16 9" },
      { href: "/student-housing/notes", name: "Diligence Notes", icon: "M5 3h11l3 3v15H5V3Zm3 6h8M8 13h8M8 17h5" },
      { href: "/student-housing/watchlist", name: "Saved Apartments", icon: "M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" },
    ],
  },
  {
    label: "Project",
    items: [
      { href: "/student-housing/settings", name: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.8l2-1.5-2-3.4-2.3 1a8 8 0 0 0-3-1.7L14 1h-4l-.5 2.3a8 8 0 0 0-3 1.7l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .6 0 1.2.2 1.8l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 3 1.7L10 23h4l.5-2.3a8 8 0 0 0 3-1.7l2.3 1 2-3.4-2-1.5c.2-.6.2-1.2.2-1.8Z" },
    ],
  },
];

const LEADERBOARD_ICON = "M5 19h4V9H5v10Zm6 0h4V5h-4v14Zm6 0h4v-6h-4v6Z";
const OVERVIEW_ICON = "M4 6h16M4 12h16M4 18h16";
const PLAYERS_ICON = "M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 14a8 8 0 0 1 16 0M19 8l1.5 1.5L23 7";

/** Contextual sub-navigation for the active top-level section. */
function subnavFor(sectionKey: string): Group[] {
  if (sectionKey === "student-housing") return HOUSING_GROUPS;

  if (sectionKey === "national") {
    const liveCities = CITIES.filter((c) => c.socrata);
    return [
      {
        label: "Overview",
        items: [{ href: "/national", name: "National Overview & Map", icon: NATIONAL_ICON, exact: true }],
      },
      {
        label: "Live permit cities",
        items: liveCities.map((c) => ({ href: `/city/${c.id}`, name: `${c.name}, ${c.state}`, icon: PIN })),
      },
    ];
  }

  if (sectionKey === "area") {
    return [
      {
        label: "Tools",
        items: [{ href: "/area", name: "Area Search", icon: AREA_ICON, exact: true }],
      },
    ];
  }

  if (sectionKey === "build") {
    return [
      {
        label: "Tools",
        items: [{ href: "/build", name: "Underwriting Lab", icon: BUILD_ICON, exact: true }],
      },
    ];
  }

  // Asset classes: Overview, Leaderboards (residential only), Players & news.
  const iconFor = (slug: string) => (slug === "leaderboards" ? LEADERBOARD_ICON : slug === "players" ? PLAYERS_ICON : OVERVIEW_ICON);
  return [
    {
      label: "In this section",
      items: sectorSubnav(sectionKey).map((p) => ({
        href: p.slug ? `/sector/${sectionKey}/${p.slug}` : `/sector/${sectionKey}`,
        name: p.name,
        icon: iconFor(p.slug),
        exact: p.slug === "",
      })),
    },
  ];
}

/** Logo + section navigator + contextual sub-nav + integrations. Shared by the
 *  desktop rail and the mobile drawer. Fully pathname-driven. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const active = SECTIONS.find((s) => s.match(path)) ?? SECTIONS[0];
  const isHousing = active.key === "student-housing";
  const groups = subnavFor(active.key);
  const isItemActive = (it: Item) => path === it.href || (!it.exact && path.startsWith(it.href + "/"));

  return (
    <>
      <div className="px-5 pt-6 pb-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <div className="font-display text-[16px] font-semibold text-ink leading-none tracking-tight">Real Estate Intelligence</div>
            <div className="text-[11px] mt-1 text-muted">Live public-data analytics</div>
          </div>
        </Link>
      </div>

      {/* Top-level section navigator: every world Isaac defined, in order. */}
      <div className="px-3 pb-2">
        <div className="text-[10px] uppercase tracking-[1.4px] font-semibold px-3 pb-1.5 text-muted-2">Workspaces</div>
        <div className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => {
            const on = s.key === active.key;
            return (
              <Link key={s.key} href={s.href} onClick={onNavigate}
                className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-[9px] text-[13px] transition-colors ${
                  on ? "bg-gold-soft text-ink font-semibold" : "text-ink-soft hover:bg-surface-2 font-medium"
                }`}>
                {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: "var(--gold)" }} />}
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.7}
                  strokeLinecap="round" strokeLinejoin="round" style={on ? { color: "var(--gold)" } : { opacity: 0.65 }}>
                  <path d={s.icon} />
                </svg>
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-3 my-2 border-t border-line" />

      <nav className="flex-1 overflow-y-auto nav-scroll px-3 py-1">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="text-[10px] uppercase tracking-[1.4px] font-semibold px-3 pb-2 text-muted-2">
              {g.label}
            </div>
            {g.items.map((it) => {
              const on = isItemActive(it);
              return (
                <Link key={it.href} href={it.href} onClick={onNavigate}
                  className={`relative flex items-center gap-3 px-3 py-2 mb-0.5 rounded-[10px] text-[13.5px] transition-colors ${
                    on ? "bg-gold-soft text-ink font-semibold" : "text-ink-soft hover:bg-surface-2 font-medium"
                  }`}>
                  {on && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: "var(--gold)" }} />}
                  <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={1.7}
                    strokeLinecap="round" strokeLinejoin="round" style={on ? { color: "var(--gold)" } : { opacity: 0.7 }}>
                    <path d={it.icon} />
                  </svg>
                  {it.name}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[1.4px] font-semibold px-3 pb-2 text-muted-2">Reference</div>
          <Link href="/about" onClick={onNavigate}
            className={`relative flex items-center gap-3 px-3 py-2 mb-0.5 rounded-[10px] text-[13.5px] transition-colors ${
              path === "/about" ? "bg-gold-soft text-ink font-semibold" : "text-ink-soft hover:bg-surface-2 font-medium"
            }`}>
            {path === "/about" && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: "var(--gold)" }} />}
            <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={1.7}
              strokeLinecap="round" strokeLinejoin="round" style={path === "/about" ? { color: "var(--gold)" } : { opacity: 0.7 }}>
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
            </svg>
            About &amp; methodology
          </Link>
        </div>
      </nav>

      {isHousing && (
        <div className="px-3 pt-3 pb-4 border-t border-line">
          <IntegrationsPanel />
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const { open, setOpen } = useMobileNav();

  return (
    <>
      {/* Desktop rail */}
      <aside className="no-print hidden lg:flex w-[248px] shrink-0 sticky top-0 h-screen flex-col bg-surface border-r border-line">
        <SidebarContent />
      </aside>

      {/* Mobile drawer + backdrop */}
      <div className={`no-print lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-[1100] bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`fixed top-0 left-0 z-[1110] w-[280px] max-w-[85vw] h-full flex flex-col bg-surface border-r border-line shadow-[var(--shadow-lg)] transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>
    </>
  );
}

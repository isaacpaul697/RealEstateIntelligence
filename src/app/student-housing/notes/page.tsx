"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useScoredMarkets } from "@/lib/compute";
import { usePreloadedApartments } from "@/lib/live/allApartments";
import { useNotes } from "@/lib/notes";
import { usePersistedState } from "@/lib/usePersistedState";
import { Card, SectionTitle, Logo, Spinner, StateBlock } from "@/components/ui";
import { fmtNum } from "@/lib/scoring";

/** Debounced autosave textarea. `value`/`onSave` come from the notes store. */
function AutoTextarea({
  initial,
  onSave,
  placeholder,
  rows = 4,
}: {
  initial: string;
  onSave: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  const [value, setValue] = useState(initial);
  const [savedFlash, setSavedFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 400);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-surface-2 border border-line rounded-[var(--radius-card)] p-3 text-sm text-ink placeholder:text-muted-2 resize-y focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
      />
      <span
        className={`absolute top-2 right-3 text-[10px] font-semibold uppercase tracking-wide text-good transition-opacity ${
          savedFlash ? "opacity-100" : "opacity-0"
        }`}
      >
        Saved
      </span>
    </div>
  );
}

export default function NotesPage() {
  const { scored, loading, error } = useScoredMarkets();
  const [sel, setSel] = usePersistedState<string>("cc.sel.notes-school", "");
  const { getSchoolNote, setSchoolNote, getAptNote, setAptNote, hasSchoolNote, aptNoteCount } = useNotes();
  const [openApts, setOpenApts] = useState<Set<string>>(new Set());

  const sortedSchools = useMemo(
    () => [...scored].sort((a, b) => a.market.shortName.localeCompare(b.market.shortName)),
    [scored],
  );

  const active = sel || sortedSchools[0]?.market.id;
  const market = scored.find((m) => m.market.id === active)?.market;
  const { apartments, loading: aptLoading } = usePreloadedApartments(active);

  // Reset expanded apartment panels when switching schools.
  useEffect(() => { setOpenApts(new Set()); }, [active]);

  const toggleApt = (id: string) =>
    setOpenApts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (loading) return <Spinner />;
  if (error) return <StateBlock title="Live feed unavailable" note="Could not load market data. Try refreshing." />;

  const notedApts = aptNoteCount(apartments.map((a) => a.id));

  return (
    <div className="cc-fade max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Diligence Notes</h1>
        <p className="text-sm text-muted mt-1">
          Pick a market, capture your thesis, and jot notes on any individual property. Saved locally to this browser.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={active}
          onChange={(e) => setSel(e.target.value)}
          className="h-10 px-4 bg-surface border border-line text-sm text-ink outline-none focus:border-line-strong flex-1 min-w-[240px]"
          style={{ borderRadius: "var(--radius)" }}
        >
          {sortedSchools.map((m) => (
            <option key={m.market.id} value={m.market.id}>
              {m.market.shortName} · {m.market.city}, {m.market.state}
              {hasSchoolNote(m.market.id) ? "  ●" : ""}
            </option>
          ))}
        </select>
      </div>

      {market && (
        <div className="flex items-center gap-3 mb-5">
          <Logo src={market.logo} abbr={market.abbr} color={market.brandColor} size={44} />
          <div>
            <div className="font-semibold text-ink">{market.name}</div>
            <div className="text-xs text-muted">
              {market.city}, {market.state} · {market.conference}
              {market.enrollment ? ` · ${fmtNum(market.enrollment)} students` : ""}
            </div>
          </div>
        </div>
      )}

      {/* School-level notes */}
      <Card className="mb-6">
        <SectionTitle sub="Market thesis, risks, and follow-ups">School notes</SectionTitle>
        {active && (
          <AutoTextarea
            key={`school-${active}`}
            initial={getSchoolNote(active)}
            onSave={(v) => setSchoolNote(active, v)}
            placeholder={`What's your take on ${market?.shortName ?? "this market"}? Demand drivers, supply pipeline, target deals, red flags…`}
            rows={6}
          />
        )}
      </Card>

      {/* Per-apartment notes */}
      <Card pad={false}>
        <div className="p-5 pb-3 flex items-center justify-between gap-3 flex-wrap">
          <SectionTitle sub={aptLoading ? "Loading apartments…" : `${apartments.length} near campus${notedApts > 0 ? ` · ${notedApts} with notes` : ""} · click any to add notes`}>
            Property notes
          </SectionTitle>
        </div>
        {aptLoading ? (
          <div className="px-5 pb-5"><Spinner label="Loading apartment data…" /></div>
        ) : apartments.length === 0 ? (
          <div className="px-5 pb-5">
            <StateBlock title="No apartments found" note="OpenStreetMap has no named apartment buildings within 3 mi of this campus." />
          </div>
        ) : (
          <div className="divide-y divide-line border-t border-line">
            {apartments.map((apt) => {
              const open = openApts.has(apt.id);
              const noted = getAptNote(apt.id).trim().length > 0;
              return (
                <div key={apt.id}>
                  <button
                    onClick={() => toggleApt(apt.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${noted ? "bg-gold" : "bg-line-strong"}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink text-sm truncate">{apt.name}</div>
                      <div className="text-xs text-muted truncate">
                        {apt.street ?? "Address not listed"} · {apt.distanceMi.toFixed(1)} mi · {fmtNum(apt.estBeds)} beds
                      </div>
                    </div>
                    {noted && !open && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gold-deep shrink-0">Note</span>
                    )}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"
                      className={`text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 pt-1">
                      <AutoTextarea
                        key={`apt-${apt.id}`}
                        initial={getAptNote(apt.id)}
                        onSave={(v) => setAptNote(apt.id, v)}
                        placeholder={`Notes on ${apt.name}: condition, ownership, rent comps, contact…`}
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

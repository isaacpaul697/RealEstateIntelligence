"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  label: string;
  short: string;
  lat: number;
  lng: number;
}

/**
 * Client-side area search with live typeahead suggestions. As you type we
 * debounce a call to /api/geocode-suggest (OpenStreetMap Nominatim) and show
 * matching US places; picking one (click, or arrow-keys + Enter) or submitting
 * free text navigates to /area?q=… so the route-level loading screen takes over.
 */
export function AreaSearchForm() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loadingSug, setLoadingSug] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const justPicked = useRef(false);

  // Debounced suggestion fetch. Aborts the in-flight request on each keystroke.
  useEffect(() => {
    const term = q.trim();
    if (justPicked.current) { justPicked.current = false; return; }
    if (term.length < 2) {
      setSuggestions([]);
      setLoadingSug(false);
      return;
    }
    const ctrl = new AbortController();
    setLoadingSug(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode-suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        /* aborted or failed; leave prior suggestions */
      } finally {
        setLoadingSug(false);
      }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  // Close the dropdown when clicking outside the box.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    setOpen(false);
    startTransition(() => router.push(`/area?q=${encodeURIComponent(t)}`));
  }

  function pick(s: Suggestion) {
    justPicked.current = true;
    setQ(s.short);
    setSuggestions([]);
    go(s.short);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (open && active >= 0 && suggestions[active]) { pick(suggestions[active]); return; }
    go(q);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 w-full max-w-[420px]" autoComplete="off">
      <div ref={boxRef} className="relative">
        <div className="flex items-center gap-2 bg-surface-2 border border-line rounded-[var(--radius-card)] px-3 py-2 shadow-[var(--shadow)] focus-within:border-line-strong transition-colors">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" className="text-muted-2 shrink-0">
            <circle cx={11} cy={11} r={7} /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => { if (suggestions.length) setOpen(true); }}
            autoFocus
            disabled={pending}
            placeholder="e.g. Boise, ID or Ann Arbor"
            aria-label="Search for a city or area"
            role="combobox"
            aria-expanded={open}
            aria-controls="area-suggest-list"
            aria-autocomplete="list"
            className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted-2 outline-none min-w-0 disabled:opacity-60"
          />
          {loadingSug && !pending && (
            <span aria-hidden className="inline-block w-3.5 h-3.5 rounded-full border-2 border-line-strong border-t-gold-deep animate-spin shrink-0" />
          )}
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-3.5 py-1.5 rounded-[10px] disabled:opacity-80"
            style={{ background: "linear-gradient(150deg, var(--gold-bright), var(--gold-deep))" }}
          >
            {pending && (
              <span
                role="status"
                aria-label="Searching"
                className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            )}
            {pending ? "Searching" : "Search"}
          </button>
        </div>

        {open && suggestions.length > 0 && !pending && (
          <ul
            id="area-suggest-list"
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1.5 py-1 bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow-lg)] overflow-hidden text-left"
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.short}-${s.lat}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${i === active ? "bg-surface-2" : ""}`}
              >
                <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--gold-deep)" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11Z" /><circle cx={12} cy={10} r={2.5} />
                </svg>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink leading-tight truncate">{s.short}</span>
                  <span className="block text-[11px] text-muted truncate">{s.label}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}

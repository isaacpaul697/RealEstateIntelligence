"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "cc.watchlist";

export interface SavedApartment {
  aptId: string;
  aptName: string;
  street: string | null;
  marketId: string;
  marketName: string;
  marketState: string;
  estUnits: number;
  estAnnualRevenue: number;
  distanceMi: number;
  website: string | null;
  searchUrl: string | null;
  lat: number;
  lng: number;
  savedAt: string; // ISO timestamp
  notes: string; // user notes
}

interface WatchlistValue {
  saved: SavedApartment[];
  isSaved: (aptId: string) => boolean;
  toggle: (apt: SavedApartment) => void;
  remove: (aptId: string) => void;
  updateNotes: (aptId: string, notes: string) => void;
  clear: () => void;
}

const Ctx = createContext<WatchlistValue>({
  saved: [],
  isSaved: () => false,
  toggle: () => {},
  remove: () => {},
  updateNotes: () => {},
  clear: () => {},
});

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedApartment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Restore from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSaved(JSON.parse(stored) as SavedApartment[]);
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change (only after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch { /* quota exceeded — ignore */ }
  }, [saved, hydrated]);

  const isSaved = useCallback(
    (aptId: string) => saved.some((a) => a.aptId === aptId),
    [saved],
  );

  const toggle = useCallback((apt: SavedApartment) => {
    setSaved((prev) => {
      const exists = prev.some((a) => a.aptId === apt.aptId);
      if (exists) return prev.filter((a) => a.aptId !== apt.aptId);
      return [...prev, apt];
    });
  }, []);

  const remove = useCallback((aptId: string) => {
    setSaved((prev) => prev.filter((a) => a.aptId !== aptId));
  }, []);

  const updateNotes = useCallback((aptId: string, notes: string) => {
    setSaved((prev) => prev.map((a) => (a.aptId === aptId ? { ...a, notes } : a)));
  }, []);

  const clear = useCallback(() => setSaved([]), []);

  return (
    <Ctx.Provider value={{ saved, isSaved, toggle, remove, updateNotes, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWatchlist() {
  return useContext(Ctx);
}

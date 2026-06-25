"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

interface NotesData {
  /** School-level diligence notes, keyed by market id. */
  schools: Record<string, string>;
  /** Per-apartment notes, keyed by apartment id. */
  apartments: Record<string, string>;
}

interface NotesValue {
  getSchoolNote: (marketId: string) => string;
  setSchoolNote: (marketId: string, note: string) => void;
  getAptNote: (aptId: string) => string;
  setAptNote: (aptId: string, note: string) => void;
  /** True if any non-empty note exists for the school or one of its apartments. */
  hasSchoolNote: (marketId: string) => boolean;
  aptNoteCount: (aptIds: string[]) => number;
}

const empty: NotesData = { schools: {}, apartments: {} };

const Ctx = createContext<NotesValue>({
  getSchoolNote: () => "",
  setSchoolNote: () => {},
  getAptNote: () => "",
  setAptNote: () => {},
  hasSchoolNote: () => false,
  aptNoteCount: () => 0,
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  // In-memory only: notes survive client-side navigation (the provider lives
  // at the root layout) but are wiped on a full page refresh.
  const [data, setData] = useState<NotesData>(empty);

  const getSchoolNote = useCallback(
    (marketId: string) => data.schools[marketId] ?? "",
    [data],
  );

  const setSchoolNote = useCallback((marketId: string, note: string) => {
    setData((prev) => ({ ...prev, schools: { ...prev.schools, [marketId]: note } }));
  }, []);

  const getAptNote = useCallback(
    (aptId: string) => data.apartments[aptId] ?? "",
    [data],
  );

  const setAptNote = useCallback((aptId: string, note: string) => {
    setData((prev) => ({
      ...prev,
      apartments: { ...prev.apartments, [aptId]: note },
    }));
  }, []);

  const hasSchoolNote = useCallback(
    (marketId: string) => (data.schools[marketId] ?? "").trim().length > 0,
    [data],
  );

  const aptNoteCount = useCallback(
    (aptIds: string[]) =>
      aptIds.filter((id) => (data.apartments[id] ?? "").trim().length > 0).length,
    [data],
  );

  return (
    <Ctx.Provider
      value={{
        getSchoolNote,
        setSchoolNote,
        getAptNote,
        setAptNote,
        hasSchoolNote,
        aptNoteCount,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNotes() {
  return useContext(Ctx);
}

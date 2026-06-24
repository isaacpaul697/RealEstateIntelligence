"use client";

import { useState, useEffect, useCallback } from "react";

export function usePersistedState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Restore from sessionStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch { /* ignore */ }
    setHydrated(true);
  }, [key]);

  // Persist to sessionStorage on change (only after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded — ignore */ }
  }, [key, value, hydrated]);

  const set = useCallback((v: T) => setValue(v), []);
  return [value, set];
}

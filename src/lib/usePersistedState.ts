"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Session-scoped state that survives in-app (client-side) navigation but is
 * wiped on a full page refresh. We deliberately use a module-level in-memory
 * store rather than sessionStorage/localStorage: the value lives only as long
 * as the JavaScript module stays loaded, so reloading the tab clears it.
 */
const memoryStore = new Map<string, unknown>();

export function usePersistedState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);

  // Restore from the in-memory store after mount (avoids hydration mismatch).
  useEffect(() => {
    if (memoryStore.has(key)) setValue(memoryStore.get(key) as T);
  }, [key]);

  const set = useCallback(
    (v: T) => {
      memoryStore.set(key, v);
      setValue(v);
    },
    [key],
  );

  return [value, set];
}

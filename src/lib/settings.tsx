"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_WEIGHTS, type Weights } from "./scoring";

const KEY = "campuscap.settings.v2";

interface Settings {
  weights: Weights;
  dark: boolean;
}
const DEFAULTS: Settings = { weights: { ...DEFAULT_WEIGHTS }, dark: false };

interface Ctx extends Settings {
  setWeight: (k: string, v: number) => void;
  resetWeights: () => void;
  toggleDark: () => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setS({
          dark: !!p.dark,
          weights: { ...DEFAULT_WEIGHTS, ...(p.weights ?? {}) },
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
    document.documentElement.classList.toggle("dark", s.dark);
  }, [s]);

  const value: Ctx = {
    ...s,
    setWeight: (k, v) => setS((p) => ({ ...p, weights: { ...p.weights, [k]: v } })),
    resetWeights: () => setS((p) => ({ ...p, weights: { ...DEFAULT_WEIGHTS } })),
    toggleDark: () => setS((p) => ({ ...p, dark: !p.dark })),
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings outside provider");
  return ctx;
}

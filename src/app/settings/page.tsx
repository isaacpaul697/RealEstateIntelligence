"use client";

import { useSettings } from "@/lib/settings";
import { FACTOR_META } from "@/lib/scoring";
import { Card, SectionTitle } from "@/components/ui";

export default function SettingsPage() {
  const { weights, setWeight, resetWeights, dark, toggleDark } = useSettings();
  const total = Object.values(weights).reduce((s, v) => s + v, 0);

  return (
    <div className="cc-fade max-w-[760px] mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Settings</h1>
        <p className="text-sm text-muted mt-1">Tune the acquisition model. Saved to your browser.</p>
      </div>

      <Card className="mb-6">
        <SectionTitle sub={`Weights total ${(total * 100).toFixed(0)}% — scores normalize automatically`}
          right={<button onClick={resetWeights} className="text-xs font-semibold hover:underline" style={{ color: "var(--gold-deep)" }}>Reset defaults</button>}>
          Scoring model weights
        </SectionTitle>
        <div className="flex flex-col gap-3 mt-1">
          {Object.entries(weights).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-sm text-ink-soft w-56">{FACTOR_META[k]?.label ?? k}</span>
              <input type="range" min={0} max={0.4} step={0.01} value={v}
                onChange={(e) => setWeight(k, +e.target.value)} className="flex-1" />
              <span className="text-sm num text-ink w-12 text-right">{(v * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle sub="All data is live — no mock fallback">Data sources</SectionTitle>
        <div className="text-sm text-ink-soft space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-good" />
            <span><strong className="text-ink">College Scorecard</strong> — enrollment, acceptance rate, growth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-good" />
            <span><strong className="text-ink">Google News RSS</strong> — demand signal headlines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-good" />
            <span><strong className="text-ink">OpenStreetMap</strong> — apartment buildings near campus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-good" />
            <span><strong className="text-ink">Wikipedia</strong> — university logos and seals</span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Appearance</SectionTitle>
        <Toggle label="Dark mode" desc="Warm dark ground with amber accents." on={dark} onChange={toggleDark} />
      </Card>
    </div>
  );
}

function Toggle({ label, desc, on, onChange, disabled }: { label: string; desc: string; on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${disabled ? "opacity-60" : ""}`}>
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-muted">{desc}</div>
      </div>
      <button onClick={disabled ? undefined : onChange} disabled={disabled}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{ background: on ? "var(--gold)" : "var(--line-strong)" }}>
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(20px)" : "none" }} />
      </button>
    </div>
  );
}

import type { GapResult, Verdict } from "@/lib/dev/gap";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/dev/types";
import { Card, SectionTitle, ProvenanceTag } from "./ui";

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string }> = {
  "under-supplied": { label: "Under-supplied", cls: "bg-good-soft text-good" },
  balanced: { label: "Balanced", cls: "bg-info-soft text-info" },
  "over-supplied": { label: "Over-supplied", cls: "bg-risk-soft text-risk" },
};

export function GapPanel({ gap }: { gap: GapResult }) {
  return (
    <Card>
      <SectionTitle
        sub="Recent permit supply by type vs modeled demand (ACS growth/vacancy/tenure + OSM built mix)"
        right={<ProvenanceTag p="estimated" note="Modeled from live permit, Census ACS and OSM inputs" />}
      >
        What&apos;s lacking here
      </SectionTitle>

      {!gap.available ? (
        <p className="text-sm text-muted">{gap.note}</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {gap.gaps.map((g) => {
              const v = VERDICT_STYLE[g.verdict];
              return (
                <div key={g.type} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLOR[g.type] }} />
                      {TYPE_LABEL[g.type]}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${v.cls}`}>{v.label}</span>
                  </div>
                  {/* supply vs demand mini-bars */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-2 w-12">supply</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, g.supplyShare * 100)}%`, background: "var(--muted)" }} />
                    </div>
                    <span className="text-[10px] num text-muted w-9 text-right">{Math.round(g.supplyShare * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-2 w-12">demand</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, g.demandShare * 100)}%`, background: TYPE_COLOR[g.type] }} />
                    </div>
                    <span className="text-[10px] num text-muted w-9 text-right">{Math.round(g.demandShare * 100)}%</span>
                  </div>
                  <p className="text-[11px] text-muted-2 leading-snug">{g.rationale}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted-2">
            Inputs: {gap.inputs.permitCount.toLocaleString()} permits ·{" "}
            {gap.inputs.demand.available
              ? `ACS pop ${gap.inputs.demand.population?.toLocaleString() ?? "n/a"}, ${gap.inputs.demand.vacancyPct?.toFixed(1) ?? "n/a"}% vacancy`
              : "ACS unavailable"}{" "}
            · {gap.inputs.landUse.available ? `${gap.inputs.landUse.total} OSM land-use features` : "OSM unavailable"}
          </div>
        </>
      )}
    </Card>
  );
}

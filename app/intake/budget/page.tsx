'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { ShieldCheck, Lightbulb } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const BUDGET_MARKS = [25000, 50000, 100000, 150000, 200000, 300000, 500000];
const MIN_VAL = 25000;
const MAX_VAL = 500000;

function formatBudget(val: number): string {
  if (val >= 500000) return "$500K+";
  if (val >= 1000) return `$${Math.round(val / 1000)}K`;
  return `$${val.toLocaleString()}`;
}

function valToPercent(val: number): number {
  return ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * 100;
}

function percentToVal(pct: number): number {
  const raw = MIN_VAL + (pct / 100) * (MAX_VAL - MIN_VAL);
  return Math.round(raw / 5000) * 5000;
}

export default function IntakeBudget() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const leftPct = valToPercent(formData.budgetMin);
  const rightPct = valToPercent(formData.budgetMax);

  const handlePointerDown = (thumb: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(thumb);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const val = percentToVal(pct);
      if (dragging === "min") {
        updateFormData({ budgetMin: Math.min(val, formData.budgetMax - 5000) });
      } else {
        updateFormData({ budgetMax: Math.max(val, formData.budgetMin + 5000) });
      }
    },
    [dragging, formData.budgetMin, formData.budgetMax, updateFormData]
  );

  const handlePointerUp = () => setDragging(null);

  const getScopeTip = () => {
    if (formData.scope.includes("kitchen"))
      return "Kitchen renovations in your area typically range from $45K\u2013$120K.";
    if (formData.scope.includes("bathroom"))
      return "Bathroom renovations in your area typically range from $25K\u2013$75K.";
    if (formData.scope.includes("full-gut"))
      return "Full gut renovations in your area typically range from $150K\u2013$400K.";
    return "Renovations vary widely by scope. Your budget helps us calibrate realistic expectations.";
  };

  return (
    <IntakeWizardShell
      currentStep={3}
      onNext={() => router.push("/intake/timeline")}
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        What&apos;s your renovation budget?
      </h2>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        This helps us calibrate cost estimates and contractor recommendations.
      </p>

      <label className="flex items-center gap-2.5 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.budgetUndecided}
          onChange={(e) => updateFormData({ budgetUndecided: e.target.checked })}
          className="w-4 h-4 rounded border-border text-[#1E3A5F] focus:ring-[#1E3A5F]"
        />
        <span className="text-sm text-foreground">I&apos;m still figuring out my budget</span>
      </label>

      {!formData.budgetUndecided && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <p className="text-xs text-muted-foreground text-center mb-1">Selected range</p>
          <p className="text-xl font-bold text-foreground text-center mb-5">
            {formatBudget(formData.budgetMin)} {'\u2013'} {formatBudget(formData.budgetMax)}
          </p>

          <div
            ref={trackRef}
            className="relative h-10 select-none touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-muted rounded-full" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
              style={{
                left: `${leftPct}%`,
                width: `${rightPct - leftPct}%`,
                background: "linear-gradient(90deg, #1E3A5F, #2BCBBA)",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-[#1E3A5F] shadow-md cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${leftPct}%` }}
              onPointerDown={handlePointerDown("min")}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-[#1E3A5F] shadow-md cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${rightPct}%` }}
              onPointerDown={handlePointerDown("max")}
            />
          </div>

          <div className="flex justify-between mt-1">
            {BUDGET_MARKS.map((m) => (
              <span key={m} className="text-[9px] text-muted-foreground">
                {formatBudget(m)}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
            <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground leading-relaxed">
              <span className="font-medium">Tip:</span> {getScopeTip()}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/40">
        <ShieldCheck size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
          Your budget is private and confidential. We will never share it with
          contractors, vendors, or any third party.
        </p>
      </div>
    </IntakeWizardShell>
  );
}

'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { Building2, Home, Building, Warehouse, HelpCircle } from "lucide-react";
import { useState } from "react";

const HOME_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building2, info: null },
  { value: "condo", label: "Condo", icon: Building, info: "A condo is a privately owned unit within a larger building or complex. Owners share common areas and pay HOA fees." },
  { value: "co-op", label: "Co-op", icon: Building, info: "A co-op (cooperative) means you own shares in a corporation that owns the building, not the unit itself. Renovations typically require board approval." },
  { value: "townhouse", label: "Townhouse", icon: Warehouse, info: null },
  { value: "single-family", label: "Single-Family House", icon: Home, info: null },
];

export default function IntakeHomeType() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();
  const [showInfo, setShowInfo] = useState<string | null>(null);

  return (
    <IntakeWizardShell
      currentStep={1}
      nextDisabled={!formData.homeType}
      onNext={() => router.push("/intake/scope")}
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        What type of home are you renovating?
      </h2>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        This helps us tailor your regulatory checklist and cost estimates.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {HOME_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.homeType === type.value;
          const isLastOdd =
            type.value === "single-family" && HOME_TYPES.length % 2 !== 0;

          return (
            <button
              key={type.value}
              onClick={() => updateFormData({ homeType: type.value })}
              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-sm"
                  : "border-border hover:border-[#1E3A5F]/30 bg-card"
              } ${isLastOdd ? "col-span-2" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1E3A5F] flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#1E3A5F]" />
              </div>
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                {type.label}
                {type.info && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(showInfo === type.value ? null : type.value);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle size={14} />
                  </button>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {showInfo && (
        <div className="mt-3 p-3 rounded-xl bg-[#1E3A5F]/5 border border-[#1E3A5F]/10">
          <p className="text-xs text-foreground leading-relaxed">
            {HOME_TYPES.find((t) => t.value === showInfo)?.info}
          </p>
        </div>
      )}
    </IntakeWizardShell>
  );
}

'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { Rocket, CalendarClock, CalendarDays, CalendarRange, Telescope } from "lucide-react";

const PROJECT_START_OPTIONS = [
  { value: "within-1-month", label: "Within 1 month", icon: Rocket },
  { value: "1-3-months", label: "1\u20133 months", icon: CalendarClock },
  { value: "3-6-months", label: "3\u20136 months", icon: CalendarDays },
  { value: "6-12-months", label: "6\u201312 months", icon: CalendarRange },
  { value: "exploring", label: "Just exploring", icon: Telescope },
];

const COMPLETION_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "3-months", label: "3 months" },
  { value: "6-months", label: "6 months" },
  { value: "9-months", label: "9 months" },
  { value: "12-months", label: "12 months" },
  { value: "flexible", label: "Flexible" },
];

export default function IntakeTimeline() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();

  return (
    <IntakeWizardShell
      currentStep={4}
      nextDisabled={!formData.projectStart || !formData.completionTimeline}
      onNext={() => router.push("/intake/location")}
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        When do you want to start?
      </h2>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        We&apos;ll match you with contractors available in your timeframe.
      </p>

      <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
        Desired project start
      </h3>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {PROJECT_START_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.projectStart === option.value;
          const isLastOdd =
            option.value === "exploring" && PROJECT_START_OPTIONS.length % 2 !== 0;

          return (
            <button
              key={option.value}
              onClick={() => updateFormData({ projectStart: option.value })}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-[#1E3A5F] bg-[#1E3A5F]/5 dark:border-blue-400 dark:bg-blue-400/10"
                  : "border-border hover:border-[#1E3A5F]/30 bg-card"
              } ${isLastOdd ? "col-span-2" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1E3A5F] dark:bg-blue-400 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-[#1E3A5F] dark:text-blue-300" />
              </div>
              <span className="text-sm font-medium text-foreground">{option.label}</span>
            </button>
          );
        })}
      </div>

      <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
        Desired completion timeline
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {COMPLETION_OPTIONS.map((option) => {
          const isSelected = formData.completionTimeline === option.value;
          return (
            <button
              key={option.value}
              onClick={() => updateFormData({ completionTimeline: option.value })}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? "border-[#1E3A5F] bg-[#1E3A5F] text-white dark:border-blue-400 dark:bg-blue-500"
                  : "border-border hover:border-[#1E3A5F]/30 bg-card text-foreground"
              }`}
            >
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </IntakeWizardShell>
  );
}

'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { label: "Home Type", path: "/intake/home-type" },
  { label: "Scope", path: "/intake/scope" },
  { label: "Budget", path: "/intake/budget" },
  { label: "Timeline", path: "/intake/timeline" },
  { label: "Location", path: "/intake/location" },
  { label: "Contact", path: "/intake/contact" },
  { label: "Review", path: "/intake/review" },
];

interface IntakeWizardShellProps {
  currentStep: number; // 1-based
  children: React.ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  hideNext?: boolean;
}

export default function IntakeWizardShell({
  currentStep,
  children,
  onNext,
  nextDisabled = false,
  nextLabel,
  hideNext = false,
}: IntakeWizardShellProps) {
  const router = useRouter();
  const stepIndex = currentStep - 1;
  const progressPercent = (currentStep / STEPS.length) * 100;

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(STEPS[stepIndex - 1].path);
    } else {
      router.push("/");
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (currentStep < STEPS.length) {
      router.push(STEPS[stepIndex + 1].path);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background relative shadow-xl">
      {/* Header — compressed */}
      <div className="px-5 pt-5 pb-1 text-center">
        <h1 className="text-lg font-bold text-[#1E3A5F]">
          Renovation Readiness Assessment
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          Personalized cost estimates, regulatory checklists, and risk assessment.
        </p>
      </div>

      {/* Progress — clean */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-[11px] font-semibold text-foreground">
            {STEPS[stepIndex].label}
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #1E3A5F, #2BCBBA)",
            }}
          />
        </div>
      </div>

      {/* Content with fade-in */}
      <div className="flex-1 px-5 py-4 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">{children}</div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between bg-background">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        {!hideNext && (
          <Button
            onClick={handleNext}
            disabled={nextDisabled}
            className="bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm h-11 px-8 rounded-xl"
            data-testid="button-next"
          >
            {nextLabel || "Next"} <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

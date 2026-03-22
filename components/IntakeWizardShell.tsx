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
      router.push("/dashboard");
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1
          className="text-lg font-bold text-[#1E3A5F] dark:text-blue-300 text-center"
          data-testid="text-wizard-title"
        >
          Renovation Readiness Assessment
        </h1>
        <p className="text-xs text-muted-foreground text-center mt-1 leading-relaxed max-w-[300px] mx-auto">
          Answer a few questions and get a personalized readiness report with
          cost estimates, regulatory checklists, and risk assessment.
        </p>
      </div>

      {/* Progress */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-xs font-medium text-foreground">
            {STEPS[stepIndex].label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #1E3A5F, #2BCBBA)",
            }}
          />
        </div>
        {/* Step labels */}
        <div className="flex justify-between mt-2.5 overflow-x-auto gap-0.5">
          {STEPS.map((step, i) => (
            <button
              key={step.label}
              className={`text-[10px] whitespace-nowrap transition-colors ${
                i < currentStep
                  ? "text-[#1E3A5F] dark:text-blue-300 font-medium"
                  : i === stepIndex
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground/50"
              }`}
              onClick={() => {
                if (i < currentStep) router.push(step.path);
              }}
              disabled={i >= currentStep}
              data-testid={`step-label-${step.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">{children}</div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between bg-background">
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
            className="bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-medium text-sm px-5 h-10 rounded-xl flex items-center gap-1.5"
            data-testid="button-next"
          >
            {nextLabel || "Next"}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

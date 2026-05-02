'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { IntakeFormData } from "@/context/IntakeWizardContext";

const SCOPE_LABELS: Record<string, string> = {
  kitchen: "Kitchen", bathroom: "Bathroom", "full-gut": "Full Gut Renovation",
  addition: "Addition / Extension", electrical: "Electrical", plumbing: "Plumbing",
  hvac: "HVAC", flooring: "Flooring", painting: "Painting",
  structural: "Structural", "windows-doors": "Windows / Doors", roofing: "Roofing",
};

const HOME_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment", condo: "Condo", "co-op": "Co-op",
  townhouse: "Townhouse", "single-family": "Single-Family House",
};

const START_LABELS: Record<string, string> = {
  "within-1-month": "Within 1 month", "1-3-months": "1\u20133 months",
  "3-6-months": "3\u20136 months", "6-12-months": "6\u201312 months",
  exploring: "Just exploring",
};

const COMPLETION_LABELS: Record<string, string> = {
  asap: "ASAP", "3-months": "3 months", "6-months": "6 months",
  "9-months": "9 months", "12-months": "12 months", flexible: "Flexible",
};

function formatBudget(val: number): string {
  if (val >= 500000) return "$500,000+";
  return `$${val.toLocaleString()}`;
}

function mapFormToBackend(formData: IntakeFormData) {
  return {
    homeType: formData.homeType,
    project_type: formData.homeType,
    scope: formData.scope,
    renovationScope: formData.scope,
    budgetRange: formData.budgetUndecided
      ? null
      : { min: formData.budgetMin, max: formData.budgetMax },
    budget: formData.budgetUndecided
      ? "undecided"
      : `${formData.budgetMin}-${formData.budgetMax}`,
    projectStart: formData.projectStart,
    timeline: formData.projectStart,
    completionTimeline: formData.completionTimeline,
    propertyAddress: formData.propertyAddress,
    zipCode: formData.zipCode,
    contactName: formData.fullName,
    contactEmail: formData.email,
    contactPhone: formData.phone || null,
    email: formData.email,
    phone: formData.phone || null,
    additionalNotes: formData.scopeNotes || null,
    description: formData.scopeNotes || null,
  };
}

export default function IntakeReview() {
  const router = useRouter();
  const { formData, clearDraft } = useIntakeWizard();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
      const apiUrl = "/api/backend";
      const body = mapFormToBackend(formData);

      const res = await fetch(`${apiUrl}/v1/readiness-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const reportId = data.id || data.report_id;

      // Store auth token — this is the user's real identity
      if (data.access_token) {
        localStorage.setItem("parapet_token", data.access_token);
      }

      if (!reportId) {
        throw new Error("No report ID in response");
      }

      // Successful submit — drop the draft on both server and sessionStorage
      // so the next intake starts from a clean slate.
      clearDraft();

      router.push(`/intake/generating?id=${reportId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  };

  const sections = [
    {
      label: "Home Type",
      value: HOME_TYPE_LABELS[formData.homeType] || formData.homeType || "Not selected",
      editPath: "/intake/home-type",
    },
    {
      label: "Renovation Scope",
      value: formData.scope.length > 0
        ? formData.scope.map((s) => SCOPE_LABELS[s] || s).join(", ")
        : "Not selected",
      editPath: "/intake/scope",
    },
    {
      label: "Budget",
      value: formData.budgetUndecided
        ? "Still figuring out"
        : `${formatBudget(formData.budgetMin)} \u2013 ${formatBudget(formData.budgetMax)}`,
      editPath: "/intake/budget",
    },
    {
      label: "Timeline",
      value: `Start: ${START_LABELS[formData.projectStart] || "Not selected"} | Completion: ${COMPLETION_LABELS[formData.completionTimeline] || "Not selected"}`,
      editPath: "/intake/timeline",
    },
    {
      label: "Location",
      value: formData.propertyAddress && formData.zipCode
        ? `${formData.propertyAddress}, ${formData.zipCode}`
        : "Not provided",
      editPath: "/intake/location",
    },
    {
      label: "Contact",
      value: formData.fullName
        ? `${formData.fullName} (${formData.email})${formData.phone ? `, ${formData.phone}` : ""}`
        : "Not provided",
      editPath: "/intake/contact",
    },
  ];

  return (
    <IntakeWizardShell currentStep={7} hideNext>
      <h2 className="text-base font-semibold text-foreground mb-1">
        Review your information
      </h2>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        Make sure everything looks correct before generating your report.
      </p>

      <div className="space-y-0">
        {sections.map((section) => (
          <div
            key={section.label}
            className="flex items-start justify-between py-3.5 border-b border-border/40 last:border-b-0"
          >
            <div className="flex-1 pr-3">
              <p className="text-xs font-semibold text-foreground mb-0.5">{section.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{section.value}</p>
            </div>
            <button
              onClick={() => router.push(section.editPath)}
              className="text-xs font-semibold text-[#2BCBBA] hover:text-[#1E3A5F] flex items-center gap-1.5 flex-shrink-0 mt-0.5 transition-colors px-2 py-1 rounded-lg hover:bg-[#1E3A5F]/5"
            >
              <Pencil size={12} />
              Edit
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full h-12 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate My Readiness Report
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Takes about 30 seconds. No credit card required.
      </p>

      <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
        By submitting, you agree to our{" "}
        <a
          href="/terms?from=intake"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy?from=intake"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Privacy Policy
        </a>
        .
      </p>
    </IntakeWizardShell>
  );
}

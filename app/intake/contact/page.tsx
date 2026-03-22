'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function IntakeContact() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isValid =
    formData.fullName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    emailValid;
  const showEmailError = emailTouched && formData.email.length > 0 && !emailValid;

  return (
    <IntakeWizardShell
      currentStep={6}
      nextDisabled={!isValid}
      onNext={() => router.push("/intake/review")}
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        How should we send your report?
      </h2>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        We&apos;ll email your Readiness Report as soon as it&apos;s ready — usually within 2 minutes.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="Your full name"
            autoComplete="name"
            className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            placeholder="you@email.com"
            autoComplete="email"
            className={`w-full h-11 px-3.5 text-sm rounded-xl border bg-card text-foreground focus:outline-none focus:ring-2 placeholder:text-muted-foreground/50 ${
              showEmailError
                ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                : "border-border focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            }`}
          />
          {showEmailError && (
            <p className="text-[11px] text-red-500 mt-1">Please enter a valid email address</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
            Phone <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="(555) 000-0000"
            autoComplete="tel"
            className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/40">
        <ShieldCheck size={14} className="text-[#10B981] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          We&apos;ll only use this to deliver your report. No spam, ever.
        </p>
      </div>
    </IntakeWizardShell>
  );
}

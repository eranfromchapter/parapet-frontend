'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { MapPin } from "lucide-react";

export default function IntakeLocation() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();

  const isValid = formData.propertyAddress.trim().length > 0 && formData.zipCode.trim().length >= 5;

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      updateFormData({ propertyAddress: "Current Location", zipCode: "10001" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        updateFormData({ propertyAddress: "Current Location", zipCode: "10001" });
      },
      () => {
        updateFormData({ propertyAddress: "Current Location", zipCode: "10001" });
      }
    );
  };

  return (
    <IntakeWizardShell
      currentStep={5}
      nextDisabled={!isValid}
      onNext={() => router.push("/intake/contact")}
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        Where is your property?
      </h2>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        We use this to determine permit requirements and local pricing.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            Property address
          </label>
          <input
            type="text"
            value={formData.propertyAddress}
            onChange={(e) => updateFormData({ propertyAddress: e.target.value })}
            placeholder="e.g. 422 West Ave NY NY"
            className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] dark:focus:ring-blue-400/20 dark:focus:border-blue-400 placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            ZIP code
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 5);
              updateFormData({ zipCode: val });
            }}
            placeholder="e.g. 10022"
            className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] dark:focus:ring-blue-400/20 dark:focus:border-blue-400 placeholder:text-muted-foreground/50"
          />
        </div>

        <button
          onClick={handleUseLocation}
          className="flex items-center gap-2 text-sm text-[#2BCBBA] hover:text-[#1E3A5F] dark:hover:text-blue-300 transition-colors"
        >
          <MapPin size={14} />
          Use my current location
        </button>
      </div>
    </IntakeWizardShell>
  );
}

'use client';

import { useRouter } from "next/navigation";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { MapPin } from "lucide-react";
import { useState } from "react";

export default function IntakeLocation() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();
  const [zipTouched, setZipTouched] = useState(false);

  const isValid = formData.propertyAddress.trim().length > 0 && formData.zipCode.trim().length >= 5;
  const showZipError = zipTouched && formData.zipCode.length > 0 && formData.zipCode.length < 5;

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
            autoComplete="street-address"
            className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            ZIP code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={formData.zipCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 5);
              updateFormData({ zipCode: val });
            }}
            onBlur={() => setZipTouched(true)}
            placeholder="e.g. 10022"
            autoComplete="postal-code"
            className={`w-full h-11 px-3.5 text-sm rounded-xl border bg-card text-foreground focus:outline-none focus:ring-2 placeholder:text-muted-foreground/50 ${
              showZipError
                ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                : "border-border focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            }`}
          />
          {showZipError && (
            <p className="text-[11px] text-red-500 mt-1">Please enter a valid 5-digit ZIP code</p>
          )}
        </div>

        <button
          onClick={handleUseLocation}
          className="flex items-center gap-2 text-sm text-[#2BCBBA] hover:text-[#1E3A5F] transition-colors"
        >
          <MapPin size={14} />
          Use my current location
        </button>
      </div>
    </IntakeWizardShell>
  );
}

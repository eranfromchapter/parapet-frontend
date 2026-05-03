'use client';

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useIntakeWizard } from "@/context/IntakeWizardContext";
import IntakeWizardShell from "@/components/IntakeWizardShell";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import {
  ChefHat, Bath, Hammer, PlusSquare, Zap, Droplets,
  Wind, Layers, Paintbrush, Columns3, DoorOpen, Home,
  Mic, MicOff,
} from "lucide-react";

const SCOPE_OPTIONS = [
  { value: "kitchen", label: "Kitchen", icon: ChefHat },
  { value: "bathroom", label: "Bathroom", icon: Bath },
  { value: "full-gut", label: "Full Gut Renovation", icon: Hammer },
  { value: "addition", label: "Addition / Extension", icon: PlusSquare },
  { value: "electrical", label: "Electrical", icon: Zap },
  { value: "plumbing", label: "Plumbing", icon: Droplets },
  { value: "hvac", label: "HVAC", icon: Wind },
  { value: "flooring", label: "Flooring", icon: Layers },
  { value: "painting", label: "Painting", icon: Paintbrush },
  { value: "structural", label: "Structural", icon: Columns3 },
  { value: "windows-doors", label: "Windows / Doors", icon: DoorOpen },
  { value: "roofing", label: "Roofing", icon: Home },
];

function ScopeNotesWithVoice({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  const valueRef = useRef(value);
  valueRef.current = value;
  // Track how much of the hook's running transcript has already been folded
  // into the form value so a long dictation appends incrementally instead
  // of duplicating the whole thing on each onresult.
  const consumedRef = useRef("");

  // Append newly-finalized transcript chunks to the form value.
  useEffect(() => {
    if (!transcript) return;
    const newPortion = transcript.startsWith(consumedRef.current)
      ? transcript.slice(consumedRef.current.length)
      : transcript;
    consumedRef.current = transcript;
    const trimmed = newPortion.trim();
    if (!trimmed) return;
    const sep = valueRef.current.trim() ? " " : "";
    onChange((valueRef.current + sep + trimmed).slice(0, 500));
  }, [transcript, onChange]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    consumedRef.current = "";
    resetTranscript();
    startListening();
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          Anything else we should know about your project?
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        {speechSupported && (
          <button
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 ${
              isListening
                ? "bg-red-500/10 text-red-600 border border-red-500/30"
                : "bg-[#1E3A5F]/5 text-[#1E3A5F] border border-[#1E3A5F]/20"
            }`}
          >
            {isListening ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <MicOff size={10} className="relative" />
                </span>
                Stop
              </>
            ) : (
              <>
                <Mic size={10} />
                Speak
              </>
            )}
          </button>
        )}
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => { if (e.target.value.length <= 500) onChange(e.target.value); }}
          placeholder="Describe any additional details about your renovation..."
          className={`w-full h-24 p-3 text-xs rounded-xl border bg-card text-foreground resize-none focus:outline-none focus:ring-2 placeholder:text-muted-foreground/50 transition-colors ${
            isListening
              ? "border-red-500/40 focus:ring-red-500/20 bg-red-50/30"
              : "border-border focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
          }`}
        />
        <div className="absolute bottom-2 right-3 flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-medium text-red-600">Listening...</span>
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{value.length}/500</span>
        </div>
      </div>
      {(isListening || interimTranscript) && interimTranscript && (
        <p className="mt-1.5 text-[11px] italic text-muted-foreground/80 leading-snug">
          {interimTranscript}
        </p>
      )}
    </div>
  );
}

export default function IntakeScope() {
  const router = useRouter();
  const { formData, updateFormData } = useIntakeWizard();

  const toggleScope = (value: string) => {
    const current = formData.scope;
    const updated = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value];
    updateFormData({ scope: updated });
  };

  return (
    <IntakeWizardShell
      currentStep={2}
      nextDisabled={formData.scope.length === 0}
      onNext={() => router.push("/intake/budget")}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-foreground">
          What are you renovating?
        </h2>
        {formData.scope.length > 0 && (
          <span className="text-xs font-medium text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded-full">
            {formData.scope.length} selected
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Select all areas that apply. You can choose multiple.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {SCOPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.scope.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => toggleScope(option.value)}
              className={`relative flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-sm"
                  : "border-border hover:border-[#1E3A5F]/30 bg-card"
              }`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#1E3A5F] flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                <Icon size={16} className="text-[#1E3A5F]" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <ScopeNotesWithVoice
        value={formData.scopeNotes}
        onChange={(val: string) => updateFormData({ scopeNotes: val })}
      />
    </IntakeWizardShell>
  );
}

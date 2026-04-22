'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

export interface IntakeFormData {
  homeType: string;
  scope: string[];
  scopeNotes: string;
  budgetMin: number;
  budgetMax: number;
  budgetUndecided: boolean;
  projectStart: string;
  completionTimeline: string;
  propertyAddress: string;
  zipCode: string;
  fullName: string;
  email: string;
  phone: string;
}

const defaultFormData: IntakeFormData = {
  homeType: "",
  scope: [],
  scopeNotes: "",
  budgetMin: 100000,
  budgetMax: 200000,
  budgetUndecided: false,
  projectStart: "",
  completionTimeline: "",
  propertyAddress: "",
  zipCode: "",
  fullName: "",
  email: "",
  phone: "",
};

// Persisted across navigation to /terms, /privacy, and browser back — survives
// unmount of the intake layout without leaking across full session restarts.
const STORAGE_KEY = "parapet_intake_formdata";

interface IntakeWizardContextType {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
  resetFormData: () => void;
}

const IntakeWizardContext = createContext<IntakeWizardContextType | null>(null);

function loadInitialFormData(): IntakeFormData {
  if (typeof window === "undefined") return defaultFormData;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFormData;
    const parsed = JSON.parse(raw) as Partial<IntakeFormData>;
    return { ...defaultFormData, ...parsed };
  } catch {
    return defaultFormData;
  }
}

export function IntakeWizardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<IntakeFormData>(defaultFormData);
  const hydratedRef = useRef(false);

  // Hydrate from sessionStorage on mount (client-only to avoid SSR mismatch)
  useEffect(() => {
    setFormData(loadInitialFormData());
    hydratedRef.current = true;
  }, []);

  // Persist after hydration so we don't clobber saved state with defaults on first render
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      /* quota / disabled storage — tolerate silently */
    }
  }, [formData]);

  const updateFormData = useCallback((updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(defaultFormData);
    if (typeof window !== "undefined") {
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  return (
    <IntakeWizardContext.Provider value={{ formData, updateFormData, resetFormData }}>
      {children}
    </IntakeWizardContext.Provider>
  );
}

export function useIntakeWizard() {
  const context = useContext(IntakeWizardContext);
  if (!context) {
    throw new Error("useIntakeWizard must be used within IntakeWizardProvider");
  }
  return context;
}

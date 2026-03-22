'use client';

import { createContext, useContext, useState, useCallback } from "react";

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

interface IntakeWizardContextType {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
  resetFormData: () => void;
}

const IntakeWizardContext = createContext<IntakeWizardContextType | null>(null);

export function IntakeWizardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<IntakeFormData>(defaultFormData);

  const updateFormData = useCallback((updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(defaultFormData);
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

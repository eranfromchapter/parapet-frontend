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

// Pull stored profile (returning user) and prefill the intake fields the
// user already filled in once. Day 44 round-3 user feedback: "I had to
// re-enter some information like name and address, which should not be
// necessary." Returning users now land on /intake/contact pre-populated.
async function fetchProfilePrefill(): Promise<Partial<IntakeFormData>> {
  if (typeof window === "undefined") return {};
  let token: string | null = null;
  try {
    token = window.localStorage.getItem("parapet_token");
  } catch {
    return {};
  }
  if (!token) return {};
  try {
    const res = await fetch("/api/backend/v1/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
    const addr = data.address || {};
    const propertyAddress = [addr.street, addr.city, addr.state]
      .filter(Boolean)
      .join(", ")
      .trim();
    const out: Partial<IntakeFormData> = {};
    if (fullName) out.fullName = fullName;
    if (typeof data.email === "string" && data.email) out.email = data.email;
    if (typeof data.phone === "string" && data.phone) out.phone = data.phone;
    if (propertyAddress) out.propertyAddress = propertyAddress;
    if (typeof addr.postal_code === "string" && addr.postal_code) out.zipCode = addr.postal_code;
    return out;
  } catch {
    return {};
  }
}

export function IntakeWizardProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<IntakeFormData>(defaultFormData);
  const hydratedRef = useRef(false);

  // Hydrate from sessionStorage on mount (client-only to avoid SSR mismatch).
  // Then merge profile-prefill for returning users — only fills empty fields,
  // never overwrites in-progress edits.
  useEffect(() => {
    const fromStorage = loadInitialFormData();
    setFormData(fromStorage);
    hydratedRef.current = true;

    fetchProfilePrefill().then((prefill) => {
      if (!prefill || Object.keys(prefill).length === 0) return;
      setFormData((current) => {
        const next = { ...current };
        // Only fill fields the user hasn't already entered. We treat
        // empty string / 0-length array as "unfilled".
        for (const [k, v] of Object.entries(prefill) as [keyof IntakeFormData, unknown][]) {
          const existing = current[k];
          const isEmpty =
            existing == null ||
            existing === "" ||
            (Array.isArray(existing) && existing.length === 0);
          if (isEmpty && v != null && v !== "") {
            (next as Record<string, unknown>)[k] = v;
          }
        }
        return next;
      });
    });
  }, []);

  // Persist after hydration — debounced 300ms so rapid keystrokes don't
  // trigger synchronous JSON.stringify + storage write on every character.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch {
        /* quota / disabled storage — tolerate silently */
      }
    }, 300);
    return () => clearTimeout(t);
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

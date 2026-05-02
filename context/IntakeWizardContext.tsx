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

interface StoredDraft {
  data: IntakeFormData;
  step: number;
  completedSteps: number[];
  updatedAt: number; // ms since epoch — local clock
}

interface IntakeWizardContextType {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
  resetFormData: () => void;
  step: number;
  completedSteps: number[];
  markStepComplete: (step: number) => void;
  clearDraft: () => Promise<void>;
}

const IntakeWizardContext = createContext<IntakeWizardContextType | null>(null);

function readSessionDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // New shape: { data, step, completedSteps, updatedAt }
    if (parsed && typeof parsed === "object" && parsed.data && typeof parsed.data === "object") {
      return {
        data: { ...defaultFormData, ...parsed.data },
        step: typeof parsed.step === "number" ? parsed.step : 1,
        completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      };
    }
    // Legacy shape: just IntakeFormData written directly under the same key
    if (parsed && typeof parsed === "object") {
      return {
        data: { ...defaultFormData, ...(parsed as Partial<IntakeFormData>) },
        step: 1,
        completedSteps: [],
        updatedAt: 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeSessionDraft(draft: StoredDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota / disabled storage — tolerate silently */
  }
}

function loadInitialFormData(): IntakeFormData {
  return readSessionDraft()?.data ?? defaultFormData;
}

function loadInitialStep(): number {
  return readSessionDraft()?.step ?? 1;
}

function loadInitialCompleted(): number[] {
  return readSessionDraft()?.completedSteps ?? [];
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const token = window.localStorage.getItem("parapet_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// Pull stored profile (returning user) and prefill the intake fields the
// user already filled in once. Day 44 round-3 user feedback: "I had to
// re-enter some information like name and address, which should not be
// necessary." Returning users now land on /intake/contact pre-populated.
async function fetchProfilePrefill(): Promise<Partial<IntakeFormData>> {
  if (typeof window === "undefined") return {};
  const headers = authHeaders();
  if (!headers.Authorization) return {};
  try {
    const res = await fetch("/api/backend/v1/users/profile", { headers });
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

interface ServerDraft {
  step?: number;
  data?: Partial<IntakeFormData>;
  completed_steps?: number[];
  updated_at?: string | number;
}

function parseServerTimestamp(v: ServerDraft["updated_at"]): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

// Returns the server draft only if it's strictly newer than the local one.
// Returns null on 404, no auth, or a network error — caller keeps local data.
async function fetchServerDraftIfNewer(localUpdatedAt: number): Promise<StoredDraft | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/backend/v1/intake/draft", { headers: authHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const body = (await res.json()) as ServerDraft;
    const serverUpdatedAt = parseServerTimestamp(body.updated_at);
    if (serverUpdatedAt <= localUpdatedAt) return null;
    return {
      data: { ...defaultFormData, ...(body.data ?? {}) },
      step: typeof body.step === "number" ? body.step : 1,
      completedSteps: Array.isArray(body.completed_steps) ? body.completed_steps : [],
      updatedAt: serverUpdatedAt,
    };
  } catch {
    return null;
  }
}

function putServerDraft(payload: { step: number; data: IntakeFormData; completed_steps: number[] }) {
  if (typeof window === "undefined") return;
  // Fire-and-forget — must not block the UI flow.
  fetch("/api/backend/v1/intake/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }).catch((e) => {
    console.warn("Draft autosave failed, sessionStorage still has data:", e);
  });
}

async function deleteServerDraft(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/backend/v1/intake/draft", {
      method: "DELETE",
      headers: authHeaders(),
    });
  } catch {
    /* network / not-authed — local clear still proceeds */
  }
}

export function IntakeWizardProvider({ children }: { children: React.ReactNode }) {
  // Synchronous hydration in the initial state — eliminates the one-frame
  // flash of default values that occurred when the user navigated back from
  // /terms or /privacy and the layout re-mounted. The window guard keeps
  // SSR safe (server returns defaults; client reads sessionStorage on the
  // very first render).
  const [formData, setFormData] = useState<IntakeFormData>(loadInitialFormData);
  const [step, setStep] = useState<number>(loadInitialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>(loadInitialCompleted);
  const hydratedRef = useRef(true);
  // Track the local "last edit" timestamp so we can compare against the
  // server draft and pick the newer one.
  const localUpdatedAtRef = useRef<number>(readSessionDraft()?.updatedAt ?? 0);

  // Server-draft restore — runs once on mount. If the server has a draft
  // newer than what we hydrated synchronously from sessionStorage, replace
  // local state with it and rewrite sessionStorage to match.
  useEffect(() => {
    let cancelled = false;
    fetchServerDraftIfNewer(localUpdatedAtRef.current).then((server) => {
      if (cancelled || !server) return;
      setFormData(server.data);
      setStep(server.step);
      setCompletedSteps(server.completedSteps);
      localUpdatedAtRef.current = server.updatedAt;
      writeSessionDraft(server);
    });
    return () => { cancelled = true; };
  }, []);

  // Profile-prefill for returning users — async, so it stays in an effect.
  // Only fills empty fields and never overwrites in-progress edits.
  useEffect(() => {
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
      const ts = Date.now();
      localUpdatedAtRef.current = ts;
      writeSessionDraft({ data: formData, step, completedSteps, updatedAt: ts });
    }, 300);
    return () => clearTimeout(t);
  }, [formData, step, completedSteps]);

  const updateFormData = useCallback((updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Called on Next-button taps from the shell. Records the step the user
  // just finished, advances `step` to the next one, and fires a draft save
  // to the server. Fire-and-forget — the UI advances regardless.
  const markStepComplete = useCallback((completedStep: number) => {
    const nextStep = Math.max(step, completedStep + 1);
    const nextCompleted = completedSteps.includes(completedStep)
      ? completedSteps
      : [...completedSteps, completedStep];
    setStep(nextStep);
    setCompletedSteps(nextCompleted);
    putServerDraft({ step: nextStep, data: formData, completed_steps: nextCompleted });
  }, [formData, step, completedSteps]);

  const resetFormData = useCallback(() => {
    setFormData(defaultFormData);
    setStep(1);
    setCompletedSteps([]);
    localUpdatedAtRef.current = 0;
    if (typeof window !== "undefined") {
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  const clearDraft = useCallback(async () => {
    setFormData(defaultFormData);
    setStep(1);
    setCompletedSteps([]);
    localUpdatedAtRef.current = 0;
    if (typeof window !== "undefined") {
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
    }
    await deleteServerDraft();
  }, []);

  return (
    <IntakeWizardContext.Provider
      value={{
        formData,
        updateFormData,
        resetFormData,
        step,
        completedSteps,
        markStepComplete,
        clearDraft,
      }}
    >
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

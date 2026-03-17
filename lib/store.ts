import { create } from 'zustand';

interface IntakeFormState {
  currentStep: number;
  homeType: string;
  renovationScope: string[];
  budgetRange: { min: number; max: number };
  budgetUndecided: boolean;
  timeline: { start: string; completion: string };
  zipCode: string;
  propertyAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  additionalNotes: string;
  setStep: (step: number) => void;
  setHomeType: (type: string) => void;
  toggleScope: (scope: string) => void;
  setBudgetRange: (range: { min: number; max: number }) => void;
  setBudgetUndecided: (undecided: boolean) => void;
  setTimeline: (timeline: { start: string; completion: string }) => void;
  setZipCode: (zip: string) => void;
  setPropertyAddress: (address: string) => void;
  setContactName: (name: string) => void;
  setContactEmail: (email: string) => void;
  setContactPhone: (phone: string) => void;
  setAdditionalNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  homeType: '',
  renovationScope: [] as string[],
  budgetRange: { min: 50000, max: 200000 },
  budgetUndecided: false,
  timeline: { start: '', completion: '' },
  zipCode: '',
  propertyAddress: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  additionalNotes: '',
};

export const useIntakeStore = create<IntakeFormState>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setHomeType: (type) => set({ homeType: type }),
  toggleScope: (scope) =>
    set((state) => ({
      renovationScope: state.renovationScope.includes(scope)
        ? state.renovationScope.filter((s) => s !== scope)
        : [...state.renovationScope, scope],
    })),
  setBudgetRange: (range) => set({ budgetRange: range }),
  setBudgetUndecided: (undecided) => set({ budgetUndecided: undecided }),
  setTimeline: (timeline) => set({ timeline }),
  setZipCode: (zip) => set({ zipCode: zip }),
  setPropertyAddress: (address) => set({ propertyAddress: address }),
  setContactName: (name) => set({ contactName: name }),
  setContactEmail: (email) => set({ contactEmail: email }),
  setContactPhone: (phone) => set({ contactPhone: phone }),
  setAdditionalNotes: (notes) => set({ additionalNotes: notes }),
  reset: () => set(initialState),
}));

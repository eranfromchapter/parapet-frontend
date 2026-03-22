'use client';

import { IntakeWizardProvider } from "@/context/IntakeWizardContext";

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <IntakeWizardProvider>
      {children}
    </IntakeWizardProvider>
  );
}

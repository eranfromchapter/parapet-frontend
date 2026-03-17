'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/readiness/progress-bar';
import { StepHomeType } from '@/components/readiness/step-home-type';
import { StepScope } from '@/components/readiness/step-scope';
import { StepBudget } from '@/components/readiness/step-budget';
import { StepTimeline } from '@/components/readiness/step-timeline';
import { StepLocation } from '@/components/readiness/step-location';
import { StepContact } from '@/components/readiness/step-contact';
import { StepReview } from '@/components/readiness/step-review';
import { useIntakeStore } from '@/lib/store';
import { api } from '@/lib/api-client';

const TOTAL_STEPS = 7;

export default function ReadinessPage() {
  const router = useRouter();
  const store = useIntakeStore();
  const { currentStep, setStep } = store;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!store.homeType;
      case 1: return store.renovationScope.length > 0;
      case 2: return store.budgetUndecided || (store.budgetRange.min > 0);
      case 3: return !!store.timeline.start && !!store.timeline.completion;
      case 4: return store.zipCode.length === 5;
      case 5: return !!store.contactName && !!store.contactEmail && store.contactEmail.includes('@');
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const data = {
        homeType: store.homeType,
        renovationScope: store.renovationScope,
        budgetRange: store.budgetUndecided ? { min: 0, max: 0 } : store.budgetRange,
        timeline: store.timeline,
        zipCode: store.zipCode,
        propertyAddress: store.propertyAddress || undefined,
        contactName: store.contactName,
        contactEmail: store.contactEmail,
        contactPhone: store.contactPhone || undefined,
        additionalNotes: store.additionalNotes || undefined,
      };
      const result = await api.createReadinessReport(data as unknown as Record<string, unknown>);
      store.reset();
      router.push(`/generating/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    <StepHomeType key="home" />,
    <StepScope key="scope" />,
    <StepBudget key="budget" />,
    <StepTimeline key="timeline" />,
    <StepLocation key="location" />,
    <StepContact key="contact" />,
    <StepReview key="review" onEditStep={setStep} />,
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Home className="h-6 w-6 text-navy" />
            <span className="text-xl font-bold text-navy">PARAPET</span>
          </Link>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Renovation Readiness Assessment</h1>
          <p className="mt-2 text-sm text-slate-500">
            Answer a few questions and get a personalized readiness report with cost estimates, regulatory checklists, and risk assessment.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <ProgressBar currentStep={currentStep} onStepClick={(s) => s < currentStep && setStep(s)} />

          <div className="mt-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {steps[currentStep]}
              </motion.div>
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            {currentStep < TOTAL_STEPS - 1 ? (
              <Button
                variant="gold"
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? 'Generating...' : 'Generate My Readiness Report'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {currentStep === TOTAL_STEPS - 1 && (
            <p className="mt-4 text-xs text-slate-400 text-center">
              By submitting, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

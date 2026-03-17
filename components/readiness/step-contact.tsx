'use client';

import React from 'react';
import { useIntakeStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StepContact() {
  const { contactName, setContactName, contactEmail, setContactEmail, contactPhone, setContactPhone } = useIntakeStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">How should we send your report?</h2>
        <p className="mt-1 text-sm text-slate-500">We&apos;ll email your Readiness Report as soon as it&apos;s ready — usually within 2 minutes.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Jane Smith"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="jane@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-slate-400">(optional)</span></Label>
          <Input
            id="phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        We&apos;ll only use this to deliver your report. No spam, ever.
      </p>
    </div>
  );
}

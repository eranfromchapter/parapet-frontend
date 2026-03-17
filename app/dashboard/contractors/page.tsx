'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVerifyContractor } from '@/lib/api';
import type { ContractorVerification } from '@/lib/types';

export default function ContractorsPage() {
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('NY');
  const [verifications, setVerifications] = useState<ContractorVerification[]>([]);

  const verifyMutation = useVerifyContractor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await verifyMutation.mutateAsync({
        contractor_name: name,
        license_number: license || undefined,
        phone: phone || undefined,
        email: email || undefined,
        state,
      });
      setVerifications((prev) => [result, ...prev]);
      setName('');
      setLicense('');
      setPhone('');
      setEmail('');
    } catch {
      alert('Verification failed. Please try again.');
    }
  };

  const getRiskColor = (level?: string) => {
    if (!level) return 'outline';
    if (level === 'LOW') return 'success' as const;
    if (level === 'MODERATE') return 'warning' as const;
    return 'danger' as const;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-navy">Verify a Contractor</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contractor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractor-name">Contractor Name *</Label>
                <Input
                  id="contractor-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ABC Construction LLC"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor-phone">Phone</Label>
                <Input
                  id="contractor-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor-email">Email</Label>
                <Input
                  id="contractor-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contractor@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
            </div>
            <Button type="submit" variant="gold" disabled={verifyMutation.isPending || !name}>
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Contractor'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {verifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Verification Results</h2>
          {verifications.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-navy">{v.contractor_name}</p>
                    {v.decision_brief && (
                      <p className="text-sm text-slate-500 mt-2">{v.decision_brief}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {v.composite_score !== undefined && (
                      <span className="text-2xl font-bold text-navy">{v.composite_score}/10</span>
                    )}
                    <Badge variant={getRiskColor(v.risk_level)}>
                      {v.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

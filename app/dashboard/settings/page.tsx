'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, CreditCard } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API_URL}/v1/users/profile`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) setProfile(await res.json());
      } catch { /* silently fail */ }
    }
    loadProfile();
  }, []);

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "User"
    : "Loading...";
  const displayEmail = profile?.email || "—";
  const tierLabel = profile?.tier_display_name || profile?.tier || "Free";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-navy">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-navy-50 flex items-center justify-center">
              <User className="h-8 w-8 text-navy" />
            </div>
            <div>
              <p className="font-semibold text-navy">{displayName}</p>
              <p className="text-sm text-slate-500">{displayEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Current Plan</p>
              <p className="text-sm text-slate-500">{tierLabel} tier</p>
            </div>
            <Badge>{tierLabel}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Notification preferences coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/auth';

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = '/api/backend';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }
  return res.json() as Promise<T>;
}

// Returned shapes are intentionally loose — the dashboard reads only a few
// fields and tolerates missing keys. Tightening these belongs in a wider
// API-types pass, not in this caching migration.
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useProfile() {
  return useQuery<any>({
    queryKey: ['users', 'profile'],
    queryFn: () => fetchJson('/v1/users/profile'),
    staleTime: 60_000,
  });
}

export function useReadinessReports() {
  return useQuery<any>({
    queryKey: ['readiness-reports'],
    queryFn: () => fetchJson('/v1/readiness-reports'),
    staleTime: 30_000,
  });
}

export function useReadinessReport(id: string | null | undefined) {
  return useQuery<any>({
    queryKey: ['readiness-reports', id],
    queryFn: () => fetchJson(`/v1/readiness-reports/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useWalkthroughs() {
  return useQuery<any>({
    queryKey: ['walkthroughs'],
    queryFn: () => fetchJson('/v1/walkthrough'),
    staleTime: 30_000,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = '/api/backend';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type EstimateState =
  | { kind: 'unauthorized' }
  | { kind: 'not-found' }
  | { kind: 'ok'; estimate: any };

// Wrapped fetch so the page can show distinct UIs for 401/403 and 404 without
// the query throwing into the error boundary for those expected cases.
async function fetchEstimate(id: string): Promise<EstimateState> {
  const res = await fetch(`${API_URL}/v1/estimates/${id}`, { headers: getAuthHeaders() });
  if (res.status === 401 || res.status === 403) return { kind: 'unauthorized' };
  if (res.status === 404) return { kind: 'not-found' };
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  const estimate = await res.json();
  return { kind: 'ok', estimate };
}

export function useEstimate(id: string | null | undefined) {
  return useQuery<EstimateState>({
    queryKey: ['estimate', id],
    queryFn: () => fetchEstimate(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

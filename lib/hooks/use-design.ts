'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = '/api/backend';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchJsonAllowingMissing<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }
  return res.json() as Promise<T>;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }
  return res.json() as Promise<T>;
}

// /v1/design/sessions/{projectId} — projectId is typically a spatial id but
// the page also tries the literal "default" as a fallback when no spatial id
// is on hand.
export function useDesignSessions(projectId: string | null) {
  return useQuery<any | null>({
    queryKey: ['design', 'sessions', projectId],
    queryFn: () => fetchJsonAllowingMissing(`/v1/design/sessions/${projectId}`),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useDesignSession(sessionId: string | null) {
  return useQuery<any>({
    queryKey: ['design', 'session', sessionId],
    queryFn: () => fetchJson(`/v1/design/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 30_000,
  });
}

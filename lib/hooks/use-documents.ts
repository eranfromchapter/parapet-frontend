'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = '/api/backend';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }
  return res.json() as Promise<T>;
}

export function useVault() {
  return useQuery<{ documents: any[] }>({
    queryKey: ['documents', 'vault'],
    queryFn: () => fetchJson('/v1/documents/vault'),
    staleTime: 30_000,
  });
}

export function useDocumentStats() {
  return useQuery<any>({
    queryKey: ['documents', 'stats'],
    queryFn: () => fetchJson('/v1/documents/stats'),
    staleTime: 30_000,
  });
}

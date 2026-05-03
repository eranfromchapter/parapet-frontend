'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = '/api/backend';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Photo {
  id: string;
  blob_url?: string;
  blobUrl?: string;
  room_label?: string;
  roomLabel?: string;
  filename?: string;
  original_filename?: string;
  created_at?: string;
  uploaded_at?: string;
}

async function fetchPhotos(): Promise<Photo[]> {
  const res = await fetch(`${API_URL}/v1/photos`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for /v1/photos`);
  }
  const data = await res.json().catch(() => ({}));
  if (Array.isArray(data)) return data as Photo[];
  if (Array.isArray(data?.photos)) return data.photos as Photo[];
  if (Array.isArray(data?.items)) return data.items as Photo[];
  return [];
}

export function usePhotos() {
  return useQuery<Photo[]>({
    queryKey: ['photos', 'list'],
    queryFn: fetchPhotos,
    staleTime: 30_000,
  });
}

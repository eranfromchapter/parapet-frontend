'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = '/api/backend';

interface UnreadResponse {
  unread_count?: number;
}

interface NotificationContextValue {
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue>({ unreadCount: 0 });

// Single global subscription. Mounted from app/providers.tsx so the underlying
// useQuery (and its refetchInterval) runs exactly once for the whole app —
// every BottomNav consumer reads the cached count instead of starting its own
// polling loop on mount.
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<UnreadResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },
    // Match the previous BottomNav cadence; refetchInterval respects window
    // focus by default so backgrounded tabs don't poll.
    refetchInterval: 60_000,
    staleTime: 30_000,
    // 401/403 etc. shouldn't blow up — the badge just stays at 0.
    retry: false,
  });

  const unreadCount = data?.unread_count ?? 0;

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useUnreadCount(): number {
  return useContext(NotificationContext).unreadCount;
}

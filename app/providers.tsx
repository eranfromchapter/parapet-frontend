'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/lib/AuthProvider';
import { AuthGuard } from '@/components/AuthGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthGuard>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

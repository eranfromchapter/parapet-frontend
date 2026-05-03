'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ParapetLogo from '@/components/ParapetLogo';
import { useAuth } from '@/lib/AuthProvider';

// Routes that render without a JWT. Anything not on this list is protected.
// /intake/* is included because the wizard IS the signup flow — submitting
// the readiness report is what creates the account and returns a JWT.
// /auth/* covers /auth/signin and /auth/register if they exist.
const PUBLIC_PATHS: string[] = [
  '/',
  '/login',
  '/terms',
  '/privacy',
  '/verify-email',
  '/support',
];

// /intake is the signup flow — submitting the readiness report mints the
// JWT — so the wizard must render without one. /auth covers the signin /
// register pages users land on before they have a token.
const PUBLIC_PREFIXES: string[] = [
  '/intake',
  '/auth',
];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return true;
  }
  return false;
}

function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (isPublic || isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isPublic, isLoading, isAuthenticated, router]);

  // Public routes always render — no spinner, no gate.
  if (isPublic) return <>{children}</>;
  // Protected route still resolving auth state — render the centered spinner.
  if (isLoading) return <CenteredSpinner />;
  // Protected route, no token — render nothing while the redirect-effect runs.
  if (!isAuthenticated) return <CenteredSpinner />;
  return <>{children}</>;
}

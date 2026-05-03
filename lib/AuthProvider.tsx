'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'parapet_token';

/* eslint-disable @typescript-eslint/no-explicit-any */
type JwtPayload = {
  sub?: string;
  email?: string;
  user_id?: string;
  exp?: number;
  iat?: number;
  [k: string]: any;
};

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: JwtPayload | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Pure base64url-decode — no external deps. Returns null on any malformed
// token rather than throwing, since we treat "can't decode" the same as
// "not authenticated" everywhere it matters.
function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) payload += '=';
    const json = atob(payload);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isPayloadExpired(payload: JwtPayload | null): boolean {
  if (!payload) return true;
  if (typeof payload.exp !== 'number') return false; // no exp claim → treat as non-expiring
  // exp is seconds since epoch; Date.now is ms.
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  // Start in loading=true so AuthGuard renders the spinner until we read
  // localStorage on mount; otherwise we'd flash a redirect-to-/login on
  // every refresh.
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount. If the token is expired or
  // malformed, drop it so we don't keep sending a dead Authorization header.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { stored = null; }
    if (!stored) {
      setIsLoading(false);
      return;
    }
    const payload = decodeJwt(stored);
    if (!payload || isPayloadExpired(payload)) {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setIsLoading(false);
      return;
    }
    setToken(stored);
    setUser(payload);
    setIsLoading(false);
  }, []);

  const login = useCallback((nextToken: string) => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(STORAGE_KEY, nextToken); } catch { /* quota / disabled */ }
    }
    const payload = decodeJwt(nextToken);
    setToken(nextToken);
    setUser(payload);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: !!token,
    isLoading,
    user,
    token,
    login,
    logout,
  }), [token, isLoading, user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}

'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

type ErrorState =
  | { kind: 'message'; text: string }
  | { kind: 'no_account' }
  | null;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/v1/auth/login-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.status === 404) {
        setError({ kind: 'no_account' });
        return;
      }
      if (res.status === 429) {
        setError({ kind: 'message', text: "Too many attempts. Please wait a moment." });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError({ kind: 'message', text: data?.detail || "Something went wrong. Please try again." });
        return;
      }

      const data = await res.json();
      if (!data?.access_token) {
        setError({ kind: 'message', text: "Login response missing token. Please try again." });
        return;
      }
      // AuthProvider owns the localStorage write + the in-memory state so
      // the rest of the app sees the new auth state immediately.
      login(data.access_token);
      router.push("/dashboard");
    } catch {
      setError({ kind: 'message', text: "Unable to connect. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
          <div className="flex flex-col items-center mb-8">
            <ParapetLogo size={48} className="text-[#1E3A5F] mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-1">Welcome to PARAPET</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email to sign in or create an account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-foreground mb-1.5 block">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-colors"
                />
              </div>
            </div>

            {error?.kind === 'message' && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-700">{error.text}</p>
              </div>
            )}

            {error?.kind === 'no_account' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-xs text-amber-900 leading-relaxed">
                  No account found. Start your first renovation assessment to create one.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/intake/home-type')}
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#2BCBBA] hover:bg-[#1E8A7E] text-white text-xs font-semibold transition-colors"
                >
                  Start renovation assessment <ArrowRight size={12} />
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#1E3A5F]/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <p className="mt-6 text-[11px] text-muted-foreground text-center leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <ArrowLeft size={12} />
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

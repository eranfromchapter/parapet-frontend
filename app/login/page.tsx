'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 404) {
          setError("No account found with this email. Complete a readiness report first to create your account.");
        } else {
          setError(data?.detail || "Something went wrong. Please try again.");
        }
        return;
      }

      const data = await res.json();

      // Store the JWT
      localStorage.setItem("parapet_token", data.access_token);

      // Go to dashboard
      router.push("/dashboard");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[340px]">
          <div className="flex flex-col items-center mb-8">
            <ParapetLogo size={48} className="text-[#1E3A5F] mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center">
              Sign in with the email you used for your readiness report.
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

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-700">{error}</p>
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
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Don&apos;t have an account yet?
            </p>
            <button
              onClick={() => router.push("/intake/home-type")}
              className="text-xs font-semibold text-[#2BCBBA] hover:text-[#1E3A5F] transition-colors"
            >
              Get your free readiness report &rarr;
            </button>
          </div>

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

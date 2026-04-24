'use client';

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const API_URL = "/api/backend";

type ErrorType = "expired" | "invalid" | "not_found" | "no_token";
type State = { kind: "verifying" } | { kind: "success" } | { kind: "error"; type: ErrorType };

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>({ kind: "verifying" });
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setState({ kind: "error", type: "no_token" });
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/v1/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("parapet_token", data.access_token);
          setState({ kind: "success" });
          setTimeout(() => router.push("/dashboard"), 3000);
          return;
        }

        if (res.status === 401) {
          const data = await res.json().catch(() => null);
          const detail: string = data?.detail ?? "";
          setState({
            kind: "error",
            type: detail.toLowerCase().includes("expired") ? "expired" : "invalid",
          });
          return;
        }

        if (res.status === 404) {
          setState({ kind: "error", type: "not_found" });
          return;
        }

        setState({ kind: "error", type: "invalid" });
      } catch {
        setState({ kind: "error", type: "invalid" });
      }
    })();
  }, [token, router]);

  const handleResend = async () => {
    setResending(true);
    try {
      const storedToken = localStorage.getItem("parapet_token");
      const headers: Record<string, string> = {};
      if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
      await fetch(`${API_URL}/v1/auth/resend-verification`, { headers });
      setResendDone(true);
    } catch {
      // silently ignore — user sees no feedback change
    } finally {
      setResending(false);
    }
  };

  if (state.kind === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <Loader2 size={40} className="animate-spin text-[#1E3A5F]" />
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 size={56} className="text-[#2BCBBA]" />
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">Email Verified!</h2>
          <p className="text-sm text-muted-foreground">
            Your PARAPET account is now verified. You&apos;re all set.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#1E3A5F]/20 mt-2"
        >
          Go to Dashboard
        </Button>
        <p className="text-xs text-muted-foreground">Redirecting in 3 seconds…</p>
      </div>
    );
  }

  const errorMap: Record<ErrorType, { heading: string; body: string }> = {
    expired: {
      heading: "Verification Link Expired",
      body: "This link has expired. Please request a new one.",
    },
    invalid: {
      heading: "Invalid Link",
      body: "This verification link is not valid.",
    },
    not_found: {
      heading: "Account Not Found",
      body: "We couldn’t find an account linked to this token.",
    },
    no_token: {
      heading: "Invalid Link",
      body: "No verification token was found in this link.",
    },
  };

  const { heading, body } = errorMap[state.type];

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <AlertTriangle size={56} className="text-red-500" />
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">{heading}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>

      <div className="w-full mt-2">
        {state.type === "expired" ? (
          <Button
            onClick={handleResend}
            disabled={resending || resendDone}
            className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#1E3A5F]/20"
          >
            {resending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : resendDone ? (
              "Email Sent!"
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        ) : state.type === "not_found" ? (
          <Button
            onClick={() => router.push("/intake/home-type")}
            className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#1E3A5F]/20"
          >
            Start New Project
          </Button>
        ) : (
          <Button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#1E3A5F]/20"
          >
            Go to Home
          </Button>
        )}
      </div>
    </div>
  );
}

const Spinner = (
  <div className="flex flex-col items-center gap-4 py-2">
    <Loader2 size={40} className="animate-spin text-[#1E3A5F]" />
    <p className="text-sm text-muted-foreground">Verifying your email...</p>
  </div>
);

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[430px]">
          <div className="flex justify-center mb-8">
            <ParapetLogo size={48} className="text-[#1E3A5F]" />
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <Suspense fallback={Spinner}>
              <VerifyEmailInner />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

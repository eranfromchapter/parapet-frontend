'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { isAuthenticated, getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

export default function LoginButton() {
  const router = useRouter();
  const [initials, setInitials] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    setAuthed(true);

    fetch(`${API_URL}/v1/users/profile`, { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(profile => {
        if (profile?.first_name) {
          const fi = profile.first_name[0] || "";
          const li = (profile.last_name || "")[0] || "";
          setInitials(`${fi}${li}`.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  if (authed && initials) {
    return (
      <button
        onClick={() => router.push("/dashboard")}
        className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label="Go to dashboard"
      >
        <span className="text-xs font-bold text-white">{initials}</span>
      </button>
    );
  }

  if (authed) {
    return (
      <button
        onClick={() => router.push("/dashboard")}
        className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label="Go to dashboard"
      >
        <User size={16} className="text-white" />
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/login")}
      className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
    >
      <User size={14} />
      <span>Sign In</span>
    </button>
  );
}

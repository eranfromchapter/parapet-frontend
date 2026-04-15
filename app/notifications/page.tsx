'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "report" | "estimate" | "design" | "gc_match" | "system";
  priority: "low" | "normal" | "high" | "critical";
  action_url: string;
  source: string;
  read: boolean;
  created_at: string;
}

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-[#EF4444]",
  high: "bg-[#F59E0B]",
  normal: "bg-[#10B981]",
  low: "bg-gray-300",
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type FilterKey = "all" | "unread" | "report" | "design" | "system";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "report", label: "Reports" },
  { key: "design", label: "Designs" },
  { key: "system", label: "System" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/notifications`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API_URL}/v1/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
    } catch { /* revert on error not critical */ }
  };

  const handleTap = async (n: Notification) => {
    if (!n.read) {
      // Optimistic
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
      fetch(`${API_URL}/v1/notifications/${n.id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      }).catch(() => {});
    }
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  const filtered = (() => {
    switch (filter) {
      case "unread": return notifications.filter(n => !n.read);
      case "report": return notifications.filter(n => n.type === "report" || n.type === "estimate");
      case "design": return notifications.filter(n => n.type === "design");
      case "system": return notifications.filter(n => n.type === "system" || n.type === "gc_match");
      default: return notifications;
    }
  })();

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Notifications" backPath="/dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
          <h1 className="text-lg font-bold text-foreground mb-2">Unable to load notifications</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A]">
            Retry
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Notifications" backPath="/dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Bell size={48} className="text-[#1E3A5F]/30 mb-4" />
          <h1 className="text-lg font-bold text-foreground mb-2">No Notifications Yet</h1>
          <p className="text-sm text-muted-foreground text-center">
            We&apos;ll notify you when your reports, designs, and estimates are ready.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        backPath="/dashboard"
        rightAction={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-[#1E3A5F]">
              <CheckCheck size={14} /> Mark All Read
            </button>
          ) : undefined
        }
      />

      {/* Filter pills */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-white border border-border/60 text-muted-foreground"
                }`}
              >
                {f.label}
                {f.key === "unread" && unreadCount > 0 && ` (${unreadCount})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell size={32} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications in this category.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const dot = PRIORITY_DOT[n.priority] ?? PRIORITY_DOT.low;
            return (
              <button
                key={n.id}
                onClick={() => handleTap(n)}
                className={`w-full text-left rounded-xl border p-3.5 transition-colors overflow-hidden ${
                  n.read
                    ? "bg-white border-border/50"
                    : "bg-slate-50 border-l-4 border-l-[#1E3A5F] border-t-border/50 border-r-border/50 border-b-border/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${n.read ? "font-medium text-foreground" : "font-semibold text-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-medium bg-[#F0F4F8] text-muted-foreground px-2 py-0.5 rounded-full">
                        {n.source}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}

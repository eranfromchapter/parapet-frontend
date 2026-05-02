'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";
import { useNotifications } from "@/lib/hooks/use-notifications";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

interface Notification {
  id: string;
  title: string;
  message: string;
  // Backend has used several aliases over time ("report", "readiness_report",
  // "readiness", "spatial", "capture"). Keep this loose and match by substring below.
  type: string;
  priority: "low" | "normal" | "high" | "critical";
  action_url: string;
  source: string;
  read: boolean;
  created_at: string;
  // Backend may include a typed entity id alongside action_url. Prefer these for
  // type-correct routing; fall back to action_url only when none are present.
  resource_id?: string;
  report_id?: string;
  estimate_id?: string;
  session_id?: string;
  metadata?: {
    report_id?: string;
    estimate_id?: string;
    session_id?: string;
    resource_id?: string;
  };
}

// Bare `/readiness` and anything under `/intake` are the 7-step intake wizard.
// Never send a tap there from a completion notification — that's the bug this
// resolver exists to prevent. Confirmed against real backend payloads: readiness
// completion notifications are shipped with `action_url: "/readiness"` and an
// EMPTY metadata object, so we cannot trust action_url for typed notifications.
function isIntakeWizardUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const path = url.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return path === "/readiness" || path === "" || path.startsWith("/intake");
}

// Pull an id out of strings like "/readiness/abc123", "/readiness?id=abc123",
// "?report_id=abc123", or "?id=abc123". Returns null if nothing id-shaped is present.
function extractIdFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const queryMatch = url.match(/[?&](?:id|report_id|estimate_id|session_id|resource_id)=([^&#]+)/);
  if (queryMatch) return decodeURIComponent(queryMatch[1]);
  const pathMatch = url.match(/\/(readiness|estimate|design(?:\/results)?|reports?|capture)\/([^/?#]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[2]);
  return null;
}

type Category = "readiness" | "estimate" | "design" | "spatial" | null;

function categoryOf(type: string | undefined): Category {
  const t = (type || "").toLowerCase();
  if (t.includes("estimate")) return "estimate";
  if (t.includes("readiness") || t.includes("report")) return "readiness";
  if (t.includes("design")) return "design";
  if (t.includes("spatial") || t.includes("capture")) return "spatial";
  return null;
}

// All routes from the alerts/notifications page tag the destination with
// ?from=alerts so the receiving page's back arrow returns the user to
// /notifications instead of the page's default entry point. Same pattern
// the document vault uses with from=vault.
function urlForCategory(cat: Category, id: string): string {
  switch (cat) {
    case "readiness": return `/readiness/${id}?from=alerts`;
    case "estimate": return `/estimate/${id}?from=alerts`;
    case "design": return `/design/results?session=${id}&from=alerts`;
    case "spatial": return id ? `/capture/${id}?from=alerts` : "/capture?from=alerts";
    default: return "/dashboard";
  }
}

// Synchronous attempt: look only at fields carried by the notification itself.
// Returns null when nothing id-like is present so the caller can fall back to
// a vault lookup. Order matters — estimate checked before readiness because
// "readiness_report" contains "report" too.
function resolveNotificationUrlSync(n: Notification): string | null {
  const meta = n.metadata ?? {};
  const cat = categoryOf(n.type);
  const resourceId = n.resource_id ?? meta.resource_id;
  const urlId = extractIdFromUrl(n.action_url);

  if (cat === "estimate") {
    const id = n.estimate_id ?? meta.estimate_id ?? resourceId ?? urlId;
    if (id) return urlForCategory(cat, id);
    return null;
  }
  if (cat === "readiness") {
    const id = n.report_id ?? meta.report_id ?? resourceId ?? urlId;
    if (id) return urlForCategory(cat, id);
    return null;
  }
  if (cat === "design") {
    const id = n.session_id ?? meta.session_id ?? resourceId ?? urlId;
    if (id) return urlForCategory(cat, id);
    return null;
  }
  if (cat === "spatial") return urlForCategory(cat, "");

  // Unknown type: trust action_url only if it isn't the intake wizard.
  if (n.action_url && !isIntakeWizardUrl(n.action_url)) return n.action_url;
  return "/dashboard";
}

// Map a notification category to the document-vault type it corresponds to.
// Vault types observed from /v1/documents/vault: "report", "design", "estimate",
// "spatial", "walkthrough".
function vaultTypeForCategory(cat: Category): string | null {
  if (cat === "readiness") return "report";
  if (cat === "estimate") return "estimate";
  if (cat === "design") return "design";
  if (cat === "spatial") return "spatial";
  return null;
}

interface VaultDoc {
  id: string;
  type: string;
  created_at?: string;
}

// Fallback path: backend currently ships completion notifications with no id
// and an empty metadata object (action_url is "/readiness", which IS the intake
// wizard). Look up the user's most recent matching document and route there.
async function resolveNotificationUrlViaVault(cat: Category): Promise<string> {
  const wantType = vaultTypeForCategory(cat);
  if (!wantType) return "/dashboard";
  try {
    const res = await fetch(`${API_URL}/v1/documents/vault`, { headers: getAuthHeaders() });
    if (!res.ok) return "/dashboard";
    const data = await res.json();
    const docs: VaultDoc[] = Array.isArray(data?.documents) ? data.documents : [];
    const matches = docs.filter((d) => d.type === wantType);
    if (matches.length === 0) return "/dashboard";
    matches.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
    return urlForCategory(cat, matches[0].id);
  } catch {
    return "/dashboard";
  }
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

interface NotificationsResponse {
  notifications: Notification[];
  unread_count?: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificationsQuery = useNotifications();
  const data = notificationsQuery.data as NotificationsResponse | undefined;
  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount: number = data?.unread_count ?? 0;
  const loading = notificationsQuery.isPending;
  const error = notificationsQuery.error instanceof Error ? notificationsQuery.error.message : null;
  const [filter, setFilter] = useState<FilterKey>("all");

  // Cache-aware patch helper — every read toggles below mutate the same key
  // so the BottomNav and any future readers stay in sync.
  const patchCache = (mut: (prev: NotificationsResponse) => NotificationsResponse) => {
    queryClient.setQueryData<NotificationsResponse>(['notifications', 'list'], (prev) => {
      if (!prev) return prev;
      return mut(prev);
    });
  };

  const markAllRead = async () => {
    patchCache((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      unread_count: 0,
    }));
    try {
      await fetch(`${API_URL}/v1/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
    } catch { /* revert on error not critical */ }
  };

  const handleTap = async (n: Notification) => {
    if (!n.read && n.id) {
      patchCache((prev) => ({
        ...prev,
        notifications: prev.notifications.map((x) => x.id === n.id ? { ...x, read: true } : x),
        unread_count: Math.max(0, (prev.unread_count ?? 0) - 1),
      }));
      fetch(`${API_URL}/v1/notifications/${n.id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      }).catch(() => {});
    }

    const cat = categoryOf(n.type);
    let target = resolveNotificationUrlSync(n);
    if (!target) {
      // Backend currently omits the id on completion notifications. Look up
      // the most recent matching document in the vault.
      target = await resolveNotificationUrlViaVault(cat);
    }

    router.push(target);
  };

  const filtered = (() => {
    const typeOf = (n: Notification) => (n.type || "").toLowerCase();
    switch (filter) {
      case "unread": return notifications.filter(n => !n.read);
      case "report": return notifications.filter(n => {
        const t = typeOf(n);
        return t.includes("report") || t.includes("readiness") || t.includes("estimate");
      });
      case "design": return notifications.filter(n => typeOf(n).includes("design"));
      case "system": return notifications.filter(n => {
        const t = typeOf(n);
        return t.includes("system") || t.includes("gc_match");
      });
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

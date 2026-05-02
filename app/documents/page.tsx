'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, ScanLine, Video, Palette, Calculator, FolderOpen,
  ChevronRight, Loader2, Trash2, Download,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

interface Document {
  id: string;
  type: "report" | "spatial" | "walkthrough" | "design" | "estimate";
  title: string;
  subtitle: string;
  status: string;
  created_at: string;
  source: string;
  icon: string;
  actions: string[];
  total_estimate?: number;
  // Backend (Day 44 archive-on-supersede) flips this to true on every
  // prior estimate when a new one lands. The vault still shows them so
  // history is recoverable, but they render muted.
  archived?: boolean;
}

interface Stats {
  total: number;
  by_type: { reports: number; spatial: number; walkthroughs: number; designs: number; estimates: number };
}

const ICON_MAP: Record<string, typeof FileText> = {
  report: FileText,
  spatial: ScanLine,
  walkthrough: Video,
  design: Palette,
  estimate: Calculator,
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: "bg-[#10B981]/15", text: "text-[#10B981]", label: "Completed" },
  processing: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", label: "Processing" },
  uploaded: { bg: "bg-gray-100", text: "text-gray-500", label: "Uploaded" },
};

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getDocHref(doc: Document): string {
  // `from=vault` lets shared destinations route the back arrow + header label
  // to /documents / "My Documents" instead of their default entry point.
  switch (doc.type) {
    case "report": return `/readiness/${doc.id}?from=vault`;
    case "spatial": return `/capture/${doc.id}?from=vault`;
    case "walkthrough": return `/walkthrough/${doc.id}?from=vault`;
    case "design": return `/design/results?session=${doc.id}&from=vault`;
    case "estimate": return `/estimate/${doc.id}?from=vault`;
    default: return "#";
  }
}

function getDocSubtitle(doc: Document): string {
  if (doc.type === "estimate" && typeof doc.total_estimate === "number") {
    return `$${Math.round(doc.total_estimate).toLocaleString()}`;
  }
  return doc.subtitle;
}

// Map a document type to its DELETE endpoint. Estimates have no delete
// endpoint in the backend, so we render no trash button for them.
function getDeleteUrl(doc: Document): string | null {
  switch (doc.type) {
    case "report": return `${API_URL}/v1/readiness-reports/${doc.id}`;
    case "spatial": return `${API_URL}/v1/spatial/${doc.id}`;
    case "walkthrough": return `${API_URL}/v1/walkthrough/${doc.id}`;
    case "design": return `${API_URL}/v1/design/${doc.id}`;
    default: return null;
  }
}

// Map a document type to its PDF endpoint. spatial / walkthrough have no
// PDF representation, so the download button hides for those types.
function getPdfUrl(doc: Document): string | null {
  switch (doc.type) {
    case "report": return `${API_URL}/v1/readiness-reports/${doc.id}/pdf`;
    case "design": return `${API_URL}/v1/design/${doc.id}/pdf`;
    case "estimate": return `${API_URL}/v1/estimates/${doc.id}/pdf`;
    default: return null;
  }
}

function safeFilename(title: string, fallback: string): string {
  const cleaned = (title || "").replace(/[^A-Za-z0-9._ -]+/g, "").trim();
  const base = cleaned.length > 0 ? cleaned : fallback;
  return base.endsWith(".pdf") ? base : `${base}.pdf`;
}

type FilterType = "all" | "report" | "spatial" | "walkthrough" | "design" | "estimate";

const FILTERS: { key: FilterType; label: string; statsKey?: keyof Stats["by_type"] }[] = [
  { key: "all", label: "All" },
  { key: "report", label: "Reports", statsKey: "reports" },
  { key: "spatial", label: "Scans", statsKey: "spatial" },
  { key: "walkthrough", label: "Videos", statsKey: "walkthroughs" },
  { key: "design", label: "Designs", statsKey: "designs" },
  { key: "estimate", label: "Estimates", statsKey: "estimates" },
];

export default function DocumentVaultPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (doc: Document) => {
    const url = getPdfUrl(doc);
    if (!url) return;
    setDownloadingIds((prev) => new Set(prev).add(doc.id));
    try {
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server responded ${res.status}`);
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const cdMatch = cd.match(/filename="?([^"]+)"?/);
      const filename = cdMatch ? cdMatch[1] : safeFilename(doc.title, `PARAPET-${doc.type}-${doc.id}`);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revoke so Safari has time to start the download.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't download document",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    const url = getDeleteUrl(doc);
    if (!url) return;
    // Optimistic removal — snapshot for rollback if the request fails.
    const snapshot = documents;
    setDeletingIds((prev) => new Set(prev).add(doc.id));
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    try {
      const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server responded ${res.status}`);
      }
      toast({ title: "Deleted", description: doc.title });
      // Reflect the deletion in the per-type counts so the filter pills update.
      setStats((prev) => {
        if (!prev) return prev;
        const map: Record<Document["type"], keyof Stats["by_type"]> = {
          report: "reports",
          spatial: "spatial",
          walkthrough: "walkthroughs",
          design: "designs",
          estimate: "estimates",
        };
        const key = map[doc.type];
        return {
          total: Math.max(0, prev.total - 1),
          by_type: { ...prev.by_type, [key]: Math.max(0, prev.by_type[key] - 1) },
        };
      });
    } catch (err) {
      setDocuments(snapshot);
      toast({
        variant: "destructive",
        title: "Couldn't delete document",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/v1/documents/vault`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/v1/documents/stats`, { headers: getAuthHeaders() }),
        ]);
        if (!docsRes.ok) throw new Error(`Failed to load documents (${docsRes.status})`);
        const docsData = await docsRes.json();
        setDocuments(docsData.documents ?? []);
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === "all" ? documents : documents.filter(d => d.type === filter);
  const total = stats?.total ?? documents.length;

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Document Vault" backPath="/dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
          <h1 className="text-lg font-bold text-foreground mb-2">Unable to load documents</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A]"
          >
            Retry
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Document Vault" backPath="/dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <FolderOpen size={48} className="text-[#1E3A5F]/30 mb-4" />
          <h1 className="text-lg font-bold text-foreground mb-2">No Documents Yet</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Complete your readiness assessment to start building your renovation file.
          </p>
          <button
            onClick={() => router.push("/intake/home-type")}
            className="w-full max-w-xs bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#2A4F7A] transition-colors"
          >
            Start Assessment <ChevronRight size={16} />
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Document Vault" subtitle={`${total} document${total !== 1 ? "s" : ""}`} backPath="/dashboard" />

      {/* Filter pills */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? total : (stats?.by_type?.[f.statsKey!] ?? 0);
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
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FolderOpen size={32} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No {filter} documents found.</p>
          </div>
        ) : (
          filtered.map((doc) => {
            const Icon = ICON_MAP[doc.type] ?? FileText;
            const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.uploaded;
            const subtitle = getDocSubtitle(doc);

            const archived = !!doc.archived;
            const canDelete = getDeleteUrl(doc) !== null;
            const canDownload = getPdfUrl(doc) !== null;
            const isDeleting = deletingIds.has(doc.id);
            const isDownloading = downloadingIds.has(doc.id);
            return (
              <Link key={doc.id} href={getDocHref(doc)}>
                <div className={`bg-white rounded-xl border p-3.5 flex items-center gap-3 transition-colors overflow-hidden ${
                  archived
                    ? "border-border/30 opacity-70 hover:border-border/60"
                    : "border-border/50 hover:border-[#1E3A5F]/30"
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    archived ? "bg-muted/40" : "bg-[#1E3A5F]/5"
                  }`}>
                    <Icon size={18} className={archived ? "text-muted-foreground" : "text-[#1E3A5F]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${archived ? "text-muted-foreground" : "text-foreground"}`}>{doc.title}</p>
                    {subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {archived ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-muted/50 text-muted-foreground">
                          Archived
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${st.bg} ${st.text}`}>
                          {doc.status === "processing" && <Loader2 size={8} className="animate-spin" />}
                          {st.label}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(doc.created_at)}</span>
                    </div>
                  </div>
                  {canDownload && (
                    <button
                      type="button"
                      aria-label={`Download ${doc.title}`}
                      disabled={isDownloading}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Delete ${doc.title}`}
                      disabled={isDeleting}
                      onClick={(e) => {
                        // Inside the Link — block navigation so the tap only opens the confirm dialog.
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDelete(doc);
                      }}
                      className="p-2 -mr-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                  <ChevronRight size={16} className={archived ? "text-muted-foreground/40 shrink-0" : "text-muted-foreground shrink-0"} />
                </div>
              </Link>
            );
          })
        )}
        <div className="h-4" />
      </div>

      <BottomNav />

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.title}
              <br />
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = confirmDelete;
                setConfirmDelete(null);
                if (target) handleDelete(target);
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

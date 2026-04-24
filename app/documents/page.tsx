'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, ScanLine, Video, Palette, Calculator, FolderOpen,
  ChevronRight, Loader2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
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

            return (
              <Link key={doc.id} href={getDocHref(doc)}>
                <div className="bg-white rounded-xl border border-border/50 p-3.5 flex items-center gap-3 hover:border-[#1E3A5F]/30 transition-colors overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/5 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                    {subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${st.bg} ${st.text}`}>
                        {doc.status === "processing" && <Loader2 size={8} className="animate-spin" />}
                        {st.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(doc.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })
        )}
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}

'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import ParapetLogo from "@/components/ParapetLogo";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";
import {
  Bell, Plus, ArrowRight, Camera, FileText, BarChart3,
  AlertTriangle, Scan, PenTool, Palette, Scale,
  Shield, Gavel, FileCheck, MapPin, DollarSign,
  CalendarRange, Hammer, Bug, FolderArchive, Package,
  ChevronRight, User, ClipboardList, Lock,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

// ── Phase modules ──

type ModuleStatus = "completed" | "active" | "review" | "pending";

interface PhaseModule {
  label: string;
  href: string;
  icon: typeof FileText;
  status: ModuleStatus;
}

const statusStyles: Record<ModuleStatus, { bg: string; text: string; label: string }> = {
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed" },
  active: { bg: "bg-[#2BCBBA]/15", text: "text-[#1E3A5F]", label: "Active" },
  review: { bg: "bg-blue-100", text: "text-blue-700", label: "Review" },
  pending: { bg: "bg-gray-100", text: "text-gray-500", label: "Pending" },
};

export default function DashboardPage() {
  const [latestReport, setLatestReport] = useState<any>(null);
  const [latestSpatialId, setLatestSpatialId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInitials, setUserInitials] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user profile for avatar initials
        try {
          const profileRes = await fetch(`${API_URL}/v1/users/profile`, {
            headers: getAuthHeaders(),
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const first = profile.first_name;
            const last = profile.last_name;
            if (first && last) setUserInitials(`${first[0]}${last[0]}`.toUpperCase());
            else if (first) setUserInitials(first[0].toUpperCase());
          }
        } catch { /* profile fetch optional */ }

        // Fetch readiness reports
        const res = await fetch(`${API_URL}/v1/readiness-reports`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const reports: any[] = Array.isArray(data) ? data : data.reports ?? data.items ?? [];
          const completed = reports.find((r: any) => r.status === "completed");
          if (completed) {
            const fullRes = await fetch(`${API_URL}/v1/readiness-reports/${completed.id}`, {
              headers: getAuthHeaders(),
            });
            if (fullRes.ok) setLatestReport(await fullRes.json());
          }
        }

        // Fetch walkthroughs to find spatial_id
        let foundSpatialId: string | null = null;
        try {
          const wtRes = await fetch(`${API_URL}/v1/walkthrough`, {
            headers: getAuthHeaders(),
          });
          if (wtRes.ok) {
            const wts = await wtRes.json();
            const wtList: any[] = Array.isArray(wts) ? wts : [];
            const withSpatial = wtList.find((w: any) => w.spatial_id);
            if (withSpatial?.spatial_id) {
              foundSpatialId = withSpatial.spatial_id;
            }
          }
        } catch { /* spatial lookup optional */ }

        // Fallback: check localStorage for spatial_id from direct upload
        if (!foundSpatialId) {
          try {
            const stored = localStorage.getItem("parapet_spatial_id");
            if (stored) foundSpatialId = stored;
          } catch { /* localStorage unavailable */ }
        }

        if (foundSpatialId) setLatestSpatialId(foundSpatialId);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const reportId = latestReport?.id;
  const rj = latestReport?.report_json;
  const formData = latestReport?.form_data ?? latestReport?.intake_data ?? {};
  const scope: string[] = formData?.scope ?? formData?.renovation_scope ?? [];
  const projectTitle = scope.length > 0
    ? scope.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")).join(", ") + " Renovation"
    : "Renovation Project";
  const zipCode = formData?.zip_code ?? formData?.zipCode ?? "";
  const costP50 = rj?.cost_estimate?.cost_distribution?.p50 ?? null;
  const schedP50Days = rj?.cost_estimate?.schedule_distribution?.p50 ?? null;
  const schedWeeks = schedP50Days ? Math.round(schedP50Days / 7) : null;

  // Build phase modules with dynamic status
  const hasReport = !!reportId;
  const discovery: PhaseModule[] = [
    { label: "Space Capture", href: "/capture", icon: Scan, status: "active" },
    { label: "Readiness Report", href: hasReport ? `/readiness/${reportId}` : "#", icon: FileText, status: hasReport ? "completed" : "pending" },
    { label: "Scope Editor", href: latestSpatialId ? `/scope/${latestSpatialId}` : hasReport ? `/scope/report-${reportId}` : "/capture", icon: PenTool, status: latestSpatialId || hasReport ? "active" : "pending" },
    { label: "Design Studio", href: "/design", icon: Palette, status: "active" },
  ];
  const bidding: PhaseModule[] = [
    { label: "Bid Comparison", href: "#", icon: Scale, status: "pending" },
    { label: "Contractor Risk", href: "#", icon: Shield, status: "pending" },
    { label: "Contract Review", href: "#", icon: Gavel, status: "pending" },
  ];
  const permitting: PhaseModule[] = [
    { label: "Permit Tracking", href: "#", icon: FileCheck, status: "pending" },
    { label: "Payment Guardrails", href: "#", icon: DollarSign, status: "pending" },
    { label: "Lien Shield", href: "#", icon: MapPin, status: "pending" },
  ];
  const construction: PhaseModule[] = [
    { label: "Schedule & Budget", href: "#", icon: CalendarRange, status: "pending" },
    { label: "Change Orders", href: "#", icon: Hammer, status: "pending" },
    { label: "Defect Detection", href: "#", icon: Bug, status: "pending" },
    { label: "Warranty & Document Vault", href: "#", icon: FolderArchive, status: "pending" },
    { label: "Closeout Package", href: "#", icon: Package, status: "pending" },
  ];

  const phases = [
    { title: "DISCOVERY", modules: discovery },
    { title: "BIDDING", modules: bidding },
    { title: "PERMITTING", modules: permitting },
    { title: "CONSTRUCTION", modules: construction },
  ];

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background relative shadow-xl">
      {/* ── Dashboard Header ── */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-border/40">
        <div className="flex items-center gap-2">
          <ParapetLogo size={28} className="text-[#1E3A5F]" />
          <span className="text-base font-bold text-[#1E3A5F] tracking-tight">PARAPET</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <Link href="/account" className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center">
            {userInitials ? (
              <span className="text-[11px] font-bold text-white">{userInitials}</span>
            ) : (
              <User size={16} className="text-white" />
            )}
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 pb-4 safe-bottom overflow-y-auto">

        {/* ── Onboarding (no report yet) OR Start New Assessment ── */}
        {!loading && !latestReport ? (
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-[#1E3A5F]/[0.04] to-[#2BCBBA]/[0.05] p-5 mb-5">
            <h2 className="text-lg font-bold text-[#1E3A5F] leading-tight">Let&apos;s plan your renovation</h2>
            <p className="text-[12px] text-muted-foreground mt-1 mb-4 leading-relaxed">
              Complete these steps to get your personalized renovation plan.
            </p>

            <ol className="space-y-3">
              {/* Step 1 — available */}
              <li>
                <Link
                  href="/intake/home-type"
                  className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#1E3A5F]/20 hover:border-[#1E3A5F]/40 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-[#1E3A5F] leading-tight">Tell us about your project</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#2BCBBA]/15 text-[9px] font-semibold text-[#1E3A5F]">5 min</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Answer 7 quick questions about your renovation.
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-[#1E3A5F] flex-shrink-0 mt-2" />
                </Link>
              </li>

              {/* Step 2 — locked */}
              <li>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-border/40 opacity-70">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-muted-foreground leading-tight">Get your Readiness Report</p>
                      <Lock size={10} className="text-muted-foreground/60" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      AI-powered cost estimate, risk assessment &amp; regulatory checklist.
                    </p>
                  </div>
                </div>
              </li>

              {/* Step 3 — locked */}
              <li>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-border/40 opacity-70">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Camera size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-muted-foreground leading-tight">Capture your space</p>
                      <Lock size={10} className="text-muted-foreground/60" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Upload a Polycam scan for precise measurements.
                    </p>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        ) : (
          <Link href="/intake/home-type">
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[#1E3A5F]/30 mb-4 hover:border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/[0.02] transition-all">
              <div className="w-10 h-10 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-[#1E3A5F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Start New Assessment</p>
                <p className="text-[11px] text-muted-foreground">Get your personalized Renovation Readiness Report</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* ── Active Project Card ── */}
        {!loading && latestReport && (
          <Link href={`/readiness/${reportId}`}>
            <div className="rounded-xl border border-border/50 bg-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{projectTitle}</p>
                  {zipCode && <p className="text-[11px] text-muted-foreground">ZIP {zipCode}</p>}
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2BCBBA]/15 text-[10px] font-semibold text-[#1E3A5F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2BCBBA]" />
                  Phase 1
                </span>
              </div>

              {/* Progress bar placeholder */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-[#2BCBBA] w-[15%]" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Budget</p>
                  <p className="text-xs font-bold text-foreground">
                    {costP50 ? `$${Math.round(costP50 / 1000)}K` : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Spent</p>
                  <p className="text-xs font-bold text-foreground">$0</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Timeline</p>
                  <p className="text-xs font-bold text-foreground">
                    {schedWeeks ? `${schedWeeks}w` : "\u2014"}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Create an Estimate", href: "/capture", icon: Camera, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
            { label: "Readiness Report", href: hasReport ? `/readiness/${reportId}` : "/intake/home-type", icon: FileText, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
            { label: "View Estimate", href: latestSpatialId ? `/scope/${latestSpatialId}` : "/capture", icon: BarChart3, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
            { label: "My Documents", href: "/documents", icon: FolderArchive, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
          ].map((action) => (
            <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center`}>
                <action.icon size={20} className={action.iconColor} />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Alert Banner ── */}
        {hasReport && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/50 mb-5">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">2 items flagged</p>
              <p className="text-[10px] text-amber-700">Review permit requirements and co-op approval status</p>
            </div>
            <ChevronRight size={14} className="text-amber-500 flex-shrink-0" />
          </div>
        )}

        {/* ── Phase Modules ── */}
        <div className="space-y-5">
          {phases.map((phase) => (
            <div key={phase.title}>
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{phase.title}</h3>
              <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30 overflow-hidden">
                {phase.modules.map((mod) => {
                  const st = statusStyles[mod.status];
                  const isPending = mod.status === "pending";
                  const Icon = mod.icon;
                  const inner = (
                    <div className={`flex items-center gap-3 px-3.5 py-3 ${isPending ? "opacity-50" : "hover:bg-muted/30"} transition-colors`}>
                      <div className="w-7 h-7 rounded-lg bg-[#1E3A5F]/5 flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-[#1E3A5F]" />
                      </div>
                      <span className={`flex-1 text-xs font-medium ${isPending ? "text-muted-foreground" : "text-foreground"}`}>{mod.label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  );

                  if (isPending || mod.href === "#") {
                    return <div key={mod.label}>{inner}</div>;
                  }
                  return <Link key={mod.label} href={mod.href}>{inner}</Link>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

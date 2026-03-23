'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import ParapetLogo from "@/components/ParapetLogo";
import BottomNav from "@/components/BottomNav";
import {
  Bell, Plus, ArrowRight, Camera, FileText, BarChart3,
  Users, AlertTriangle, Scan, PenTool, Palette, Scale,
  Shield, Gavel, FileCheck, MapPin, DollarSign,
  CalendarRange, Hammer, Bug, FolderArchive, Package,
  ChevronRight,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(`${API_URL}/v1/readiness-reports`);
        if (!res.ok) return;
        const data = await res.json();
        const reports: any[] = Array.isArray(data) ? data : data.reports ?? data.items ?? [];
        const completed = reports.find((r: any) => r.status === "completed");
        if (completed) {
          // Fetch full report for details
          const fullRes = await fetch(`${API_URL}/v1/readiness-reports/${completed.id}`);
          if (fullRes.ok) {
            setLatestReport(await fullRes.json());
          }
        }
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    fetchReports();
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
    { label: "Space Capture", href: "#", icon: Scan, status: "pending" },
    { label: "Readiness Report", href: hasReport ? `/readiness/${reportId}` : "#", icon: FileText, status: hasReport ? "completed" : "pending" },
    { label: "Scope Editor", href: "#", icon: PenTool, status: "pending" },
    { label: "Design Studio", href: "#", icon: Palette, status: "pending" },
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
          <div className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center">
            <span className="text-[11px] font-bold text-white">JD</span>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 pb-4 safe-bottom overflow-y-auto">

        {/* ── Start New Assessment ── */}
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
            { label: "Create an Estimate", href: "/intake/home-type", icon: Camera, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
            { label: "Readiness Report", href: hasReport ? `/readiness/${reportId}` : "/intake/home-type", icon: FileText, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
            { label: "View Estimate", href: "#", icon: BarChart3, color: "bg-[#2BCBBA]/15", iconColor: "text-[#2BCBBA]" },
            { label: "Contractors", href: "#", icon: Users, color: "bg-amber-100", iconColor: "text-amber-600" },
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

'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, Download, ArrowRight, DollarSign,
  MessageSquare, FileText, ChevronDown, ChevronUp, FolderOpen,
} from "lucide-react";
import ParapetLogo from "@/components/ParapetLogo";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders, clearAuth } from "@/lib/auth";

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

const formatCurrency = (n: number | null | undefined): string =>
  n != null ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "\u2014";

interface LineItem {
  item_code?: string;
  description?: string;
  category?: string;
  room?: string;
  quantity?: number | string;
  unit?: string;
  unit_cost?: number;
  subtotal?: number;
  confidence_score?: number;
  pricing_source?: string;
}

interface CostRange {
  low?: number;
  expected?: number;
  high?: number;
}

interface Provenance {
  source?: string;
  walkthrough_status?: string;
  pipeline_version?: string;
  rooms_parsed?: number;
}

interface Estimate {
  id: string;
  homeowner_id?: string;
  spatial_id?: string | null;
  walkthrough_id?: string | null;
  readiness_report_id?: string | null;
  status?: string;
  source?: string;
  line_items: LineItem[];
  category_totals: Record<string, number>;
  grand_total: number;
  cost_estimate: CostRange;
  provenance?: Provenance;
  created_at?: string;
  updated_at?: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ok"; estimate: Estimate }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

export default function EstimateViewPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const loadEstimate = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`${API_URL}/v1/estimates/${estimateId}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setState({ kind: "not-found" });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: `Server responded ${res.status}` });
        return;
      }
      const data = (await res.json()) as Estimate;
      setState({ kind: "ok", estimate: data });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Network error" });
    }
  }, [estimateId, router]);

  useEffect(() => {
    if (!estimateId) return;
    loadEstimate();
  }, [estimateId, loadEstimate]);

  if (state.kind === "loading") {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-background shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (state.kind === "not-found") {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <FolderOpen size={48} className="text-[#1E3A5F]/30 mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">Estimate not found</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          This estimate may have been removed or you don&apos;t have access to it.
        </p>
        <Link
          href="/documents"
          className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A] transition-colors"
        >
          Back to Document Vault
        </Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">We couldn&apos;t load this estimate</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{state.message}</p>
        <button
          onClick={loadEstimate}
          className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const estimate = state.estimate;
  const lineItems: LineItem[] = estimate.line_items ?? [];
  const categoryTotals: Record<string, number> = estimate.category_totals ?? {};
  const grandTotal = estimate.grand_total ?? 0;
  const subtotal = lineItems.reduce((s, it) => s + (it.subtotal ?? 0), 0);
  const generalConditions = Math.max(0, grandTotal - subtotal);
  const costEstimate = estimate.cost_estimate ?? {};
  const lowCost = costEstimate.low ?? grandTotal * 0.8;
  const expectedCost = costEstimate.expected ?? grandTotal;
  const highCost = costEstimate.high ?? grandTotal * 1.25;
  const provenance = estimate.provenance ?? {};

  const byCategory: Record<string, LineItem[]> = {};
  for (const item of lineItems) {
    const cat = item.category ?? "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }
  const categories = Object.keys(byCategory).sort();

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background relative shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/documents")} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft size={22} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">Your Estimate</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Spatial-based line item estimate</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <Download size={14} /> Export
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 pb-4 safe-bottom overflow-y-auto">

        {/* ── Summary Card ── */}
        <Card className="p-4 mb-4 rounded-xl border border-border/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estimate Summary</h3>

          <div className="text-center mb-4">
            <p className="text-[11px] text-muted-foreground">Total Estimated Cost</p>
            <p className="text-3xl font-bold text-[#1E3A5F]">{formatCurrency(grandTotal)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <p className="text-xs font-bold text-emerald-700">{formatCurrency(lowCost)}</p>
              <p className="text-[9px] text-emerald-600">Low (80%)</p>
            </div>
            <div className="rounded-lg bg-[#1E3A5F]/5 p-2">
              <p className="text-xs font-bold text-[#1E3A5F]">{formatCurrency(expectedCost)}</p>
              <p className="text-[9px] text-[#1E3A5F]">Expected</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-xs font-bold text-amber-700">{formatCurrency(highCost)}</p>
              <p className="text-[9px] text-amber-600">High (125%)</p>
            </div>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">General Conditions (10%)</span>
              <span className="font-medium text-foreground">{formatCurrency(generalConditions)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/30 font-semibold">
              <span className="text-foreground">Grand Total</span>
              <span className="text-[#1E3A5F]">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* ── Cost by Category ── */}
        <Card className="p-4 mb-4 rounded-xl border border-border/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cost by Category</h3>

          <div className="space-y-2 mb-3">
            {Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).map(([cat, total]) => {
              const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-foreground font-medium">{cat}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#1E3A5F]" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#2BCBBA] w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Line Items by Category ── */}
        <Card className="p-4 mb-4 rounded-xl border border-border/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Line Items ({lineItems.length})
          </h3>

          <div className="divide-y divide-border/30">
            {categories.map((cat) => {
              const items = byCategory[cat];
              const isExpanded = expandedCategory === cat;
              const catTotal = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

              return (
                <div key={cat}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                    className="flex items-center justify-between w-full py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-[#1E3A5F]" />
                      <span className="text-xs font-semibold text-foreground">{cat}</span>
                      <span className="text-[10px] text-muted-foreground">({items.length} items)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{formatCurrency(catTotal)}</span>
                      {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pb-3 space-y-1.5">
                      {items.map((item, idx) => (
                        <div key={idx} className="rounded-md bg-muted/30 px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-foreground">{item.description ?? item.item_code ?? "Item"}</p>
                              {item.item_code && item.description && (
                                <p className="text-[10px] text-muted-foreground">{item.item_code}</p>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-foreground shrink-0">{formatCurrency(item.subtotal)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            {item.quantity != null && <span>Qty: {item.quantity}</span>}
                            {item.unit && <span>{item.unit}</span>}
                            {item.unit_cost != null && <span>@ {formatCurrency(item.unit_cost)}</span>}
                            {item.confidence_score != null && (
                              <span className="text-[#2BCBBA] font-medium">{Math.round(item.confidence_score * 100)}% conf.</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Provenance ── */}
        {provenance.source && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50 bg-muted/20">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Source</h3>
            <p className="text-[10px] text-foreground">{provenance.source}</p>
            {provenance.walkthrough_status && (
              <p className="text-[10px] text-muted-foreground mt-1">{provenance.walkthrough_status}</p>
            )}
            {provenance.pipeline_version && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Pipeline v{provenance.pipeline_version}</p>
            )}
          </Card>
        )}

        {/* ── Action Buttons ── */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push("#")}
            variant="outline"
            className="w-full h-11 text-sm font-medium rounded-xl gap-2"
          >
            <MessageSquare size={16} /> Review with AI
          </Button>
          <Button
            onClick={() => router.push("#")}
            className="w-full h-12 text-sm font-semibold bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white rounded-xl gap-2 shadow-lg shadow-[#1E3A5F]/20"
          >
            <FileText size={16} /> Generate Specifications
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

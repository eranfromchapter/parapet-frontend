'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, ChevronDown, ListFilter, Home,
  FileText, Clock, Search, Droplets, BedDouble, Sofa,
  Plus, Minus, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

const fmt = (n: number) => `$${n.toLocaleString()}`;

// ── Room icon config ──

const ROOM_ICON_MAP: Record<string, { icon: typeof Search; bg: string }> = {
  Kitchen: { icon: Search, bg: "bg-amber-50" },
  Bathroom: { icon: Droplets, bg: "bg-sky-50" },
  "Living Room": { icon: Sofa, bg: "bg-blue-50" },
  Bedroom: { icon: BedDouble, bg: "bg-slate-100" },
};
function getRoomIcon(name: string) {
  if (name.startsWith("Bathroom")) return ROOM_ICON_MAP.Bathroom;
  if (name.startsWith("Bedroom")) return ROOM_ICON_MAP.Bedroom;
  return ROOM_ICON_MAP[name] ?? { icon: Home, bg: "bg-gray-50" };
}

// ── Transform API line items into scope items ──

function parseQuantity(q: unknown): { value: number; unit: string } {
  if (typeof q === "number") return { value: q, unit: "" };
  const s = String(q ?? "").trim();
  const m = s.match(/^\s*(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { value: 1, unit: "" };
  return { value: Number(m[1]), unit: m[2].trim() };
}

function transformLineItems(lineItems: any[]): any[] {
  return lineItems.map((li: any, i: number) => {
    const { value, unit } = parseQuantity(li.quantity);
    const subtotal = typeof li.subtotal === "number" ? li.subtotal : 0;
    // Per-unit price so quantity changes can scale the line subtotal locally
    // while we wait for the server to recompute it on the next refresh.
    const unitPrice = value > 0 ? subtotal / value : subtotal;
    return {
      id: li.item_code ?? String(i),
      name: (li.description ?? li.scope_item ?? li.item_code ?? `Item ${i + 1}`).replace(/_/g, " "),
      category: (li.category ?? "General").replace(/_/g, " "),
      room: (li.room ?? "General").replace(/_/g, " "),
      description: li.item_code ? `${li.item_code} \u2014 ${li.quantity ?? ""}` : (li.quantity ?? ""),
      lowPrice: Math.round(subtotal * 0.85),
      highPrice: Math.round(subtotal * 1.15),
      subtotal,
      unitPrice,
      quantity: value,
      quantityUnit: unit,
      enabled: true,
      confidenceScore: li.confidence_score,
      pricingSource: li.pricing_source ?? li.source,
    };
  });
}

function groupByRoom(items: any[]): { name: string; total: number; items: any[] }[] {
  const byRoom: Record<string, any[]> = {};
  for (const item of items) {
    const room = (item.room || "General").replace(/_/g, " ");
    if (!byRoom[room]) byRoom[room] = [];
    byRoom[room].push(item);
  }
  return Object.entries(byRoom)
    .map(([name, roomItems]) => ({
      name,
      total: roomItems.reduce((s: number, i: any) => s + (i.subtotal ?? 0), 0),
      items: roomItems,
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Page ──

export default function ScopeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const scopeId = params.id as string;
  const isReportBased = scopeId.startsWith("report-");
  const actualReportId = isReportBased ? scopeId.replace("report-", "") : null;

  // Redirect demo/invalid routes — user must upload a scan first
  useEffect(() => {
    if (scopeId === "demo") {
      router.replace("/capture");
    }
  }, [scopeId, router]);

  const [items, setItems] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"scope" | "room">("scope");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  // Per-item debounce so a flurry of taps coalesces into a single PATCH per
  // item; mutations are persisted only when an estimate id exists (i.e. not
  // the report-derived view, which has no live estimate).
  const debounceMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const persistItem = useCallback((item: any, snapshot: any[]) => {
    if (!estimateId) return; // Report-based scope is read-only on the server.
    const itemId = item.id;
    const existing = debounceMap.current.get(itemId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      debounceMap.current.delete(itemId);
      setSavingIds((prev) => new Set(prev).add(itemId));
      try {
        const res = await fetch(`${API_URL}/v1/estimates/${estimateId}/scope`, {
          method: "PATCH",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            item_code: itemId,
            enabled: item.enabled,
            quantity: typeof item.quantity === "number" ? item.quantity : undefined,
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Save failed (${res.status})`);
        }
      } catch (err) {
        setItems(snapshot);
        const msg = err instanceof Error ? err.message : "Couldn't save change";
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    }, 500);
    debounceMap.current.set(itemId, t);
  }, [estimateId]);

  // Fetch real data
  const fetchEstimate = useCallback(async () => {
    if (scopeId === "demo") return; // redirect handled above
    setLoading(true);
    setError(null);
    try {
      let data: any;

      if (isReportBased && actualReportId) {
        // Load scope from readiness report's cost breakdown
        const res = await fetch(`${API_URL}/v1/readiness-reports/${actualReportId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
        const report = await res.json();
        const rj = report.report_json;
        if (!rj?.cost_estimate?.breakdown_by_category) {
          throw new Error("Report has no cost breakdown data");
        }

        const breakdown = rj.cost_estimate.breakdown_by_category;
        const lineItems = (Array.isArray(breakdown)
          ? breakdown
          : Object.entries(breakdown).map(([cat, amount]: [string, any]) => ({
              description: (cat || "").replace(/_/g, " "),
              category: (cat || "").replace(/_/g, " "),
              subtotal: typeof amount === "number" ? amount : amount?.amount ?? amount?.expected ?? 0,
              room: "General",
            }))
        ).map((item: any, i: number) => ({
          item_code: `RR-${String(i + 1).padStart(3, "0")}`,
          description: (item.description || item.category || item.name || `Item ${i + 1}`).replace(/_/g, " "),
          category: (item.category || "General").replace(/_/g, " "),
          room: (item.room || "General").replace(/_/g, " "),
          subtotal: item.subtotal || item.amount || item.expected || 0,
          quantity: item.quantity || "",
          confidence_score: item.confidence_score || rj.calibration?.historical_accuracy_pct || null,
          pricing_source: "Readiness Report",
        }));

        data = { line_items: lineItems, provenance: rj.provenance || {} };
      } else {
        // Original spatial-based estimate
        const res = await fetch(`${API_URL}/v1/spatial/${scopeId}/estimate`, {
          method: "POST",
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(body || `Failed to load estimate (${res.status})`);
        }
        data = await res.json();
      }

      setEstimate(data);
      const eid = (data && typeof data.id === "string") ? data.id : null;
      setEstimateId(eid);
      const transformed = transformLineItems(data.line_items ?? []);
      setItems(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimate");
    } finally {
      setLoading(false);
    }
  }, [scopeId, isReportBased, actualReportId]);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  // Derived data
  const enabledItems = items.filter((i: any) => i.enabled);
  const totalLow = enabledItems.reduce((s: number, i: any) => s + (i.lowPrice ?? 0), 0);
  const totalHigh = enabledItems.reduce((s: number, i: any) => s + (i.highPrice ?? 0), 0);
  const rooms = groupByRoom(enabledItems);
  const provenance = estimate?.provenance ?? {};
  const projectLabel = provenance.rooms_parsed != null
    ? `${provenance.rooms_parsed} rooms scanned`
    : "Estimate";

  // Optimistic-update + persist helpers — both snapshot the current items
  // before mutating so persistItem() can revert on a non-2xx response.
  const toggleItem = (id: string) => {
    const snapshot = items;
    let updated: any | null = null;
    const next = items.map((i: any) => {
      if (i.id !== id) return i;
      updated = { ...i, enabled: !i.enabled };
      return updated;
    });
    setItems(next);
    if (updated) persistItem(updated, snapshot);
  };

  const updateQuantity = (id: string, delta: number) => {
    const snapshot = items;
    let updated: any | null = null;
    const next = items.map((i: any) => {
      if (i.id !== id) return i;
      const nextQty = Math.max(1, (i.quantity ?? 1) + delta);
      if (nextQty === i.quantity) return i;
      const newSubtotal = Math.round((i.unitPrice ?? 0) * nextQty);
      updated = {
        ...i,
        quantity: nextQty,
        subtotal: newSubtotal,
        lowPrice: Math.round(newSubtotal * 0.85),
        highPrice: Math.round(newSubtotal * 1.15),
      };
      return updated;
    });
    if (!updated) return;
    setItems(next);
    persistItem(updated, snapshot);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading estimate...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-[#FAFBFC] px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Could not load estimate</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>
        <div className="flex gap-3">
          <button onClick={fetchEstimate} className="px-5 py-2.5 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A]">Retry</button>
          <button onClick={() => router.push("/capture")} className="px-5 py-2.5 border border-[#E8ECF1] rounded-xl text-sm font-medium text-foreground hover:bg-muted/30">Upload Scan</button>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-[#FAFBFC] px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">No estimate data yet</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isReportBased
            ? "No cost breakdown data in this report yet."
            : "Upload a Polycam scan to generate a detailed scope of work."}
        </p>
        <button onClick={() => router.push("/capture")} className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A]">Go to Space Capture</button>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[400px] w-[90%] animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-[#1E3A5F] text-white text-xs rounded-xl px-4 py-3 shadow-lg text-center">{toast}</div>
        </div>
      )}

      <div className="max-w-[430px] mx-auto min-h-[100dvh] bg-[#FAFBFC] flex flex-col relative shadow-xl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E8ECF1]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/dashboard")} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft size={22} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-[16px] font-semibold text-foreground leading-tight">Scope Editor</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{projectLabel}</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Clock size={14} /> History
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto">

          {/* Summary Card */}
          <div className="bg-[#F0F4F8] rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Scope Total</p>
                <p className="text-2xl font-bold text-foreground">{fmt(totalLow)} {'\u2013'} {fmt(totalHigh)}</p>
              </div>
              {totalLow > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-[#10B981]">{enabledItems.length} items</span>
                  <span className="text-[#10B981] text-xs">{'\u2713'}</span>
                </div>
              )}
            </div>
            {provenance.walkthrough_status && (
              <p className="text-[10px] text-muted-foreground mt-2">{provenance.walkthrough_status}</p>
            )}
          </div>

          {/* Toggle Tabs */}
          <div className="flex rounded-lg border border-[#E8ECF1] p-1 mb-4 bg-[#F0F4F8]">
            <button
              onClick={() => setViewMode("scope")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${viewMode === "scope" ? "bg-white shadow-sm text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              <ListFilter size={14} /> By Scope Item
            </button>
            <button
              onClick={() => setViewMode("room")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${viewMode === "room" ? "bg-white shadow-sm text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              <Home size={14} /> By Room
            </button>
          </div>

          {/* ── BY SCOPE ITEM ── */}
          {viewMode === "scope" && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Scope Items ({enabledItems.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item: any) => {
                    const isSaving = savingIds.has(item.id);
                    const canPersist = estimateId !== null;
                    return (
                    <div key={item.id} className={`bg-white border border-[#E8ECF1] rounded-xl p-4 transition-opacity ${item.enabled ? "" : "opacity-60"}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className={`text-sm font-semibold leading-tight ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>{item.name}</p>
                          {item.id && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1.5">
                              <span>{item.id}</span>
                              {isSaving && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-[#1E3A5F]/70">
                                  <Loader2 size={9} className="animate-spin" />
                                  Saving\u2026
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${item.enabled ? "bg-[#1E3A5F]" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${item.enabled ? "left-[20px]" : "left-[2px]"}`} />
                        </button>
                      </div>
                      {item.description && item.description !== item.name && !item.description.startsWith("RR-") && (
                        <p className={`text-xs leading-relaxed mb-2 ${item.enabled ? "text-muted-foreground" : "text-muted-foreground/70"}`}>{item.description}</p>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-semibold ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {fmt(item.lowPrice)} {'\u2013'} {fmt(item.highPrice)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {canPersist && item.enabled && (
                            <div className="flex items-center gap-1 rounded-lg border border-[#E8ECF1] bg-white px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-[11px] font-semibold tabular-nums min-w-[26px] text-center text-foreground">
                                {item.quantity}{item.quantityUnit ? ` ${item.quantityUnit}` : ""}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                aria-label="Increase quantity"
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          )}
                          {item.confidenceScore != null && (
                            <span className="text-[10px] font-medium text-[#2BCBBA]">{Math.round(item.confidenceScore)}% conf.</span>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
          )}

          {/* ── BY ROOM ── */}
          {viewMode === "room" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Rooms ({rooms.length})
              </h3>
              <div className="space-y-3">
                {rooms.map((room) => {
                  const isExpanded = expandedRoom === room.name;
                  const iconCfg = getRoomIcon(room.name);
                  const RoomIcon = iconCfg.icon;

                  return (
                    <div key={room.name} className="bg-white border border-[#E8ECF1] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedRoom(isExpanded ? null : room.name)}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg ${iconCfg.bg} flex items-center justify-center shrink-0`}>
                          <RoomIcon size={20} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.items.length} line items</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground shrink-0 mr-2">{fmt(room.total)}</p>
                        <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#E8ECF1]">
                          {room.items.map((li: any, idx: number) => (
                            <div key={idx} className={`flex items-center justify-between px-4 py-3 ${idx > 0 ? "border-t border-[#E8ECF1]" : ""}`}>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{li.name}</p>
                                <p className="text-xs text-muted-foreground">{li.category}</p>
                              </div>
                              <p className="text-sm font-medium text-foreground shrink-0 ml-3">{fmt(li.subtotal ?? li.highPrice ?? 0)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Bid Package — Phase 2 */}
          <div className="relative group mb-6">
            <Button
              disabled
              className="w-full h-12 bg-[#1E3A5F]/40 text-white/70 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <FileText size={16} /> View Bid Package <ChevronRight size={16} />
            </Button>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E3A5F] text-white text-[11px] rounded-lg px-3 py-1.5 whitespace-nowrap pointer-events-none">
              Coming in Bidding Pro
            </div>
          </div>

          {/* Provenance */}
          {(provenance.source || provenance.sources) && (
            <div className="bg-[#F0F4F8] rounded-xl p-3 mb-4">
              <p className="text-[10px] text-muted-foreground">
                Source: {provenance.sources?.join(", ") ?? provenance.source}
                {provenance.rooms_parsed != null && ` \u00B7 ${provenance.rooms_parsed} rooms parsed`}
              </p>
            </div>
          )}

          <div className="h-16" />
        </div>

        <BottomNav />
      </div>
    </>
  );
}

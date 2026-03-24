'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, ChevronDown, ListFilter, Home,
  Plus, FileText, Clock, Search, Droplets, BedDouble, Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

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

// ── Demo data (only used when id === "demo") ──

const DEMO_ITEMS = [
  { id: "1", name: "Cabinet Replacement", category: "Cabinetry", description: "Custom shaker-style, soft-close", lowPrice: 12000, highPrice: 16000, enabled: true },
  { id: "2", name: "Countertop Installation", category: "Surfaces", description: "Quartz, waterfall edge option", lowPrice: 5500, highPrice: 8000, enabled: true },
  { id: "3", name: "Electrical Upgrade", category: "Electrical", description: "Panel upgrade + dedicated circuits", lowPrice: 3200, highPrice: 4500, enabled: true },
  { id: "4", name: "Plumbing Relocation", category: "Plumbing", description: "Sink moved to island", lowPrice: 4000, highPrice: 6000, enabled: true },
  { id: "5", name: "Flooring", category: "Surfaces", description: "Engineered hardwood", lowPrice: 3500, highPrice: 5000, enabled: true },
  { id: "6", name: "Backsplash Tile", category: "Surfaces", description: "Subway tile, herringbone pattern", lowPrice: 2000, highPrice: 3200, enabled: false },
  { id: "7", name: "Lighting Design", category: "Electrical", description: "Recessed + pendant fixtures", lowPrice: 2800, highPrice: 4000, enabled: true },
];

// ── Transform API line items into scope items ──

function transformLineItems(lineItems: any[]): any[] {
  return lineItems.map((li: any, i: number) => ({
    id: li.item_code ?? String(i),
    name: li.description ?? li.scope_item ?? li.item_code ?? `Item ${i + 1}`,
    category: li.category ?? "General",
    room: li.room ?? "General",
    description: li.item_code ? `${li.item_code} \u2014 ${li.quantity ?? ""}` : (li.quantity ?? ""),
    lowPrice: typeof li.subtotal === "number" ? Math.round(li.subtotal * 0.85) : 0,
    highPrice: typeof li.subtotal === "number" ? Math.round(li.subtotal * 1.15) : 0,
    subtotal: typeof li.subtotal === "number" ? li.subtotal : 0,
    enabled: true,
    confidenceScore: li.confidence_score,
    pricingSource: li.pricing_source ?? li.source,
  }));
}

function groupByRoom(items: any[]): { name: string; total: number; items: any[] }[] {
  const byRoom: Record<string, any[]> = {};
  for (const item of items) {
    const room = item.room || "General";
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
  const isDemo = scopeId === "demo";

  const [items, setItems] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"scope" | "room">("scope");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch real data
  const fetchEstimate = useCallback(async () => {
    if (isDemo) {
      setItems(DEMO_ITEMS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/spatial/${scopeId}/estimate`, { method: "POST" });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Failed to load estimate (${res.status})`);
      }
      const data = await res.json();
      setEstimate(data);
      const transformed = transformLineItems(data.line_items ?? []);
      setItems(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimate");
    } finally {
      setLoading(false);
    }
  }, [scopeId, isDemo]);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  // Derived data
  const enabledItems = items.filter((i: any) => i.enabled);
  const totalLow = enabledItems.reduce((s: number, i: any) => s + (i.lowPrice ?? 0), 0);
  const totalHigh = enabledItems.reduce((s: number, i: any) => s + (i.highPrice ?? 0), 0);
  const rooms = groupByRoom(enabledItems);
  const provenance = estimate?.provenance ?? {};
  const projectLabel = provenance.rooms_parsed != null
    ? `${provenance.rooms_parsed} rooms scanned`
    : isDemo ? "Kitchen Renovation \u2014 v3" : "Estimate";

  const toggleItem = (id: string) => {
    setItems(prev => prev.map((i: any) => i.id === id ? { ...i, enabled: !i.enabled } : i));
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
  if (!isDemo && items.length === 0) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-[#FAFBFC] px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">No estimate data yet</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Upload a Polycam scan to generate a detailed scope of work.</p>
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
            <>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Scope Items ({enabledItems.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.id} className={`bg-white border border-[#E8ECF1] rounded-xl p-4 transition-opacity ${item.enabled ? "" : "opacity-60"}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>{item.name}</p>
                          <span className="text-[11px] bg-[#F0F4F8] text-muted-foreground font-medium px-2.5 py-0.5 rounded-full shrink-0">{item.category}</span>
                        </div>
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ml-2 ${item.enabled ? "bg-[#1E3A5F]" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${item.enabled ? "left-[20px]" : "left-[2px]"}`} />
                        </button>
                      </div>
                      {item.description && (
                        <p className={`text-xs leading-relaxed mb-2 ${item.enabled ? "text-muted-foreground" : "text-muted-foreground/70"}`}>{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {fmt(item.lowPrice)} {'\u2013'} {fmt(item.highPrice)}
                        </p>
                        {item.confidenceScore != null && (
                          <span className="text-[10px] font-medium text-[#2BCBBA]">{Math.round(item.confidenceScore)}% conf.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { setToast("Coming soon"); setTimeout(() => setToast(null), 2000); }}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#E8ECF1] text-sm font-medium text-muted-foreground hover:border-[#1E3A5F]/30 hover:text-foreground transition-all mb-4 flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> Add Scope Item
              </button>
            </>
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

          {/* View Bid Package */}
          <Button
            onClick={() => router.push("/bid-package")}
            className="w-full h-12 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 mb-6"
          >
            <FileText size={16} /> View Bid Package <ChevronRight size={16} />
          </Button>

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

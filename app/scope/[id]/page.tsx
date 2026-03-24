'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, ChevronDown, ListFilter, Home, Eye,
  Plus, FileText, Clock, Search, Droplets, BedDouble, Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Scope items data ──

interface ScopeItem {
  id: string;
  name: string;
  category: string;
  description: string;
  lowPrice: number;
  highPrice: number;
  enabled: boolean;
}

const INITIAL_ITEMS: ScopeItem[] = [
  { id: "1", name: "Cabinet Replacement", category: "Cabinetry", description: "Custom shaker-style, soft-close", lowPrice: 12000, highPrice: 16000, enabled: true },
  { id: "2", name: "Countertop Installation", category: "Surfaces", description: "Quartz, waterfall edge option", lowPrice: 5500, highPrice: 8000, enabled: true },
  { id: "3", name: "Electrical Upgrade", category: "Electrical", description: "Panel upgrade + dedicated circuits", lowPrice: 3200, highPrice: 4500, enabled: true },
  { id: "4", name: "Plumbing Relocation", category: "Plumbing", description: "Sink moved to island", lowPrice: 4000, highPrice: 6000, enabled: true },
  { id: "5", name: "Flooring", category: "Surfaces", description: "Engineered hardwood", lowPrice: 3500, highPrice: 5000, enabled: true },
  { id: "6", name: "Backsplash Tile", category: "Surfaces", description: "Subway tile, herringbone pattern", lowPrice: 2000, highPrice: 3200, enabled: false },
  { id: "7", name: "Lighting Design", category: "Electrical", description: "Recessed + pendant fixtures", lowPrice: 2800, highPrice: 4000, enabled: true },
];

// ── Room data ──

interface RoomLineItem { name: string; category: string; cost: number; }
interface RoomData { name: string; lineItems: number; total: number; items: RoomLineItem[]; }

const ROOMS: RoomData[] = [
  { name: "Kitchen", lineItems: 11, total: 88196, items: [
    { name: "Cabinet Replacement", category: "Cabinetry", cost: 14000 },
    { name: "Countertop Installation", category: "Surfaces", cost: 6750 },
    { name: "Kitchen Electrical", category: "Electrical", cost: 6125 },
    { name: "Kitchen Plumbing", category: "Plumbing", cost: 5000 },
    { name: "Kitchen Flooring", category: "Surfaces", cost: 8085 },
    { name: "Backsplash Tile", category: "Surfaces", cost: 2600 },
    { name: "Lighting Design", category: "Electrical", cost: 3400 },
    { name: "Kitchen Painting", category: "Painting", cost: 14149 },
    { name: "Kitchen Demolition", category: "Demolition", cost: 12500 },
    { name: "Appliance Installation", category: "Appliances", cost: 8500 },
    { name: "Kitchen Trim", category: "Trims", cost: 7087 },
  ]},
  { name: "Bathroom 1", lineItems: 9, total: 59524, items: [
    { name: "Bathroom Tile", category: "Surfaces", cost: 12500 },
    { name: "Vanity + Sink", category: "Plumbing", cost: 8500 },
    { name: "Shower/Tub", category: "Plumbing", cost: 11000 },
    { name: "Bathroom Electrical", category: "Electrical", cost: 4200 },
    { name: "Bathroom Flooring", category: "Surfaces", cost: 5800 },
    { name: "Bathroom Painting", category: "Painting", cost: 6524 },
    { name: "Bathroom Fixtures", category: "Plumbing", cost: 4500 },
    { name: "Bathroom Demolition", category: "Demolition", cost: 3500 },
    { name: "Bathroom Trim", category: "Trims", cost: 3000 },
  ]},
  { name: "Bathroom 2", lineItems: 8, total: 52085, items: [
    { name: "Bathroom Tile", category: "Surfaces", cost: 11000 },
    { name: "Vanity + Sink", category: "Plumbing", cost: 7500 },
    { name: "Shower/Tub", category: "Plumbing", cost: 10500 },
    { name: "Bathroom Electrical", category: "Electrical", cost: 3800 },
    { name: "Bathroom Flooring", category: "Surfaces", cost: 5285 },
    { name: "Bathroom Painting", category: "Painting", cost: 5500 },
    { name: "Bathroom Fixtures", category: "Plumbing", cost: 4500 },
    { name: "Bathroom Demolition", category: "Demolition", cost: 4000 },
  ]},
  { name: "Bathroom 3", lineItems: 7, total: 49635, items: [
    { name: "Bathroom Tile", category: "Surfaces", cost: 10500 },
    { name: "Vanity + Sink", category: "Plumbing", cost: 7000 },
    { name: "Shower/Tub", category: "Plumbing", cost: 10000 },
    { name: "Bathroom Electrical", category: "Electrical", cost: 3500 },
    { name: "Bathroom Flooring", category: "Surfaces", cost: 5135 },
    { name: "Bathroom Painting", category: "Painting", cost: 6500 },
    { name: "Bathroom Fixtures", category: "Plumbing", cost: 7000 },
  ]},
  { name: "Living Room", lineItems: 4, total: 31593, items: [
    { name: "Living Room Electrical", category: "Electrical", cost: 6125 },
    { name: "Living Room Flooring", category: "Flooring", cost: 8085 },
    { name: "Living Room Painting", category: "Painting", cost: 14149 },
    { name: "Living Room Trim", category: "Trims", cost: 3234 },
  ]},
  { name: "Bedroom 1", lineItems: 6, total: 18713, items: [
    { name: "Bedroom Flooring", category: "Flooring", cost: 5500 },
    { name: "Bedroom Painting", category: "Painting", cost: 6213 },
    { name: "Bedroom Electrical", category: "Electrical", cost: 2800 },
    { name: "Bedroom Closet", category: "Cabinetry", cost: 1800 },
    { name: "Bedroom Trim", category: "Trims", cost: 1400 },
    { name: "Bedroom Door", category: "Doors", cost: 1000 },
  ]},
  { name: "Bedroom 2", lineItems: 6, total: 9943, items: [
    { name: "Bedroom Flooring", category: "Flooring", cost: 3200 },
    { name: "Bedroom Painting", category: "Painting", cost: 2756 },
    { name: "Bedroom Electrical", category: "Electrical", cost: 1500 },
    { name: "Bedroom Closet", category: "Cabinetry", cost: 1200 },
    { name: "Bedroom Trim", category: "Trims", cost: 1225 },
    { name: "Bedroom Door", category: "Doors", cost: 62 },
  ]},
  { name: "Bedroom 3", lineItems: 3, total: 5556, items: [
    { name: "Bedroom Flooring", category: "Flooring", cost: 1575 },
    { name: "Bedroom Painting", category: "Painting", cost: 2756 },
    { name: "Bedroom Trim", category: "Trims", cost: 1225 },
  ]},
  { name: "Entire Apartment", lineItems: 7, total: 21858, items: [
    { name: "General Demolition", category: "Demolition", cost: 5500 },
    { name: "Debris Removal", category: "Demolition", cost: 3200 },
    { name: "General Conditions", category: "General", cost: 4800 },
    { name: "Permit Filing", category: "General", cost: 2500 },
    { name: "HVAC Adjustments", category: "HVAC", cost: 2858 },
    { name: "Fire Safety", category: "General", cost: 1500 },
    { name: "Final Cleaning", category: "General", cost: 1500 },
  ]},
];

// ── Room icons ──

const ROOM_ICON_MAP: Record<string, { icon: typeof Search; bg: string }> = {
  "Kitchen": { icon: Search, bg: "bg-amber-50" },
  "Bathroom": { icon: Droplets, bg: "bg-sky-50" },
  "Living Room": { icon: Sofa, bg: "bg-blue-50" },
  "Bedroom": { icon: BedDouble, bg: "bg-slate-100" },
  "Entire Apartment": { icon: Home, bg: "bg-rose-50" },
};

function getRoomIcon(name: string) {
  if (name.startsWith("Bathroom")) return ROOM_ICON_MAP["Bathroom"];
  if (name.startsWith("Bedroom")) return ROOM_ICON_MAP["Bedroom"];
  return ROOM_ICON_MAP[name] ?? { icon: Home, bg: "bg-gray-50" };
}

// ── Constants ──

const VERSIONS = [
  { label: "v3 (Current)", date: "Mar 15, 2026", desc: "Added island plumbing" },
  { label: "v2", date: "Mar 10, 2026", desc: "Removed backsplash" },
  { label: "v1", date: "Mar 5, 2026", desc: "Initial scope" },
];

const fmt = (n: number) => `$${n.toLocaleString()}`;

// ── Page ──

export default function ScopeEditorPage() {
  const router = useRouter();

  const [items, setItems] = useState<ScopeItem[]>(INITIAL_ITEMS);
  const [viewMode, setViewMode] = useState<"scope" | "room">("scope");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const enabledItems = items.filter(i => i.enabled);
  const totalLow = enabledItems.reduce((s, i) => s + i.lowPrice, 0);
  const totalHigh = enabledItems.reduce((s, i) => s + i.highPrice, 0);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[400px] w-[90%] animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-[#1E3A5F] text-white text-xs rounded-xl px-4 py-3 shadow-lg text-center">{toast}</div>
        </div>
      )}

      <div className="max-w-[430px] mx-auto min-h-[100dvh] bg-[#FAFBFC] flex flex-col relative shadow-xl">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E8ECF1]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/dashboard")} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft size={22} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-[16px] font-semibold text-foreground leading-tight">Scope Editor</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Kitchen Renovation &mdash; v3</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Clock size={14} /> History
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto">

          {/* ── Summary Card ── */}
          <div className="bg-[#F0F4F8] rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Scope Total</p>
                <p className="text-2xl font-bold text-foreground">{fmt(totalLow)} {'\u2013'} {fmt(totalHigh)}</p>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-semibold text-[#10B981]">Within range</span>
                <span className="text-[#10B981] text-xs">{'\u2713'}</span>
              </div>
            </div>
          </div>

          {/* ── Toggle Tabs ── */}
          <div className="flex rounded-lg border border-[#E8ECF1] p-1 mb-4 bg-[#F0F4F8]">
            <button
              onClick={() => setViewMode("scope")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                viewMode === "scope" ? "bg-white shadow-sm text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              <ListFilter size={14} /> By Scope Item
            </button>
            <button
              onClick={() => setViewMode("room")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                viewMode === "room" ? "bg-white shadow-sm text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              <Home size={14} /> By Room
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* ── BY SCOPE ITEM VIEW ── */}
          {/* ══════════════════════════════════════════════════════ */}
          {viewMode === "scope" && (
            <>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Scope Items ({enabledItems.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white border border-[#E8ECF1] rounded-xl p-4 transition-opacity ${item.enabled ? "" : "opacity-60"}`}
                    >
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
                      <p className={`text-xs leading-relaxed mb-2 ${item.enabled ? "text-muted-foreground" : "text-muted-foreground/70"}`}>{item.description}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>{fmt(item.lowPrice)} {'\u2013'} {fmt(item.highPrice)}</p>
                        <button className="flex items-center gap-1 text-xs font-medium text-[#1E3A5F] hover:text-[#2A4F7A] transition-colors">
                          <Eye size={12} /> View Details
                        </button>
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

          {/* ══════════════════════════════════════════════════════ */}
          {/* ── BY ROOM VIEW ── */}
          {/* ══════════════════════════════════════════════════════ */}
          {viewMode === "room" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Rooms ({ROOMS.length})
              </h3>
              <div className="space-y-3">
                {ROOMS.map((room) => {
                  const isExpanded = expandedRoom === room.name;
                  const iconCfg = getRoomIcon(room.name);
                  const RoomIcon = iconCfg.icon;

                  return (
                    <div key={room.name} className="bg-white border border-[#E8ECF1] rounded-xl overflow-hidden">
                      {/* Room header — always visible */}
                      <button
                        onClick={() => setExpandedRoom(isExpanded ? null : room.name)}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg ${iconCfg.bg} flex items-center justify-center shrink-0`}>
                          <RoomIcon size={20} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.lineItems} line items</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground shrink-0 mr-2">{fmt(room.total)}</p>
                        <ChevronDown
                          size={16}
                          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Expanded line items */}
                      {isExpanded && (
                        <div className="border-t border-[#E8ECF1]">
                          {room.items.map((li, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between px-4 py-3 ${idx > 0 ? "border-t border-[#E8ECF1]" : ""}`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{li.name}</p>
                                <p className="text-xs text-muted-foreground">{li.category}</p>
                              </div>
                              <p className="text-sm font-medium text-foreground shrink-0 ml-3">{fmt(li.cost)}</p>
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

          {/* ── View Bid Package ── */}
          <Button
            onClick={() => router.push("/bid-package")}
            className="w-full h-12 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 mb-6"
          >
            <FileText size={16} /> View Bid Package <ChevronRight size={16} />
          </Button>

          {/* ── Version History ── */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Version History</h3>
            <div className="bg-white border border-[#E8ECF1] rounded-xl overflow-hidden divide-y divide-[#E8ECF1]">
              {VERSIONS.map((v, i) => (
                <button key={i} className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-muted/30 transition-colors">
                  <Clock size={14} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{v.label}</p>
                    <p className="text-xs text-muted-foreground">{v.date} &mdash; {v.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="h-16" />
        </div>

        <BottomNav />
      </div>
    </>
  );
}

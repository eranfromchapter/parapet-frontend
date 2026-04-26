'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, CheckCircle2, Ruler, Home, ArrowRight, ScanLine,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = "/api/backend";

interface Room {
  id: string;
  room_type?: string;
  name?: string;
  photo_count?: number;
  dimensions?: string;
  // Backend names this field `floor_area_sf` (Polycam-derived, square feet).
  // Some legacy records / clients send `floor_area_sqft`. Read both.
  floor_area_sqft?: number;
  floor_area_sf?: number;
  overview?: { floor_area_sf?: number };
  features?: string;
}

interface PropertyOverview {
  total_livable_floor_area_sf?: number;
  total_exterior_floor_area_sf?: number;
}

interface SpatialModel {
  id?: string;
  spatial_id?: string;
  created_at?: string;
  rooms?: Room[];
  property_overview?: PropertyOverview;
  estimate_id?: string;
  estimate?: { id?: string };
}

function roomFloorArea(r: Room): number {
  return (
    r.floor_area_sf ??
    r.floor_area_sqft ??
    r.overview?.floor_area_sf ??
    0
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-2.5 bg-muted rounded w-1/2" />
      </div>
      <div className="w-4 h-4 bg-muted rounded" />
    </div>
  );
}

export default function SpatialScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spatialId = params.id as string;

  const [spatial, setSpatial] = useState<SpatialModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backPath, setBackPath] = useState<string>("/capture");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const from = new URLSearchParams(window.location.search).get("from");
      if (from === "vault") setBackPath("/documents");
      else if (from === "alerts") setBackPath("/notifications");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`${API_URL}/v1/spatial/${spatialId}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to load scan (${res.status})`);
        const data = await res.json();
        setSpatial(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load scan");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [spatialId]);

  const rooms: Room[] = spatial?.rooms ?? [];
  // Prefer the parser-reported total (authoritative) over per-room sum,
  // which can be 0 when room-level area is unpopulated. Eran's Day 44 test
  // surfaced this — backend was reporting total_livable_floor_area_sf
  // correctly but the frontend wasn't reading it, so the spatial report
  // showed no total square footage.
  const totalSqft = (() => {
    const fromOverview = spatial?.property_overview?.total_livable_floor_area_sf;
    if (fromOverview && fromOverview > 0) return fromOverview;
    const summed = rooms.reduce((sum, r) => sum + roomFloorArea(r), 0);
    return summed;
  })();
  const existingEstimateId = spatial?.estimate_id || spatial?.estimate?.id;

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background shadow-xl">
        <PageHeader title="Space Scan" subtitle="LiDAR scan overview" backPath={backPath} />
        <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto safe-bottom">
          {/* Summary skeleton */}
          <div className="rounded-xl border border-border/50 p-4 mb-4 animate-pulse">
            <div className="h-2.5 bg-muted rounded w-24 mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(n => (
                <div key={n} className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="h-5 bg-muted rounded w-10" />
                  <div className="h-2.5 bg-muted rounded w-12" />
                </div>
              ))}
            </div>
          </div>
          {/* Rooms skeleton */}
          <div className="h-2.5 bg-muted rounded w-28 mb-2 animate-pulse" />
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30 overflow-hidden">
            {[0, 1, 2].map(n => <SkeletonRow key={n} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !spatial) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Scan not available</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{error || "Scan data is missing."}</p>
        <button
          onClick={() => router.push("/capture")}
          className="text-sm font-medium text-[#1E3A5F] hover:underline"
        >
          Back to Space Capture
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background shadow-xl">
      <PageHeader title="Space Scan" subtitle="LiDAR scan overview" backPath={backPath} />

      <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto safe-bottom">

        {/* ── Summary Card ── */}
        <Card className="p-4 mb-4 rounded-xl border border-border/50">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Scan Summary</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center mx-auto mb-1.5">
                <Home size={16} className="text-[#1E3A5F]" />
              </div>
              <p className="text-lg font-bold text-foreground">{rooms.length}</p>
              <p className="text-[10px] text-muted-foreground">rooms</p>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-[#2BCBBA]/10 flex items-center justify-center mx-auto mb-1.5">
                <Ruler size={16} className="text-[#2BCBBA]" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {totalSqft > 0 ? Math.round(totalSqft).toLocaleString() : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">total sq ft</p>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-[#2BCBBA]/10 flex items-center justify-center mx-auto mb-1.5">
                <ScanLine size={16} className="text-[#2BCBBA]" />
              </div>
              <p className="text-[11px] font-semibold text-foreground leading-tight">
                {spatial.created_at
                  ? new Date(spatial.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">scan date</p>
            </div>
          </div>
        </Card>

        {/* ── Rooms List ── */}
        {rooms.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Captured Rooms</h3>
            <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30 overflow-hidden">
              {rooms.map((room, i) => {
                const roomName = room.name ?? room.room_type ?? `Room ${i + 1}`;
                const showTypeBadge = room.room_type && room.room_type !== room.name && room.name;
                // Backend now stamps an id on every Room (Day 44 fix). For
                // safety against legacy or partially-backfilled records,
                // disable navigation when the id is missing rather than
                // routing the user to /room/undefined.
                const navigable = Boolean(room.id);
                return (
                  <button
                    key={room.id ?? `idx-${i}-${roomName}`}
                    onClick={navigable ? () => router.push(`/capture/${spatialId}/room/${room.id}`) : undefined}
                    disabled={!navigable}
                    className={`flex items-center gap-3 px-3.5 py-3.5 w-full text-left transition-colors ${
                      navigable ? "hover:bg-muted/30" : "opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-xs font-semibold text-foreground truncate">{roomName}</p>
                        {showTypeBadge && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#2BCBBA]/15 text-[#1E8A7E] whitespace-nowrap shrink-0">
                            {room.room_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {room.dimensions && <span>{room.dimensions}</span>}
                        {roomFloorArea(room) > 0 && (
                          <>
                            {room.dimensions && <span>&middot;</span>}
                            <span>{Math.round(roomFloorArea(room))} sq ft</span>
                          </>
                        )}
                      </div>
                      {room.features && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{room.features}</p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="p-6 mb-4 rounded-xl border border-border/50 text-center">
            <ScanLine size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No rooms detected</p>
            <p className="text-[11px] text-muted-foreground">This scan didn&apos;t include room data.</p>
          </Card>
        )}

        {/* ── CTA ── */}
        {existingEstimateId ? (
          <Button
            onClick={() => router.push(`/estimate/${existingEstimateId}`)}
            className="w-full h-12 font-semibold text-sm rounded-xl bg-[#2BCBBA] hover:bg-[#25B5A6] text-white shadow-lg shadow-[#2BCBBA]/20 gap-2"
          >
            View Estimate <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={() => router.push(`/estimate-generating?spatial_id=${spatialId}`)}
            disabled={rooms.length === 0}
            className="w-full h-12 font-semibold text-sm rounded-xl bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white shadow-lg shadow-[#1E3A5F]/20 gap-2 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
          >
            Generate Estimate <ArrowRight size={16} />
          </Button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

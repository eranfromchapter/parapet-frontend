'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Ruler, Camera, Layers } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { FloorPlanPreview } from "@/components/FloorPlanPreview";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = "/api/backend";

// The Polycam parser writes per-room measurements to two places:
//   * room.overview.* — RoomOverview (dimensions_bounding, dimensions_inscribed,
//     floor_area_sf, perimeter_ft, ceiling_height, room_volume_cf, etc).
//   * top-level Room.* — duplicate measurement fields (floor_area_sf,
//     wall_area_sf, perimeter_lf, etc) populated by the estimation engine.
// We accept both naming patterns plus the legacy `floor_area_sqft` so the
// page works regardless of which serialization path the backend used.
interface CeilingHeight {
  min_ft?: number;
  max_ft?: number;
  is_approx?: boolean;
}

interface RoomOverview {
  floor_area_sf?: number;
  wall_area_incl_openings_sf?: number;
  wall_area_excl_openings_sf?: number;
  perimeter_ft?: number;
  ceiling_height?: CeilingHeight | null;
  room_volume_cf?: number;
  dimensions_bounding?: string;
  dimensions_inscribed?: string;
}

interface Room {
  id: string;
  room_type?: string;
  name?: string;
  photo_count?: number;
  dimensions?: string;
  floor_area_sqft?: number;
  floor_area_sf?: number;
  wall_area_sf?: number;
  perimeter_lf?: number;
  overview?: RoomOverview;
  features?: string;
}

// IMPORTANT: read overview.* FIRST and use `||` (not `??`). The Pydantic
// Room model sets `floor_area_sf: float = 0.0` (and likewise for wall/
// perimeter) at the top level — those are "Estimation engine fields"
// populated only when an estimate has been generated. The Polycam parser
// writes the authoritative measurements to `room.overview.*`. When a scan
// hasn't gone through the estimation engine, `r.floor_area_sf === 0`, and
// `??` would NOT fall through to `overview` (since 0 isn't nullish). Day 44
// round-2 shipped this with `??` and silently rendered an empty card — fix
// is to prefer the parser fields and treat 0 as "missing" via `||`.
function roomFloorArea(r: Room | null): number {
  if (!r) return 0;
  return (
    r.overview?.floor_area_sf ||
    r.floor_area_sf ||
    r.floor_area_sqft ||
    0
  );
}
function roomWallArea(r: Room | null): number {
  if (!r) return 0;
  return (
    r.overview?.wall_area_excl_openings_sf ||
    r.overview?.wall_area_incl_openings_sf ||
    r.wall_area_sf ||
    0
  );
}
function roomPerimeter(r: Room | null): number {
  if (!r) return 0;
  return r.overview?.perimeter_ft || r.perimeter_lf || 0;
}
function roomVolume(r: Room | null): number {
  if (!r) return 0;
  return r.overview?.room_volume_cf || 0;
}
function formatCeilingHeight(c: CeilingHeight | null | undefined): string | null {
  if (!c || c.min_ft == null) return null;
  const min = c.min_ft.toFixed(1);
  if (c.max_ft != null && c.max_ft > c.min_ft) {
    return `${min}–${c.max_ft.toFixed(1)} ft`;
  }
  return `${min} ft${c.is_approx ? " (approx)" : ""}`;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spatialId = params.id as string;
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const rooms: Room[] = data.rooms ?? [];
        const found = rooms.find((r) => r.id === roomId) ?? null;
        if (!found) throw new Error("Room not found in this scan");
        setRoom(found);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load room");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [spatialId, roomId]);

  const roomName = room?.name ?? room?.room_type ?? "Room";
  const featureList = room?.features
    ? room.features.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background shadow-xl">
        <PageHeader title="Room Detail" backPath={`/capture/${spatialId}`} />
        <div className="flex-1 px-4 pt-4 pb-4 space-y-3">
          {[0, 1, 2].map((n) => (
            <div key={n} className="rounded-xl border border-border/50 p-4 animate-pulse">
              <div className="h-2.5 bg-muted rounded w-24 mb-3" />
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Room not available</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{error || "Room data is missing."}</p>
        <button
          onClick={() => router.push(`/capture/${spatialId}`)}
          className="text-sm font-medium text-[#1E3A5F] hover:underline"
        >
          Back to Scan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background shadow-xl">
      <PageHeader title={roomName} subtitle="Room detail" backPath={`/capture/${spatialId}`} />

      <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto safe-bottom space-y-3">

        <FloorPlanPreview spatialId={spatialId} />

        {/* ── Type Badge ── */}
        {room.room_type && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2BCBBA]/15 text-[#1E8A7E]">
              {room.room_type}
            </span>
            {room.photo_count != null && room.photo_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1E3A5F]/8 text-[#1E3A5F]">
                <Camera size={11} />
                {room.photo_count} photo{room.photo_count !== 1 ? "s" : ""} captured
              </span>
            )}
          </div>
        )}

        {/* ── Dimensions Card ── */}
        {(() => {
          const floorArea = roomFloorArea(room);
          const wallArea = roomWallArea(room);
          const perimeter = roomPerimeter(room);
          const volume = roomVolume(room);
          const ceilingLabel = formatCeilingHeight(room.overview?.ceiling_height);
          const dimsBounding = room.overview?.dimensions_bounding ?? room.dimensions ?? null;
          const dimsInscribed = room.overview?.dimensions_inscribed ?? null;
          const hasAny =
            floorArea > 0 || wallArea > 0 || perimeter > 0 || volume > 0 ||
            ceilingLabel || dimsBounding || dimsInscribed;

          if (!hasAny) return null;

          return (
            <Card className="p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Ruler size={14} className="text-[#1E3A5F]" />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dimensions</h3>
              </div>

              {/* Primary tiles: floor area + dimensions */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {dimsBounding && (
                  <div className="rounded-lg bg-[#1E3A5F]/5 p-3 col-span-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Floor plan (bounding)</p>
                    <p className="text-base font-bold text-foreground">{dimsBounding}</p>
                    {dimsInscribed && (
                      <p className="text-[10px] text-muted-foreground/80 mt-1">Inscribed: {dimsInscribed}</p>
                    )}
                  </div>
                )}
                {floorArea > 0 && (
                  <div className="rounded-lg bg-[#2BCBBA]/8 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">Floor area</p>
                    <p className="text-base font-bold text-foreground">
                      {Math.round(floorArea).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground ml-1">sq ft</span>
                    </p>
                  </div>
                )}
                {wallArea > 0 && (
                  <div className="rounded-lg bg-[#1E3A5F]/5 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">Wall area</p>
                    <p className="text-base font-bold text-foreground">
                      {Math.round(wallArea).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground ml-1">sq ft</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Secondary row: perimeter + ceiling + volume */}
              {(perimeter > 0 || ceilingLabel || volume > 0) && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
                  {perimeter > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Perimeter</p>
                      <p className="text-sm font-semibold text-foreground">
                        {perimeter.toFixed(1)}
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">ft</span>
                      </p>
                    </div>
                  )}
                  {ceilingLabel && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Ceiling</p>
                      <p className="text-sm font-semibold text-foreground">{ceilingLabel}</p>
                    </div>
                  )}
                  {volume > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Volume</p>
                      <p className="text-sm font-semibold text-foreground">
                        {Math.round(volume).toLocaleString()}
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">cu ft</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })()}

        {/* ── Features Card ── */}
        {featureList.length > 0 && (
          <Card className="p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-[#1E3A5F]" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Room Features</h3>
            </div>
            <ul className="space-y-2">
              {featureList.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-foreground capitalize">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ── Photo Count indicator (when features absent) ── */}
        {featureList.length === 0 && room.photo_count != null && room.photo_count > 0 && (
          <Card className="p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
                <Camera size={18} className="text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {room.photo_count} photo{room.photo_count !== 1 ? "s" : ""} captured
                </p>
                <p className="text-[10px] text-muted-foreground">Photo viewer coming soon</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── 3D Scan badge ── */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/50">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[11px] font-medium text-emerald-800">LiDAR 3D scanned</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Ruler, Camera, Layers } from "lucide-react";
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
  floor_area_sqft?: number;
  features?: string;
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
        <Card className="p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Ruler size={14} className="text-[#1E3A5F]" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dimensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {room.dimensions && (
              <div className="rounded-lg bg-[#1E3A5F]/5 p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Floor plan</p>
                <p className="text-base font-bold text-foreground">{room.dimensions}</p>
              </div>
            )}
            {room.floor_area_sqft != null && room.floor_area_sqft > 0 && (
              <div className="rounded-lg bg-[#2BCBBA]/8 p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Floor area</p>
                <p className="text-base font-bold text-foreground">
                  {Math.round(room.floor_area_sqft).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">sq ft</span>
                </p>
              </div>
            )}
          </div>
        </Card>

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

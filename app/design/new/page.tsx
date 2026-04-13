'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Home, ImagePlus, Lightbulb, Link2, Tag, Mic, X,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

const STYLE_KEYWORDS = [
  "Modern", "Minimalist", "Scandinavian", "Industrial", "Bohemian", "Farmhouse",
  "Mid-Century", "Traditional", "Coastal", "Contemporary", "Art Deco", "Japandi",
];

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

interface Room {
  name: string;
  sqft: number;
  features: string;
}

export default function DesignNewPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [visionText, setVisionText] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Load rooms from spatial API ──

  useEffect(() => {
    async function loadRooms() {
      const spatialId = (() => { try { return localStorage.getItem("parapet_spatial_id"); } catch { return null; } })();
      if (!spatialId) {
        setRoomsError("no_scan");
        setRoomsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/v1/spatial/${spatialId}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Failed to load spatial data (${res.status})`);
        const data = await res.json();
        const rawRooms: any[] = data.rooms ?? [];
        if (rawRooms.length === 0) {
          setRoomsError("no_rooms");
          setRoomsLoading(false);
          return;
        }
        setRooms(rawRooms.map((r: any) => ({
          name: String(
            typeof r.resolved_type === "object" && r.resolved_type
              ? r.resolved_type.resolved_type || r.resolved_type.original_name || r.name || "Room"
              : r.resolved_type || r.name || "Room"
          ).replace(/_/g, " "),
          sqft: Math.round(Number(r.overview?.floor_area_sf || r.floor_area_sf || r.floor_area) || 0),
          features: [...(r.fixtures ?? []), ...(r.appliances ?? [])]
            .map((f: any) => typeof f === "string" ? f : f.name ?? f.type ?? "")
            .filter(Boolean)
            .map((s: string) => s.replace(/_/g, " "))
            .join(", ") || "No fixtures detected",
        })));
      } catch (err) {
        setRoomsError(err instanceof Error ? err.message : "Failed to load rooms");
      } finally {
        setRoomsLoading(false);
      }
    }
    loadRooms();
  }, []);

  // ── Cleanup photo previews & speech on unmount ──

  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !links.includes(trimmed)) {
      setLinks([...links, trimmed]);
      setLinkInput("");
    }
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  // ── Photo handling ──

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      showToast("Maximum 5 photos reached");
      return;
    }

    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > MAX_PHOTO_SIZE);
    if (oversized.length > 0) {
      showToast(`${oversized.length} file${oversized.length > 1 ? "s" : ""} exceeded 5MB limit`);
    }

    const valid = toAdd.filter(f => f.size <= MAX_PHOTO_SIZE);
    if (valid.length > 0) {
      setPhotos(prev => [
        ...prev,
        ...valid.map(file => ({ file, preview: URL.createObjectURL(file) })),
      ]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Speech recognition ──

  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    const baseText = visionText;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVisionText(baseText + (baseText ? " " : "") + transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
    recognitionRef.current = recognition;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, visionText]);

  // ── Generate design ──

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const room = rooms[selectedRoom];
      const res = await fetch(`${API_URL}/v1/design/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          room_type: room.name,
          room_data: {
            floor_area_sqft: room.sqft,
            features: room.features,
          },
          style_preferences: {
            keywords: selectedKeywords,
            vision_text: visionText,
            inspiration_links: links,
            reference_image_count: photos.length,
          },
        }),
      });
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "design_limit_reached") {
          showToast("Design limit reached. You can create up to 3 designs on the free tier.");
        } else {
          showToast("Not authorized to create a design.");
        }
        setGenerating(false);
        return;
      }
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      const sessionId = data.session_id || data.id;
      router.push(`/design/generating?session=${sessionId}`);
    } catch {
      showToast("Failed to generate design. Please try again.");
      setGenerating(false);
    }
  };

  // ── Loading / error states ──

  if (roomsLoading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (roomsError) {
    const noScan = roomsError === "no_scan";
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-[#FAFBFC] px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">
          {noScan ? "No space data yet" : "Could not load rooms"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {noScan
            ? "Upload a Polycam scan first so Design Studio can use your real room data."
            : roomsError}
        </p>
        <button onClick={() => router.push("/capture")} className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A]">
          Go to Space Capture
        </button>
      </div>
    );
  }

  // ── Main render ──

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[400px] w-[90%] animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-[#1E3A5F] text-white text-xs rounded-xl px-4 py-3 shadow-lg text-center">{toast}</div>
        </div>
      )}

      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="New Design" subtitle="AI-Powered Design Concepts" backPath="/design" />

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-5">

          {/* Material Match AI */}
          <div className="bg-[#F0F4F8] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-[#1E3A5F]" />
              <h2 className="text-sm font-semibold text-foreground">Material Match AI</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Using your space capture data, our AI generates personalized design concepts with coordinated materials, finishes, and lighting — tailored to your room dimensions and renovation scope.
            </p>
          </div>

          {/* Select Room */}
          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <Home size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Select Room to Design</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Based on your space capture, choose which room you&apos;d like to generate design concepts for.</p>
            <div className="space-y-2">
              {rooms.map((room, i) => (
                <button
                  key={room.name}
                  onClick={() => setSelectedRoom(i)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-colors text-left ${
                    selectedRoom === i
                      ? "border-[#1E3A5F] bg-[#1E3A5F]/[0.04]"
                      : "border-border/60 bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.sqft} sq ft &middot; {room.features}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedRoom === i ? "border-[#1E3A5F]" : "border-gray-300"
                  }`}>
                    {selectedRoom === i && <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A5F]" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Reference Photos */}
          <section>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center text-center hover:border-[#1E3A5F]/30 transition-colors"
              >
                <ImagePlus size={28} className="text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground mb-1">Add Reference Photos</p>
                <p className="text-xs text-muted-foreground">Tap to select up to {MAX_PHOTOS} images (max 5MB each)</p>
              </button>
            )}

            {photos.length >= MAX_PHOTOS && (
              <div className="rounded-xl bg-[#F0F4F8] p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">Maximum {MAX_PHOTOS} photos reached</p>
              </div>
            )}

            {photos.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">{photos.length} of {MAX_PHOTOS} photos</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((p, i) => (
                    <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Your Vision */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-[#1E3A5F]" />
                <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Your Vision</h3>
              </div>
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-[#1E3A5F] bg-[#1E3A5F]/10"
                }`}
              >
                <Mic size={12} /> {isListening ? "Listening..." : "Speak"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Describe your dream space, style preferences, or specific ideas</p>
            <textarea
              value={visionText}
              onChange={(e) => setVisionText(e.target.value)}
              placeholder="Example: I want a modern spa-like bathroom with clean lines, high-quality natural materials, soft layered lighting, and a sense of tranquility..."
              className="w-full h-28 rounded-xl border border-border/60 bg-white p-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            />
          </section>

          {/* Inspiration Links */}
          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <Link2 size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Design Inspiration Links</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Add links from Pinterest, Instagram, Houzz, or any design websites</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                  placeholder="Paste a link..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>
              <button onClick={addLink} className="h-10 px-4 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium shrink-0">Add</button>
            </div>
            {links.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#1E3A5F] bg-[#F0F4F8] rounded-lg px-3 py-2">
                    <Link2 size={12} className="shrink-0" />
                    <span className="truncate">{link}</span>
                    <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="ml-auto text-muted-foreground shrink-0">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Style Keywords */}
          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <Tag size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Style Keywords</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Select design styles that match your preferences</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_KEYWORDS.map(kw => (
                <button
                  key={kw}
                  onClick={() => toggleKeyword(kw)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedKeywords.includes(kw)
                      ? "bg-[#1E3A5F] text-white"
                      : "bg-white border border-border/60 text-foreground"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </section>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 disabled:opacity-60"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} />
                Generate Design
              </>
            )}
          </button>

          <div className="h-4" />
        </div>

        <BottomNav />
      </div>
    </>
  );
}

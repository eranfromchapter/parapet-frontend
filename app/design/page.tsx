'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Home, ImagePlus, Lightbulb, Link2, Tag, Mic,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

const STATIC_ROOMS = [
  { name: "Kitchen", sqft: 160, features: "Cabinets, Island, Sink" },
  { name: "Bathroom 1", sqft: 80, features: "Shower, Vanity" },
  { name: "Bathroom 2", sqft: 60, features: "Tub, Vanity" },
  { name: "Living Room", sqft: 770, features: "Open plan, Fireplace" },
  { name: "Bedroom 1", sqft: 180, features: "Closet, En-suite" },
  { name: "Bedroom 2", sqft: 150, features: "Closet" },
];

const STYLE_KEYWORDS = [
  "Modern", "Minimalist", "Scandinavian", "Industrial", "Bohemian", "Farmhouse",
  "Mid-Century", "Traditional", "Coastal", "Contemporary", "Art Deco", "Japandi",
];

export default function DesignVisionPage() {
  const router = useRouter();
  const [rooms] = useState(STATIC_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [visionText, setVisionText] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

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
            reference_image_count: 0,
          },
        }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      const sessionId = data.session_id || data.id;
      router.push(`/design/generating?session=${sessionId}`);
    } catch {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Design Studio" subtitle="AI-Powered Design Concepts" backPath="/dashboard" />

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
          <div className="border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center text-center">
            <ImagePlus size={28} className="text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">Add Reference Photos</p>
            <p className="text-xs text-muted-foreground">Tap to select up to 5 images from your gallery</p>
          </div>
        </section>

        {/* Your Vision */}
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Your Vision</h3>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-[#1E3A5F] bg-[#1E3A5F]/10 px-3 py-1 rounded-full">
              <Mic size={12} /> Speak
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
  );
}

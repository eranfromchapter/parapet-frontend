'use client';

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Camera, Star, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const backPath = searchParams.get("from") === "vault" ? "/documents" : "/design";

  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSession(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const concepts: any[] = session?.concepts ?? [];
  const concept = concepts[activeTab];
  const conceptCount = concepts.length;

  const toggleFavorite = (idx: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader
        title="Design Concepts"
        subtitle={`${conceptCount} AI-Generated Option${conceptCount !== 1 ? "s" : ""}`}
        backPath={backPath}
      />

      {/* Tab bar */}
      {concepts.length > 0 && (
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {concepts.map((c: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === i
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-white border border-border/60 text-muted-foreground"
                }`}
              >
                {c.name || `Concept ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        {concept ? (
          <>
            {/* Title */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{concept.name}</h2>
                {concept.sub_style && (
                  <p className="text-xs text-muted-foreground">{concept.sub_style}</p>
                )}
              </div>
              <button onClick={() => toggleFavorite(activeTab)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Heart
                  size={20}
                  className={favorites.has(activeTab) ? "text-red-500 fill-red-500" : "text-muted-foreground"}
                />
              </button>
            </div>

            {/* Render grid */}
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map(idx => {
                const renderUrl: string | undefined = concept.render_urls?.[idx];
                const palette: string[] = concept.palette ?? ["#1E3A5F", "#2BCBBA", "#F0F4F8", "#E8ECF1"];
                const bg = `linear-gradient(135deg, ${palette[0] || "#1E3A5F"}, ${palette[Math.min(idx + 1, palette.length - 1)] || "#2BCBBA"})`;
                return (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden relative" style={renderUrl ? undefined : { background: bg }}>
                    {renderUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={renderUrl} alt={`${concept.name} render ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Camera size={20} className="text-white/60 mb-1" />
                        <span className="text-[10px] text-white/60 font-medium">AI Render {idx + 1}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[9px] bg-black/30 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {concept.sub_style || concept.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Palette */}
            {concept.palette && concept.palette.length > 0 && (
              <section>
                <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">Palette</h3>
                <div className="flex gap-3">
                  {concept.palette.map((hex: string, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full border border-border/40" style={{ backgroundColor: hex }} />
                      <span className="text-[9px] text-muted-foreground">{hex}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Key Materials */}
            {concept.key_materials && concept.key_materials.length > 0 && (
              <section>
                <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">Key Materials</h3>
                <div className="flex flex-wrap gap-2">
                  {concept.key_materials.map((mat: string, i: number) => {
                    let shortName: string;
                    if (mat.includes(":")) {
                      shortName = mat.split(":")[0].trim();
                    } else if (mat.includes("(")) {
                      shortName = mat.split("(")[0].trim().replace(/,\s*$/, "");
                    } else {
                      shortName = mat.length > 40 ? mat.slice(0, 37) + "\u2026" : mat;
                    }
                    return (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-white border border-border/60 text-xs font-medium text-foreground">
                        {shortName}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Design Highlights */}
            {concept.design_highlights && concept.design_highlights.length > 0 && (
              <section>
                <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">Design Highlights</h3>
                <div className="grid grid-cols-2 gap-2">
                  {concept.design_highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 bg-white rounded-xl border border-border/60 p-3">
                      <Star size={12} className="text-[#F59E0B] shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Budget Impact */}
            {concept.estimated_budget_impact && (
              <section>
                <div className="bg-white rounded-xl border border-border/60 p-4 border-l-4 border-l-[#F59E0B]">
                  <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                    Estimated Budget Impact
                  </h3>
                  <p className="text-lg font-bold text-foreground">
                    {(() => {
                      const b = concept.estimated_budget_impact;
                      if (typeof b === "string") return b;
                      const lo = b.min ?? b.low;
                      const hi = b.max ?? b.high;
                      if (lo != null && hi != null) return `$${lo.toLocaleString()} \u2013 $${hi.toLocaleString()}`;
                      if (lo != null) return `$${lo.toLocaleString()}+`;
                      return "Contact for estimate";
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Based on your room dimensions and material selections</p>
                </div>
              </section>
            )}

            {/* View Report Button */}
            <button
              onClick={() => router.push(`/design/report?session=${sessionId}&concept=${activeTab}`)}
              className="w-full bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20"
            >
              View Design Report
            </button>

            <div className="h-4" />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Sparkles size={32} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No design concepts available yet.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function DesignResultsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

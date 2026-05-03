'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Camera, Star, Sparkles, Check, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { toast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

interface MaterialItem {
  key: string;
  name: string;
  shortName: string;
  category: string;
  room: string;
  estimatedCost: number;
  quantity: number;
  unit: string;
  hasPricing: boolean;
}

interface MaterialSelection {
  material_name: string;
  category: string;
  room: string;
  estimated_cost: number;
  quantity: number;
  unit: string;
  selected: boolean;
}

function shortenMaterial(mat: string): string {
  if (mat.includes(":")) return mat.split(":")[0].trim();
  if (mat.includes("(")) return mat.split("(")[0].trim().replace(/,\s*$/, "");
  return mat.length > 40 ? mat.slice(0, 37) + "…" : mat;
}

function buildMaterials(concept: any): MaterialItem[] {
  if (!concept) return [];
  // Prefer the structured material_recommendations payload when the backend
  // provides it; fall back to key_materials, which is a flat string list
  // with no pricing data.
  const recs = concept.material_recommendations;
  if (Array.isArray(recs) && recs.length > 0) {
    return recs.map((m: any, i: number) => {
      const name = m?.material_name ?? m?.name ?? `Material ${i + 1}`;
      const cost = typeof m?.estimated_cost === "number" ? m.estimated_cost : 0;
      return {
        key: typeof m?.id === "string" ? m.id : `rec-${i}-${name}`,
        name,
        shortName: shortenMaterial(name),
        category: typeof m?.category === "string" ? m.category : "general",
        room: typeof m?.room === "string" ? m.room : "general",
        estimatedCost: cost,
        quantity: typeof m?.quantity === "number" ? m.quantity : 1,
        unit: typeof m?.unit === "string" ? m.unit : "ea",
        hasPricing: cost > 0,
      };
    });
  }
  const keys = concept.key_materials;
  if (Array.isArray(keys)) {
    return keys.map((mat: string, i: number) => ({
      key: `km-${i}`,
      name: mat,
      shortName: shortenMaterial(mat),
      category: "general",
      room: "general",
      estimatedCost: 0,
      quantity: 1,
      unit: "ea",
      hasPricing: false,
    }));
  }
  return [];
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const fromParam = searchParams.get("from");
  const fromVault = fromParam === "vault";
  const fromAlerts = fromParam === "alerts";
  const backPath = fromAlerts ? "/notifications" : fromVault ? "/documents" : "/design";

  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  // Server-backed: at most one favorited concept per session.
  const [favoriteIndex, setFavoriteIndex] = useState<number | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);

  // Per-concept selection set (key = material.key). Initialized to "all
  // selected" the first time we see materials for a concept; the user can
  // un-check anything they don't want before tapping Confirm Selections.
  const [selectedByConcept, setSelectedByConcept] = useState<Record<number, Set<string>>>({});
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<
    | { ok: true; conceptIndex: number; costDelta?: number }
    | { ok: false; error: string }
    | null
  >(null);
  // Server state: was this design's materials already synced to an estimate?
  const [confirmedRemote, setConfirmedRemote] = useState<{
    confirmed: boolean;
    conceptIndex?: number;
    syncedAt?: string;
    selectionKeys?: Set<string>;
  } | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSession(data);
      const fav = data?.favorited_concept_index;
      setFavoriteIndex(typeof fav === "number" ? fav : null);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // Load any existing material confirmation for this session so we can show
  // "already synced" UI and prefill selections.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/v1/design/${sessionId}/confirmed-materials`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (cancelled || !data) return;
        const confirmed = !!data.confirmed;
        const conceptIndex = typeof data.concept_index === "number" ? data.concept_index : undefined;
        const syncedAt = typeof data.synced_at === "string" ? data.synced_at : undefined;
        // Server may return either an array of selections or material_keys.
        const selections: any[] = Array.isArray(data.selections) ? data.selections : [];
        const selectionKeys = new Set<string>();
        for (const sel of selections) {
          const name = sel?.material_name ?? sel?.name;
          if (typeof name === "string" && (sel?.selected ?? true)) {
            selectionKeys.add(name);
          }
        }
        setConfirmedRemote({ confirmed, conceptIndex, syncedAt, selectionKeys });
      } catch {
        /* not-found / no auth — leave confirmedRemote null */
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const concepts: any[] = session?.concepts ?? [];
  const concept = concepts[activeTab];
  const conceptCount = concepts.length;
  const materials = useMemo<MaterialItem[]>(() => buildMaterials(concept), [concept]);

  // Initialize selection to "all selected" the first time a concept's
  // materials become known. If the server has a previous confirmation for
  // THIS concept, prefill from those selections instead.
  useEffect(() => {
    if (materials.length === 0) return;
    setSelectedByConcept((prev) => {
      if (prev[activeTab]) return prev; // already initialized for this tab
      const next = new Set<string>();
      const remoteForThis =
        confirmedRemote?.confirmed && confirmedRemote.conceptIndex === activeTab
          ? confirmedRemote.selectionKeys
          : null;
      for (const m of materials) {
        if (remoteForThis ? remoteForThis.has(m.name) : true) {
          next.add(m.key);
        }
      }
      return { ...prev, [activeTab]: next };
    });
  }, [materials, activeTab, confirmedRemote]);

  const selectedSet = selectedByConcept[activeTab] ?? new Set<string>();
  const toggleMaterial = (matKey: string) => {
    setSelectedByConcept((prev) => {
      const cur = new Set(prev[activeTab] ?? []);
      if (cur.has(matKey)) cur.delete(matKey); else cur.add(matKey);
      return { ...prev, [activeTab]: cur };
    });
    // If the user starts editing after a successful confirm banner, hide it
    // so they can re-confirm with the new selection.
    if (confirmResult?.ok) setConfirmResult(null);
  };

  const confirmMaterials = async () => {
    if (!sessionId || materials.length === 0) return;
    const selectionsPayload: MaterialSelection[] = materials.map((m) => ({
      material_name: m.name,
      category: m.category,
      room: m.room,
      estimated_cost: m.estimatedCost,
      quantity: m.quantity,
      unit: m.unit,
      selected: selectedSet.has(m.key),
    }));
    setConfirming(true);
    setConfirmResult(null);
    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}/confirm-materials`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          concept_index: activeTab,
          selections: selectionsPayload,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server responded ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      const costDelta = typeof data?.cost_delta === "number" ? data.cost_delta : undefined;
      setConfirmResult({ ok: true, conceptIndex: activeTab, costDelta });
      setConfirmedRemote({
        confirmed: true,
        conceptIndex: activeTab,
        syncedAt: typeof data?.synced_at === "string" ? data.synced_at : new Date().toISOString(),
        selectionKeys: new Set(selectionsPayload.filter((s) => s.selected).map((s) => s.material_name)),
      });
    } catch (err) {
      setConfirmResult({ ok: false, error: err instanceof Error ? err.message : "Couldn't sync materials" });
    } finally {
      setConfirming(false);
    }
  };

  // Optimistically flip the heart, then persist. Tapping the already-favorited
  // concept clears the favorite (concept_index: null).
  const toggleFavorite = useCallback(async (idx: number) => {
    if (!sessionId) return;
    const previous = favoriteIndex;
    const nextValue = previous === idx ? null : idx;
    setFavoriteIndex(nextValue);
    setSavingFavorite(true);
    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}/favorite`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ concept_index: nextValue }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server responded ${res.status}`);
      }
    } catch (err) {
      setFavoriteIndex(previous);
      toast({
        variant: "destructive",
        title: "Couldn't update favorite",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSavingFavorite(false);
    }
  }, [sessionId, favoriteIndex]);

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
              <button
                onClick={() => toggleFavorite(activeTab)}
                disabled={savingFavorite}
                aria-label={favoriteIndex === activeTab ? "Unfavorite this concept" : "Favorite this concept"}
                aria-pressed={favoriteIndex === activeTab}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-60"
              >
                <Heart
                  size={20}
                  className={favoriteIndex === activeTab ? "text-red-500 fill-red-500" : "text-muted-foreground"}
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

            {/* Key Materials \u2014 selectable, sync to estimate via /confirm-materials */}
            {materials.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Key Materials</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedSet.size} of {materials.length} selected
                  </span>
                </div>

                {/* "Already synced" notice for this concept. */}
                {confirmedRemote?.confirmed && confirmedRemote.conceptIndex === activeTab && !confirmResult?.ok && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-[11px] text-emerald-900 leading-relaxed">
                      <p className="font-semibold">Materials already synced to your estimate</p>
                      {confirmedRemote.syncedAt && (
                        <p className="text-emerald-800/80">
                          Synced {new Date(confirmedRemote.syncedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {materials.map((m) => {
                    const isSelected = selectedSet.has(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleMaterial(m.key)}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          isSelected
                            ? "bg-[#1E3A5F]/[0.04] border-[#1E3A5F]/30"
                            : "bg-white border-border/60 hover:border-border"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected ? "bg-[#1E3A5F] border-[#1E3A5F] text-white" : "border-border"
                        }`}>
                          {isSelected && <Check size={12} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-medium text-foreground truncate">{m.shortName}</span>
                          {m.hasPricing && m.estimatedCost > 0 && (
                            <span className="block text-[10px] text-muted-foreground">
                              ${m.estimatedCost.toLocaleString()}
                              {m.quantity > 1 ? ` \u00b7 ${m.quantity}${m.unit ? ` ${m.unit}` : ""}` : ""}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!materials.some((m) => m.hasPricing) && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Material costs will be estimated based on your selections.
                  </p>
                )}

                {/* Confirm / result banner */}
                {confirmResult?.ok && confirmResult.conceptIndex === activeTab ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-emerald-900 leading-relaxed">
                        <p className="font-semibold">Materials synced to your estimate.</p>
                        {typeof confirmResult.costDelta === "number" && confirmResult.costDelta !== 0 && (
                          <p className="text-emerald-800/80">
                            Cost updated by {confirmResult.costDelta >= 0 ? "+" : "\u2212"}$
                            {Math.abs(Math.round(confirmResult.costDelta)).toLocaleString()}.
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Best-effort link to the scope page for the user's
                        // current spatial scan; fall back to the vault if we
                        // don't have one stashed locally.
                        let target = "/documents";
                        if (typeof window !== "undefined") {
                          try {
                            const sid = window.localStorage.getItem("parapet_spatial_id");
                            if (sid) target = `/scope/${sid}`;
                          } catch { /* localStorage unavailable */ }
                        }
                        router.push(target);
                      }}
                      className="w-full h-10 rounded-lg bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      View Updated Estimate <ArrowRight size={14} />
                    </button>
                  </div>
                ) : confirmResult && !confirmResult.ok ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-red-900 leading-relaxed">
                        <p className="font-semibold">Couldn&apos;t sync materials</p>
                        <p className="text-red-800/80 break-words">{confirmResult.error}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={confirmMaterials}
                      className="w-full h-10 rounded-lg bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white text-xs font-semibold transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={confirmMaterials}
                    disabled={confirming || selectedSet.size === 0}
                    className="mt-3 w-full h-11 rounded-xl bg-[#1E3A5F] hover:bg-[#2A4F7A] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {confirming && <Loader2 size={14} className="animate-spin" />}
                    {confirming ? "Syncing\u2026" : "Confirm Selections"}
                  </button>
                )}
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
              onClick={() => {
                const fromQs = fromAlerts ? "&from=alerts" : fromVault ? "&from=vault" : "";
                router.push(`/design/report?session=${sessionId}&concept=${activeTab}${fromQs}`);
              }}
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

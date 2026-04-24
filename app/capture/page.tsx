'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Maximize, Video, Upload, CheckCircle2,
  Camera, ArrowRight, Mic, X, Info, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

// ── Toast ──

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[400px] w-[90%] animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-[#1E3A5F] text-white text-xs rounded-xl px-4 py-3 shadow-lg flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{message}</span>
        <button onClick={onClose} className="shrink-0 ml-auto"><X size={14} /></button>
      </div>
    </div>
  );
}

// ── Walkthrough Modal ──

function WalkthroughModal({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const tips = [
    { title: "Describe your renovation goals", desc: "Explain what you want to change, remodel, or build in each area you walk through." },
    { title: "Point out what needs demolition", desc: "Show and describe walls, fixtures, flooring, or anything you want removed." },
    { title: "Specify material preferences", desc: "Mention your desired quality level \u2014 standard, mid-range, or premium finishes, countertops, cabinetry, and fixtures." },
    { title: "Highlight structural concerns", desc: "Point out any issues you\u2019ve noticed \u2014 water damage, cracks, outdated electrical or plumbing." },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="max-w-[430px] w-full bg-background rounded-t-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] z-[61]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-6 pb-3">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center">
              <Mic size={24} className="text-[#1E3A5F]" />
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X size={20} className="text-muted-foreground" /></button>
          </div>

          <h2 className="text-lg font-bold text-foreground mb-1">Before You Record</h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Your video walkthrough is essential for creating an accurate estimate. Please narrate as you record &mdash; the AI Estimator will use your descriptions to build a detailed scope and cost estimate.
          </p>

          <div className="space-y-4 mb-5">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E3A5F] text-white text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#2BCBBA]/10 border border-[#2BCBBA]/20">
            <p className="text-[11px] text-foreground leading-relaxed">
              <span className="font-semibold">Tip:</span> The more detail you provide during the walkthrough, the more accurate your estimate will be. Speak clearly and move the camera slowly.
            </p>
          </div>
        </div>

        {/* Sticky button at bottom */}
        <div className="shrink-0 px-5 pt-4 border-t border-border/30 bg-white" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
          <Button onClick={onStart} className="w-full h-12 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm rounded-xl">
            I Understand &mdash; Start Recording
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Recording UI ──

function RecordingOverlay({ seconds, onStop, stream }: { seconds: number; onStop: () => void; stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Live camera preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay controls */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-20">
        <div className="flex items-center gap-2 mb-6 bg-black/50 px-4 py-2 rounded-full">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-2xl font-mono font-bold">{mm}:{ss}</span>
        </div>
        <button
          onClick={onStop}
          className="w-16 h-16 rounded-full bg-red-500 border-4 border-white flex items-center justify-center"
        >
          <div className="w-6 h-6 rounded-sm bg-white" />
        </button>
        <p className="text-white/60 text-xs mt-4">Tap to stop recording</p>
      </div>
    </div>
  );
}

// ── Page ──

export default function SpaceCapturePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Honor ?from=vault so the vault's Space Scan card returns to /documents on back
  // and the header reflects the return destination.
  const [fromVault, setFromVault] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "vault") setFromVault(true);
  }, []);
  const backPath: "/dashboard" | "/documents" = fromVault ? "/documents" : "/dashboard";
  const headerTitle = fromVault ? "My Documents" : "Space Capture";
  const headerSubtitle = fromVault ? "Back to Document Vault" : "LiDAR & Photo Documentation";
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [spatialId, setSpatialId] = useState<string | null>(null);
  const [walkthroughId, setWalkthroughId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // ── XHR upload with progress ──

  const uploadWithProgress = useCallback((url: string, formData: FormData): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadPercent(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener("load", async () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ ok: true, data });
          } else {
            resolve({ ok: false, error: data.detail || `Upload failed (${xhr.status})` });
          }
        } catch {
          resolve({ ok: false, error: `Upload failed (${xhr.status})` });
        }
      });
      xhr.addEventListener("error", () => resolve({ ok: false, error: "Network error during upload" }));
      xhr.addEventListener("timeout", () => resolve({ ok: false, error: "Upload timed out" }));
      xhr.timeout = 600_000; // 10 min timeout for large files
      xhr.open("POST", url);
      const authHeaders = getAuthHeaders();
      Object.entries(authHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.send(formData);
    });
  }, []);

  // ── File upload handler ──

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    setIsUploading(true);

    try {
      if (ext === "pdf") {
        setUploadProgress("Uploading LiDAR scan...");
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_URL}/v1/spatial/upload`, { method: "POST", body: fd, headers: getAuthHeaders() });
        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(errBody || `Upload failed: ${res.status}`);
        }
        const data = await res.json();
        const sid = data.id || data.spatial_id;
        const parsedRooms = data.rooms ?? [];

        if (parsedRooms.length === 0) {
          setToast("No rooms detected in this PDF. Please upload a Polycam Floorplan Report.");
          // Don't set spatialId — prevent generating a $0 estimate
        } else {
          setSpatialId(sid);
          setRooms(parsedRooms);
          try { localStorage.setItem("parapet_spatial_id", sid); } catch {}
          setToast(`LiDAR scan uploaded \u2014 ${parsedRooms.length} room${parsedRooms.length > 1 ? "s" : ""} detected!`);
        }
      } else if (["mp4", "mov", "webm"].includes(ext)) {
        setUploadProgress("Uploading video...");
        setUploadPercent(0);
        const fd = new FormData();
        fd.append("file", file);
        const qp = new URLSearchParams();
        if (spatialId) qp.set("spatial_id", spatialId);
        const url = `${API_URL}/v1/walkthrough/upload${qp.toString() ? "?" + qp : ""}`;
        const result = await uploadWithProgress(url, fd);
        if (!result.ok) throw new Error(result.error || "Upload failed");
        const wid = (result.data as Record<string, string>)?.id || (result.data as Record<string, string>)?.walkthrough_id;
        setWalkthroughId(wid || null);

        // Transcription is best-effort: its failure (e.g. OPENAI_API_KEY missing
        // on the backend) must not surface as an upload failure, since the video
        // itself was stored successfully.
        let transcriptionStarted = false;
        if (wid) {
          setUploadProgress("Starting transcription...");
          try {
            const txRes = await fetch(`${API_URL}/v1/walkthrough/${wid}/transcribe`, { method: "POST", headers: getAuthHeaders() });
            transcriptionStarted = txRes.ok;
          } catch {
            transcriptionStarted = false;
          }
        }
        setToast(transcriptionStarted
          ? "Video uploaded! Transcription started."
          : "Video uploaded. Transcription will start shortly.");
      } else if (["jpg", "jpeg", "png", "heic"].includes(ext)) {
        const url = URL.createObjectURL(file);
        setPhotos(prev => [...prev, url]);
        setToast("Photo added.");
      } else {
        setToast("Unsupported file type. Please upload PDF, MP4, MOV, JPG, or PNG.");
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [spatialId]);

  // ── Video recording ──

  const startRecording = useCallback(async () => {
    setShowModal(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Pick a supported MIME type (Safari doesn't support webm)
      const mimeTypes = [
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let selectedMime = "";
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) { selectedMime = mt; break; }
      }
      const recorderOpts: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const ext = selectedMime.startsWith("video/mp4") ? "mp4" : "webm";
      const blobType = selectedMime || "video/webm";

      const recorder = new MediaRecorder(stream, recorderOpts);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: blobType });
        setIsRecording(false);
        setRecordingTime(0);

        // Upload
        setIsUploading(true);
        setUploadProgress("Uploading recording...");
        setUploadPercent(0);
        try {
          const fd = new FormData();
          fd.append("file", blob, `walkthrough.${ext}`);
          const qp = new URLSearchParams();
          if (spatialId) qp.set("spatial_id", spatialId);
          const url = `${API_URL}/v1/walkthrough/upload${qp.toString() ? "?" + qp : ""}`;
          const result = await uploadWithProgress(url, fd);
          if (!result.ok) throw new Error(result.error || "Upload failed");
          const wid = (result.data as Record<string, string>)?.id || (result.data as Record<string, string>)?.walkthrough_id;
          setWalkthroughId(wid || null);
          // Transcription is best-effort; don't let a transcribe failure surface as an upload failure.
          let transcriptionStarted = false;
          if (wid) {
            setUploadProgress("Starting transcription...");
            try {
              const txRes = await fetch(`${API_URL}/v1/walkthrough/${wid}/transcribe`, { method: "POST", headers: getAuthHeaders() });
              transcriptionStarted = txRes.ok;
            } catch {
              transcriptionStarted = false;
            }
          }
          setToast(transcriptionStarted
            ? "Video recorded and uploaded!"
            : "Video recorded and uploaded. Transcription will start shortly.");
        } catch (err) {
          setToast(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setIsUploading(false);
          setUploadProgress("");
          setUploadPercent(0);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every 1s for smoother chunks
      setIsRecording(true);
    } catch {
      setToast("Camera access not available. Please record a video using your phone\u2019s camera app, then upload it using the file upload area.");
    }
  }, [spatialId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // ── Photo capture ──

  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotos(prev => [...prev, URL.createObjectURL(file)]);
      setToast("Photo captured.");
    }
    if (photoInputRef.current) photoInputRef.current.value = "";
  }, []);

  // ── Generate estimate ──

  const hasInput = !!spatialId || !!walkthroughId || photos.length > 0;

  const handleGenerate = useCallback(async () => {
    const params = new URLSearchParams();
    if (spatialId) params.set("spatial_id", spatialId);
    if (walkthroughId) params.set("walkthrough_id", walkthroughId);
    router.push(`/estimate-generating?${params.toString()}`);
  }, [spatialId, walkthroughId, router]);

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showModal && <WalkthroughModal onClose={() => setShowModal(false)} onStart={startRecording} />}
      {isRecording && <RecordingOverlay seconds={recordingTime} onStop={stopRecording} stream={streamRef.current} />}

      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background relative shadow-xl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="flex items-center gap-2 px-4 py-3">
            <button onClick={() => router.push(backPath)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft size={22} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">{headerTitle}</h1>
              <p className="text-[10px] text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 pt-4 pb-4 safe-bottom overflow-y-auto">

          {/* ── Mode Cards ── */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setToast("LiDAR scanning requires the Polycam app. Please scan your property in Polycam, then upload the PDF report below.")}
              className="rounded-xl bg-[#1E3A5F] p-4 text-left"
            >
              <Maximize size={24} className="text-white mb-2" />
              <p className="text-sm font-semibold text-white">LiDAR 3D Scan</p>
              <p className="text-[10px] text-white/60 mt-0.5">Required</p>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl border border-border bg-card p-4 text-left hover:border-[#1E3A5F]/30 transition-colors"
            >
              <Video size={24} className="text-[#1E3A5F] mb-2" />
              <p className="text-sm font-semibold text-foreground">Video Walkthrough</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Narrate your vision</p>
            </button>
          </div>

          {/* ── Upload Area ── */}
          <div
            className="rounded-xl border-2 border-dashed border-[#1E3A5F]/30 p-6 text-center mb-4 cursor-pointer hover:border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/[0.02] transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.mp4,.mov,.webm,.jpg,.jpeg,.png,.heic"
              onChange={handleFileSelect}
            />
            {isUploading ? (
              <>
                {uploadPercent > 0 && uploadPercent < 100 ? (
                  <>
                    <div className="w-full max-w-[200px] mx-auto mb-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadPercent}%`, background: "linear-gradient(90deg, #1E3A5F, #2BCBBA)" }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground text-center mt-1">{uploadPercent}%</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{uploadProgress || "Uploading..."}</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-[#1E3A5F] border-t-transparent animate-spin" />
                    <p className="text-sm font-semibold text-foreground">{uploadProgress || "Processing..."}</p>
                  </>
                )}
              </>
            ) : (
              <>
                <Upload size={28} className="mx-auto text-[#1E3A5F]/40 mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Upload existing files</p>
                <p className="text-[11px] text-muted-foreground mb-3">Photos, videos, floor plans, or 3D scans</p>
                <Button variant="outline" size="sm" className="text-xs rounded-lg">Browse Files</Button>
              </>
            )}
          </div>

          {/* ── Status indicators ── */}
          {(spatialId || walkthroughId) && (
            <div className="space-y-2 mb-4">
              {spatialId && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/50">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-800">LiDAR scan uploaded</span>
                </div>
              )}
              {walkthroughId && (
                <button
                  onClick={() => router.push(`/walkthrough/${walkthroughId}`)}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/50 w-full text-left hover:bg-emerald-100/60 transition-colors"
                >
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-medium text-emerald-800 flex-1">Video walkthrough uploaded</span>
                  <ChevronRight size={12} className="text-emerald-500 shrink-0" />
                </button>
              )}
            </div>
          )}

          {/* ── Captured Rooms ── */}
          {rooms.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Captured Rooms</h3>
              <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30 overflow-hidden">
                {rooms.map((room: any, i: number) => (
                  <button
                    key={room.id ?? i}
                    onClick={() => router.push(`/capture/${spatialId}/room/${room.id}`)}
                    className="flex items-center gap-3 px-3.5 py-3 w-full text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{room.room_type ?? room.name ?? `Room ${i + 1}`}</p>
                      <p className="text-[10px] text-muted-foreground">{room.photo_count ?? 0} photos {'\u00B7'} 3D scanned</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Photo thumbnails ── */}
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {photos.map((src, i) => (
                <img key={i} src={src} alt={`Photo ${i + 1}`} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border/50" />
              ))}
            </div>
          )}

          {/* ── Photo Capture ── */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card mb-4">
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
              <Camera size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Photo Capture</p>
              <p className="text-[11px] text-muted-foreground">Take photos of your space</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-lg"
              onClick={() => photoInputRef.current?.click()}
            >
              Capture
            </Button>
          </div>

          {/* ── Generate Estimate ── */}
          <Button
            onClick={handleGenerate}
            disabled={!hasInput}
            className={`w-full h-12 font-semibold text-sm rounded-xl ${
              hasInput
                ? "bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white shadow-lg shadow-[#1E3A5F]/20"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {hasInput ? (
              <>Generate an Estimate <ArrowRight size={16} className="ml-1" /></>
            ) : (
              "Upload files to generate estimate"
            )}
          </Button>
        </div>

        <BottomNav />
      </div>
    </>
  );
}

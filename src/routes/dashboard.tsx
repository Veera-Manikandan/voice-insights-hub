import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeAudio } from "@/lib/analyze-audio.functions";
import { Upload, Sparkles, FileAudio, Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VoxPulse AI" },
      { name: "description", content: "Your VoxPulse AI dashboard." },
    ],
  }),
  component: DashboardPage,
});

const ACCEPTED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/m4a", "audio/mp4", "audio/x-m4a"];
const ACCEPTED_EXT = [".mp3", ".wav", ".m4a"];

type UploadRow = {
  id: string;
  file_url: string;
  file_name: string;
  mime_type: string | null;
  created_at: string;
};

type AnalysisRow = {
  id: string;
  upload_id: string;
  happy: number;
  angry: number;
  neutral: number;
  frustrated: number;
  summary: string | null;
  suggestions: string | null;
  created_at: string;
};

function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisRow>>({});
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function refresh() {
    if (!user) return;
    setFetching(true);
    const { data: ups, error: e1 } = await supabase
      .from("uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (e1) {
      toast.error("Failed to load uploads");
      setFetching(false);
      return;
    }
    const uploadList = (ups ?? []) as UploadRow[];
    setUploads(uploadList);

    if (uploadList.length > 0) {
      const ids = uploadList.map((u) => u.id);
      const { data: ans } = await supabase
        .from("analysis")
        .select("*")
        .in("upload_id", ids);
      const map: Record<string, AnalysisRow> = {};
      (ans ?? []).forEach((a) => {
        map[(a as AnalysisRow).upload_id] = a as AnalysisRow;
      });
      setAnalyses(map);
    } else {
      setAnalyses({});
    }
    setFetching(false);
  }

  async function handleFile(file: File) {
    const lower = file.name.toLowerCase();
    const okExt = ACCEPTED_EXT.some((e) => lower.endsWith(e));
    const okMime = !file.type || ACCEPTED.includes(file.type);
    if (!okExt || !okMime) {
      toast.error("Only MP3, WAV, or M4A files are allowed");
      return;
    }

    setUploading(true);
    try {
      // 1. Get the current authenticated user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        toast.error("You must be logged in to upload");
        navigate({ to: "/login" });
        return;
      }
      const authUser = userData.user;

      // 2. Upload file to Supabase storage (call-recordings bucket)
      const path = `${authUser.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("call-recordings")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      // 3. Insert row into uploads table immediately after upload
      const { error: insErr, data: inserted } = await supabase
        .from("uploads")
        .insert({
          user_id: authUser.id,
          file_url: path,
          file_name: file.name,
          mime_type: file.type || null,
        })
        .select()
        .single();
      if (insErr) {
        // Roll back the storage upload if the DB insert failed
        await supabase.storage.from("call-recordings").remove([path]);
        throw insErr;
      }

      toast.success("Audio uploaded successfully");
      setUploads((prev) => [inserted as UploadRow, ...prev]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAnalyze(u: UploadRow) {
    setAnalyzingId(u.id);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      await analyzeAudio({
        data: { uploadId: u.id, filePath: u.file_url },
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Analysis complete");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleDelete(u: UploadRow) {
    try {
      await supabase.storage.from("call-recordings").remove([u.file_url]);
      const { error } = await supabase.from("uploads").delete().eq("id", u.id);
      if (error) throw error;
      setUploads((prev) => prev.filter((x) => x.id !== u.id));
      const next = { ...analyses };
      delete next[u.id];
      setAnalyses(next);
      toast.success("Recording deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative px-6 py-12">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="relative mx-auto max-w-6xl space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Welcome, <span className="text-gradient">{user.email}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Upload a call recording and let VoxPulse AI surface the emotion behind every word.
            </p>
          </motion.div>

          {/* Upload card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-2xl border border-border bg-card/80 p-6 shadow-elegant backdrop-blur-xl md:p-8"
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-xl font-semibold">Upload a recording</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  MP3, WAV, or M4A — up to a few minutes works best.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/m4a,audio/mp4"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
                <Button
                  variant="hero"
                  size="lg"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Choose file
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Recordings list */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-semibold">Your recordings</h2>

            {fetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : uploads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
                No recordings yet. Upload your first call to get started.
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {uploads.map((u) => {
                    const a = analyses[u.id];
                    const isAnalyzing = analyzingId === u.id;
                    return (
                      <motion.div
                        key={u.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur-xl"
                      >
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                              <FileAudio className="h-5 w-5 text-primary-foreground" />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{u.file_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(u.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={a ? "glass" : "hero"}
                              size="sm"
                              disabled={isAnalyzing}
                              onClick={() => void handleAnalyze(u)}
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  {a ? "Re-analyze" : "Submit for Analysis"}
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleDelete(u)}
                              aria-label="Delete recording"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {a && (
                          <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                                Emotion mix
                              </div>
                              <EmotionBar label="Happy" value={a.happy} />
                              <EmotionBar label="Neutral" value={a.neutral} />
                              <EmotionBar label="Frustrated" value={a.frustrated} />
                              <EmotionBar label="Angry" value={a.angry} />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                                  Summary
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-foreground">
                                  {a.summary || "—"}
                                </p>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                                  Suggestions
                                </div>
                                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
                                  {a.suggestions || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EmotionBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

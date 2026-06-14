import { useState, useEffect, useRef, useCallback } from "react";
import {
  CloudUpload,
  FileText,
  XCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  Brain,
  ChevronDown,
  ListChecks,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DimensionCharts from "@/components/DimensionCharts";
import { listDemoPositions, listSampleCvs, evaluateDemo } from "@/lib/demoApi";

// --- Loading stepper definition -------------------------------------------
const STEPS = [
  "Membaca CV…",
  "Mengekstrak entitas dengan IndoBERT…",
  "Mencocokkan skill dengan posisi…",
  "Menghitung skor & menyusun penjelasan…",
];
const STEP_INTERVAL_MS = 3500; // fake advance interval for steps 1..3
const REQUEST_TIMEOUT_MS = 90000;

// --- NER category styling (IndoBERT + regex labels) -----------------------
const ENTITY_META = {
  PERSON: { label: "Nama", color: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  ORG: { label: "Organisasi / Institusi", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  LOC: { label: "Lokasi", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  EMAIL: { label: "Email", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  PHONE: { label: "Telepon", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  URL: { label: "Tautan", color: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  NIK: { label: "NIK", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  NIM: { label: "NIM", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30" },
};

const SECTION_LABEL = {
  education: "Pendidikan",
  experience: "Pengalaman",
  skills: "Keahlian",
  certifications: "Sertifikasi",
  other: "Lainnya",
};

function scoreLabel(score) {
  if (score >= 75) return { text: "Strong Match", color: "text-green-600" };
  if (score >= 50) return { text: "Moderate Match", color: "text-yellow-600" };
  return { text: "Needs Improvement", color: "text-red-600" };
}

function barColor(score) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

// Animated count-up for the main score.
function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target == null) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function DropZone({ file, onFile, onClear }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const pick = (fileList) => {
    const pdf = Array.from(fileList || []).find((f) =>
      f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdf) onFile(pdf);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-muted-foreground">
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        pick(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-xl border border-dashed transition-colors cursor-pointer ${
        dragOver ? "bg-primary/10 border-primary" : "hover:bg-muted/50 border-border"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dragOver ? "bg-primary/20" : "bg-muted"}`}>
        <CloudUpload className={`w-6 h-6 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Letakkan CV (PDF) di sini</p>
        <p className="text-xs text-muted-foreground mt-0.5">atau ketuk untuk memilih file · maks 5 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function LoadingStepper({ activeStep }) {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Brain className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-sm font-medium">Menganalisis CV Anda…</p>
          <p className="text-xs text-muted-foreground">Mohon tunggu, proses ini berjalan otomatis.</p>
        </div>
        <ol className="space-y-3 max-w-md mx-auto">
          {STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <li key={step} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    done
                      ? "bg-green-500 text-white"
                      : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : active ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </div>
                <span className={`text-sm ${active ? "font-medium text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

// --- B: read-only rubric criteria preview (collapsible) -------------------
function RubricPreview({ position }) {
  const [open, setOpen] = useState(false);
  const dims = position?.dimensions || [];
  if (dims.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ListChecks className="w-4 h-4 text-primary" />
          Lihat kriteria penilaian
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {dims.map((d) => (
            <div key={d.name} className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium">{d.name}</span>
                <Badge variant="secondary" className="text-[10px] tabular-nums shrink-0">
                  {Math.round((d.weight ?? 0) * 100)}%
                </Badge>
              </div>
              {d.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {d.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- C: per-dimension score + justification + evidence (collapsible) ------
function DimensionResultCard({ ds, color }) {
  const [open, setOpen] = useState(false);
  const score = Number(ds.score ?? 0);
  const hasDetail = !!ds.justification || (ds.evidence && ds.evidence.length > 0);

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={`w-full text-left px-3.5 py-3 ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{ds.dimension}</span>
            {ds.weight != null && (
              <Badge variant="secondary" className="text-[10px] tabular-nums shrink-0">
                {Math.round(ds.weight * 100)}%
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm font-bold tabular-nums" style={{ color }}>
              {score.toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
            {hasDetail && (
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              />
            )}
          </div>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor(score)}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </button>

      {open && hasDetail && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t pt-3">
          {ds.justification && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Justifikasi
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {ds.justification}
              </p>
            </div>
          )}
          {ds.evidence && ds.evidence.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Bukti dari CV
              </p>
              <div className="space-y-1.5">
                {ds.evidence.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm"
                  >
                    <Quote className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground/70 italic leading-relaxed">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DIM_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(271, 81%, 56%)",
  "hsl(188, 86%, 43%)",
];

function ResultView({ result, onReset }) {
  const score = Number(result.composite_score ?? 0);
  const animated = useCountUp(score, true);
  const label = scoreLabel(score);
  const dimScores = result.dimension_scores || [];

  // Group entities by label.
  const grouped = {};
  (result.entities || []).forEach((e) => {
    const key = e.label;
    if (!ENTITY_META[key]) return;
    if (!grouped[key]) grouped[key] = new Set();
    grouped[key].add(e.text);
  });

  return (
    <div className="space-y-4">
      {/* Main score */}
      <Card className="overflow-hidden">
        <CardContent className="py-8 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Skor Kecocokan</p>
          <div className="text-6xl font-bold tabular-nums">
            {animated.toFixed(0)}
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <p className={`mt-2 text-lg font-semibold ${label.color}`}>{label.text}</p>
        </CardContent>
      </Card>

      {/* Mini charts (C, opsional) */}
      {dimScores.length > 0 && (
        <DimensionCharts
          scores={dimScores.map((ds) => ({
            dimension_name: ds.dimension,
            score: ds.score,
            weight: ds.weight,
          }))}
          height={210}
          compact
        />
      )}

      {/* Breakdown + justifikasi + evidence per dimensi (C) */}
      {dimScores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rincian Penilaian</CardTitle>
            <CardDescription className="text-xs">
              Ketuk tiap dimensi untuk melihat justifikasi & bukti dari CV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {dimScores.map((ds, i) => (
              <DimensionResultCard
                key={ds.dimension || i}
                ds={ds}
                color={DIM_COLORS[i % DIM_COLORS.length]}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* NER entities */}
      {Object.keys(grouped).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Entitas Terdeteksi (IndoBERT NER)
            </CardTitle>
            <CardDescription className="text-xs">
              Entitas yang dikenali model dari CV Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(grouped).map(([label, values]) => (
              <div key={label}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {ENTITY_META[label].label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(values).slice(0, 12).map((v, i) => (
                    <span
                      key={`${label}-${i}`}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${ENTITY_META[label].color}`}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {result.sections && result.sections.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Bagian CV Terdeteksi</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.sections.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {SECTION_LABEL[s] || s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI explanation */}
      {result.explanation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Penjelasan AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.explanation}</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={onReset} variant="outline" className="w-full">
        <RotateCcw className="w-4 h-4 mr-2" />
        Coba CV lain
      </Button>
    </div>
  );
}

export default function DemoPage() {
  const [phase, setPhase] = useState("input"); // input | loading | result | error
  const [positions, setPositions] = useState([]);
  const [samples, setSamples] = useState([]);
  const [positionId, setPositionId] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const stepTimer = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    listDemoPositions()
      .then((p) => {
        setPositions(p);
        if (p.length > 0) setPositionId(String(p[0].id));
      })
      .catch((e) => setError(`Gagal memuat posisi: ${e.message}`));
    listSampleCvs()
      .then(setSamples)
      .catch(() => setSamples([]));
  }, []);

  const clearTimers = () => {
    if (stepTimer.current) clearInterval(stepTimer.current);
    stepTimer.current = null;
  };

  useEffect(() => () => clearTimers(), []);

  const runEvaluation = useCallback(
    async (theFile) => {
      if (!theFile || !positionId) return;
      if (theFile.size > 5 * 1024 * 1024) {
        setError("Ukuran file melebihi 5 MB.");
        setPhase("error");
        return;
      }

      setPhase("loading");
      setActiveStep(0);
      setError("");

      // Fake stepper: advance through steps 0..2, hold on the last step.
      clearTimers();
      stepTimer.current = setInterval(() => {
        setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
      }, STEP_INTERVAL_MS);

      // Client-side timeout guard.
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const data = await evaluateDemo(theFile, Number(positionId), name, controller.signal);
        clearTimers();
        setActiveStep(STEPS.length); // all complete
        setResult(data);
        setPhase("result");
      } catch (e) {
        clearTimers();
        if (e.name === "AbortError") {
          setError("Analisis memakan waktu terlalu lama. Silakan coba lagi.");
        } else {
          setError(e.message || "Terjadi kesalahan saat menganalisis CV.");
        }
        setPhase("error");
      } finally {
        clearTimeout(timeout);
        abortRef.current = null;
      }
    },
    [positionId, name]
  );

  const selectedPosition = positions.find((p) => String(p.id) === positionId);

  const handleAnalyze = () => runEvaluation(file);

  const handleReset = () => {
    clearTimers();
    if (abortRef.current) abortRef.current.abort();
    setFile(null);
    setResult(null);
    setError("");
    setActiveStep(0);
    setPhase("input");
  };

  const canSubmit = !!file && !!positionId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ScreenAI Demo</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Unggah CV Anda dan lihat analisis AI secara langsung.
          </p>
        </div>

        {/* Privacy banner */}
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            CV Anda hanya digunakan untuk demo ini dan dihapus otomatis. Tidak ada data yang disimpan permanen.
          </p>
        </div>

        {phase === "input" && (
          <>
            <Card>
              <CardContent className="py-5 space-y-4">
                {/* Position */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Posisi yang dilamar</label>
                  <Select value={positionId} onValueChange={setPositionId}>
                    <SelectTrigger className="w-full">
                      <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Pilih posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.label ?? p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPosition && (
                    <div className="mt-2">
                      <RubricPreview position={selectedPosition} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Nama <span className="text-muted-foreground font-normal">(opsional)</span>
                  </label>
                  <Input
                    placeholder="Pengunjung Pameran"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Upload */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">CV (PDF)</label>
                  <DropZone file={file} onFile={setFile} onClear={() => setFile(null)} />
                </div>

                <Button onClick={handleAnalyze} disabled={!canSubmit} className="w-full" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analisis CV
                </Button>
              </CardContent>
            </Card>

            {/* Sample CVs */}
            {samples.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Coba dengan CV sampel</CardTitle>
                  <CardDescription className="text-xs">
                    Tidak ingin unggah CV asli? Pilih salah satu contoh.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2">
                  {samples.map((s) => (
                    <button
                      key={s.filename}
                      onClick={async () => {
                        try {
                          const res = await fetch(s.url);
                          const blob = await res.blob();
                          const f = new File([blob], s.filename, { type: "application/pdf" });
                          setFile(f);
                          runEvaluation(f);
                        } catch {
                          setError("Gagal memuat CV sampel.");
                          setPhase("error");
                        }
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">{s.filename}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {phase === "loading" && <LoadingStepper activeStep={activeStep} />}

        {phase === "result" && result && (
          <ResultView result={result} onReset={handleReset} />
        )}

        {phase === "error" && (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 mx-auto text-destructive" />
              <div>
                <p className="text-sm font-medium">Analisis gagal</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={() => (file ? runEvaluation(file) : handleReset())}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Coba lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          ScreenAI · Capstone Project — Telkom University
        </p>
      </div>
    </div>
  );
}

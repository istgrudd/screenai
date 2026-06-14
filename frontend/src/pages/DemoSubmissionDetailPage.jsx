import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getDemoSubmission } from "@/lib/api";
import JustificationCard from "@/components/JustificationCard";
import DimensionCharts from "@/components/DimensionCharts";
import { CHART_COLORS } from "@/lib/chartColors";

const ENTITY_LABEL = {
  PERSON: "Nama",
  ORG: "Organisasi / Institusi",
  LOC: "Lokasi",
  EMAIL: "Email",
  PHONE: "Telepon",
  URL: "Tautan",
  NIK: "NIK",
  NIM: "NIM",
};

function getScoreColor(score) {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 25) return "text-orange-600";
  return "text-red-600";
}

export default function DemoSubmissionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purged, setPurged] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getDemoSubmission(id);
        if (active) setSubmission(data);
      } catch (err) {
        if (!active) return;
        // The backend returns 404 with a friendly message once a demo row
        // has been auto-purged (>60 min). Treat it as a graceful empty state.
        const msg = err.message || "";
        if (/dihapus|not found|404/i.test(msg)) {
          setPurged(true);
        } else {
          setErrorMsg(msg || "Gagal memuat detail demo.");
          toast.error(`Gagal memuat detail demo: ${msg}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const BackButton = (
    <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
    </Button>
  );

  // Graceful: data purged by the auto-cleanup task.
  if (purged) {
    return (
      <div className="space-y-6">
        {BackButton}
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Trash2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium mb-1">Data demo ini sudah dihapus otomatis</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Submission demo bersifat sementara dan dibersihkan otomatis demi
              privasi. Minta pengunjung menjalankan demo lagi untuk melihat hasil baru.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="space-y-6">
        {BackButton}
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">
              {errorMsg || "Detail demo tidak tersedia."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scores = submission.dimension_scores || [];
  const hasScores = scores.length > 0;
  const score = submission.composite_score;

  // Group NER entities by label for the identity panel.
  const grouped = (submission.entities || []).reduce((acc, e) => {
    const key = e.label || "OTHER";
    if (!acc[key]) acc[key] = [];
    if (!acc[key].includes(e.text)) acc[key].push(e.text);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        {BackButton}
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight font-mono">
                {submission.anonymous_id}
              </h1>
              <Badge variant="secondary" className="text-[10px]">DEMO</Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {submission.position_title && (
                <span className="text-sm text-muted-foreground">
                  {submission.position_title}
                </span>
              )}
              {score != null && (
                <span className={`text-sm font-bold tabular-nums ${getScoreColor(score)}`}>
                  {Number(score).toFixed(1)} / 100
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visitor name */}
      {submission.display_name && (
        <Card>
          <CardContent className="py-3 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Nama pengunjung:</span>
            <span className="font-medium">{submission.display_name}</span>
          </CardContent>
        </Card>
      )}

      {/* Profile summary */}
      {submission.profile_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {submission.profile_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {hasScores && <DimensionCharts scores={scores} height={280} />}

      {/* Justifications */}
      {hasScores && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Dimension Scores &amp; Justifications
          </h2>
          <div className="grid gap-4">
            {scores.map((s, i) => (
              <JustificationCard
                key={s.id || i}
                dimScore={s}
                color={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detected entities (no permanent identity stored for demo) */}
      {Object.keys(grouped).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Entitas Terdeteksi (IndoBERT NER)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(grouped).map(([label, values]) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {ENTITY_LABEL[label] || label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.map((text, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-muted text-foreground"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!hasScores && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">
              Submission ini belum memiliki rincian skor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

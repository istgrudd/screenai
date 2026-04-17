import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  CloudUpload,
  Briefcase,
  Languages,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFiles, listRubrics } from "@/lib/api";

function pickPdf(fileList) {
  const pdfs = Array.from(fileList || []).filter((f) =>
    f.name.toLowerCase().endsWith(".pdf")
  );
  return pdfs[0] || null;
}

function DropZone({
  id,
  label,
  description,
  required,
  file,
  onFile,
  onClear,
  accent = "primary",
}) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const picked = pickPdf(e.dataTransfer.files);
      if (!picked) {
        toast.error("Only PDF files are accepted.");
        return;
      }
      onFile(picked);
    },
    [onFile]
  );

  const onChange = (e) => {
    const picked = pickPdf(e.target.files);
    if (picked) onFile(picked);
    // Reset so the same file can be re-selected after clearing.
    e.target.value = "";
  };

  const accentRing =
    accent === "primary"
      ? "ring-primary/40 bg-primary/10"
      : "ring-emerald-500/40 bg-emerald-500/10";
  const accentIcon =
    accent === "primary" ? "text-primary" : "text-emerald-600";

  return (
    <Card className={file ? "" : "border-dashed"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {label}
          {required && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Required
            </Badge>
          )}
          {!required && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Optional
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {file ? (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentRing}`}
              >
                <FileText className={`w-4 h-4 ${accentIcon}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive h-8 px-2"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById(id).click()}
            className={`flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-xl border border-dashed transition-colors cursor-pointer ${
              dragOver
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted/50 border-border"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                dragOver ? "bg-primary/20" : "bg-muted"
              }`}
            >
              <CloudUpload
                className={`w-6 h-6 ${
                  dragOver ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop PDF here</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                or click to browse
              </p>
            </div>
            <input
              id={id}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UploadPage() {
  const [cvFile, setCvFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [skipCert, setSkipCert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [selectedRubric, setSelectedRubric] = useState("");

  useEffect(() => {
    listRubrics()
      .then(setRubrics)
      .catch((err) => toast.error(`Failed to load rubrics: ${err.message}`));
  }, []);

  const canSubmit = !!selectedRubric && !!cvFile && !uploading;

  const handleUpload = async () => {
    if (!canSubmit) return;
    setUploading(true);
    setResults(null);
    try {
      const toSend = [cvFile];
      if (certFile && !skipCert) toSend.push(certFile);
      const data = await uploadFiles(toSend, Number(selectedRubric));
      setResults(data);
      setCvFile(null);
      setCertFile(null);
      setSkipCert(false);
      toast.success(`${data.uploaded_count} document(s) uploaded and processed!`);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload CVs</h1>
        <p className="text-muted-foreground mt-1">
          Submit a candidate's CV and optional language certificate for
          automated screening.
        </p>
      </div>

      {/* Rubric selector */}
      <Card>
        <CardContent className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Position / Rubric <span className="text-destructive">*</span>
          </label>
          <Select value={selectedRubric} onValueChange={setSelectedRubric}>
            <SelectTrigger className="w-full max-w-md">
              <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select a position to apply for" />
            </SelectTrigger>
            <SelectContent>
              {rubrics.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                  {r.position ? ` — ${r.position}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rubrics.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              No rubrics available. Create one in the Rubrics page first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Two upload zones, side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DropZone
          id="cv-file-input"
          label={
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Curriculum Vitae (CV)
            </span>
          }
          description="Upload your CV in PDF format."
          required
          file={cvFile}
          onFile={(f) => {
            setCvFile(f);
            setResults(null);
          }}
          onClear={() => setCvFile(null)}
          accent="primary"
        />

        <div className="space-y-2">
          <DropZone
            id="cert-file-input"
            label={
              <span className="flex items-center gap-2">
                <Languages className="w-4 h-4" /> Language Certificate
              </span>
            }
            description="EPrT, TOEFL, or IELTS certificate in PDF format. Adds bonus points to your final score."
            required={false}
            file={skipCert ? null : certFile}
            onFile={(f) => {
              setCertFile(f);
              setSkipCert(false);
              setResults(null);
            }}
            onClear={() => setCertFile(null)}
            accent="emerald"
          />
          <div className="flex items-center justify-end px-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                setCertFile(null);
                setSkipCert(true);
              }}
              disabled={!certFile && skipCert}
            >
              {skipCert ? "Skipped — no certificate" : "Skip (no certificate)"}
            </Button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-muted-foreground">
            {!selectedRubric
              ? "Select a position to continue."
              : !cvFile
              ? "Upload a CV to continue."
              : certFile && !skipCert
              ? "Ready: CV + language certificate."
              : "Ready: CV only (no certificate)."}
          </div>
          <Button onClick={handleUpload} disabled={!canSubmit}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload &amp; Process
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upload progress */}
      {uploading && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Processing documents…</p>
              <p className="text-xs text-muted-foreground mt-1">
                Extracting text, normalizing, and running NER anonymization
              </p>
            </div>
            <Progress value={undefined} className="w-64" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Upload Complete
            </CardTitle>
            <CardDescription>
              {results.uploaded_count} document(s) processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.candidates.map((c, idx) => {
              const isCert = c.document?.document_type === "certificate";
              return (
                <div
                  key={`${c.candidate_id}-${idx}`}
                  className="p-4 rounded-lg border bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {c.anonymous_id}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {isCert ? "certificate" : "cv"}
                      </Badge>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.document.page_count} pages ·{" "}
                      {c.document.file_size_kb?.toFixed(1)} KB
                    </span>
                  </div>

                  {isCert ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      {c.document.language_score != null ? (
                        <>
                          <span className="font-medium text-foreground">
                            {(c.document.certificate_kind || "cert").toUpperCase()}{" "}
                            {c.document.language_score}
                          </span>
                          <span>·</span>
                          <span className="font-medium text-foreground">
                            {c.document.cefr_level || "—"}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-emerald-600">
                            +{Number(c.document.language_bonus || 0).toFixed(0)} pts bonus
                          </span>
                        </>
                      ) : (
                        <span>
                          Certificate detected but no score could be extracted.
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          Sections:
                        </span>
                        {(c.document.sections_detected || []).map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                      {c.anonymization && (
                        <div className="text-xs text-muted-foreground">
                          {c.anonymization.entity_count} entities anonymized
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!uploading && !results && !cvFile && !certFile && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Choose a position, then upload a CV (and optional certificate) to
              start screening.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

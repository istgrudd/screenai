import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Play,
  Users,
  Trophy,
  Filter,
  ExternalLink,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { listCandidates, listRubrics, runEvaluation } from "@/lib/api";

const CEFR_PILL = {
  A1: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  A2: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  B1: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  B2: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  C1: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

function CefrPill({ level }) {
  if (!level) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
        CEFR_PILL[level] || "bg-muted text-foreground"
      }`}
    >
      {level}
    </span>
  );
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const val = Number(score);
  let color = "bg-red-500/15 text-red-700 dark:text-red-400";
  if (val >= 75) color = "bg-green-500/15 text-green-700 dark:text-green-400";
  else if (val >= 50) color = "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
  else if (val >= 25) color = "bg-orange-500/15 text-orange-700 dark:text-orange-400";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${color}`}>
      {val.toFixed(1)}
    </span>
  );
}

function MiniBar({ score, max = 100 }) {
  if (score == null) return <div className="h-2 w-16 rounded-full bg-muted" />;
  const pct = Math.min((score / max) * 100, 100);
  let barColor = "bg-red-500";
  if (score >= 75) barColor = "bg-green-500";
  else if (score >= 50) barColor = "bg-yellow-500";
  else if (score >= 25) barColor = "bg-orange-500";

  return (
    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [selectedRubric, setSelectedRubric] = useState("all");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candidateData, rubricData] = await Promise.all([
        listCandidates(selectedRubric !== "all" ? Number(selectedRubric) : null),
        listRubrics(),
      ]);
      setCandidates(candidateData);
      setRubrics(rubricData);
    } catch (err) {
      toast.error(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRubric]);

  const handleEvaluate = async () => {
    if (selectedRubric === "all") {
      toast.error("Please select a rubric first.");
      return;
    }
    setEvaluating(true);
    try {
      const result = await runEvaluation(Number(selectedRubric));
      toast.success(
        `Evaluation complete: ${result.evaluated_count} candidate(s) scored.`
      );
      if (result.error_count > 0) {
        toast.warning(`${result.error_count} candidate(s) had errors.`);
      }
      fetchData();
    } catch (err) {
      toast.error(`Evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const scoredCount = candidates.filter(
    (c) => c.composite_score != null
  ).length;
  const topScore = candidates.length > 0 && candidates[0].composite_score != null
    ? candidates[0].composite_score
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Candidate rankings and evaluation results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRubric} onValueChange={setSelectedRubric}>
            <SelectTrigger className="w-56">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by rubric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Candidates</SelectItem>
              {rubrics.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={selectedRubric === "all" ? 0 : -1}>
                <Button
                  onClick={handleEvaluate}
                  disabled={evaluating || selectedRubric === "all"}
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Evaluation
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {selectedRubric === "all" && (
              <TooltipContent>Select a rubric first</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{candidates.length}</p>
              <p className="text-xs text-muted-foreground">Total Candidates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{scoredCount}</p>
              <p className="text-xs text-muted-foreground">Scored</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {topScore != null ? topScore.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Top Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidate table */}
      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading candidates…</span>
          </CardContent>
        </Card>
      ) : candidates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium mb-1">No candidates found</p>
            <p className="text-sm text-muted-foreground">
              Upload CVs first, then run an evaluation with a rubric.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Candidate ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Composite Score</TableHead>
                  {/* Show dimension columns if rubric is selected */}
                  {selectedRubric !== "all" &&
                    candidates.length > 0 &&
                    candidates[0].dimension_scores &&
                    candidates[0].dimension_scores.map((ds) => (
                      <TableHead key={ds.dimension_id} className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs cursor-help">
                              {ds.dimension_name.length > 12
                                ? ds.dimension_name.slice(0, 12) + "…"
                                : ds.dimension_name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{ds.dimension_name}</TooltipContent>
                        </Tooltip>
                      </TableHead>
                    ))}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow
                    key={c.candidate_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/candidates/${c.candidate_id}`)}
                  >
                    <TableCell className="text-center font-medium tabular-nums">
                      {c.rank ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{c.anonymous_id}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "scored"
                            ? "default"
                            : c.status === "anonymized"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <ScoreBadge score={c.composite_score} />
                        {c.cefr_level && <CefrPill level={c.cefr_level} />}
                      </div>
                    </TableCell>
                    {c.dimension_scores &&
                      c.dimension_scores.map((ds) => (
                        <TableCell
                          key={ds.dimension_id}
                          className="text-center"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs tabular-nums font-medium">
                              {ds.score.toFixed(0)}
                            </span>
                            <MiniBar score={ds.score} />
                          </div>
                        </TableCell>
                      ))}
                    <TableCell>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Evaluation running notice */}
      {evaluating && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Evaluation in progress…</p>
              <p className="text-xs text-muted-foreground">
                The LLM is scoring each candidate against the rubric. This may
                take a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

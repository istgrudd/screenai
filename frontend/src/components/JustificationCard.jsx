import { Quote, Pencil, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function JustificationCard({ dimScore, color, onOverride }) {
  const s = dimScore;
  const scoreVal = Number(s.score);

  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{s.dimension_name}</h3>
              {s.is_override && (
                <Badge variant="outline" className="text-xs gap-1 text-yellow-600 border-yellow-300">
                  <ShieldAlert className="w-3 h-3" /> Overridden
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Weight: {Math.round(s.weight * 100)}%</span>
              <span>Weighted: {s.weighted_score?.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {scoreVal.toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={onOverride}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Override reason */}
        {s.is_override && s.override_reason && (
          <div className="text-xs p-2 rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <span className="font-medium">Override reason:</span> {s.override_reason}
          </div>
        )}

        {/* Justification */}
        {s.justification && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Justification
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {s.justification}
            </p>
          </div>
        )}

        {/* Evidence */}
        {s.evidence && s.evidence.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Evidence
            </p>
            <div className="space-y-2">
              {s.evidence.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 text-sm"
                >
                  <Quote className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-foreground/70 italic leading-relaxed">
                    {e}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

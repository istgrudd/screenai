import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function OverrideDialog({ open, onOpenChange, dimScore, onSubmit }) {
  const [score, setScore] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opening
  const handleOpenChange = (isOpen) => {
    if (isOpen && dimScore) {
      setScore(String(dimScore.score ?? ""));
      setReason("");
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return;
    }
    if (!reason.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(numScore, reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const numScore = Number(score);
  const scoreValid = !isNaN(numScore) && numScore >= 0 && numScore <= 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Score</DialogTitle>
          <DialogDescription>
            {dimScore
              ? `Adjust the score for "${dimScore.dimension_name}". Current score: ${dimScore.score?.toFixed(1)}`
              : "Adjust the dimension score."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>New Score (0–100)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 75"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="tabular-nums"
            />
            {score && !scoreValid && (
              <p className="text-xs text-destructive">
                Score must be between 0 and 100.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason for override</Label>
            <Textarea
              placeholder="Explain why you're adjusting this score…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            {reason.length === 0 && (
              <p className="text-xs text-muted-foreground">
                A reason is required for any score override.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !scoreValid || !reason.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              "Save Override"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

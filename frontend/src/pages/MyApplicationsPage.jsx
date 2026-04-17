import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, EyeOff, Inbox } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { listMyApplications } from "@/lib/api";

const STATUS_VARIANT = {
  uploaded: "secondary",
  extracted: "secondary",
  anonymized: "outline",
  scored: "default",
};

function StatusBadge({ status }) {
  const variant = STATUS_VARIANT[status] || "secondary";
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

function ScoreCell({ status, score }) {
  if (status !== "scored" || score == null) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <EyeOff className="w-3.5 h-3.5" />
        <span>Pending evaluation</span>
      </div>
    );
  }
  return (
    <span className="font-semibold tabular-nums">
      {Number(score).toFixed(2)}
    </span>
  );
}

export default function MyApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await listMyApplications();
        setApplications(data || []);
      } catch (err) {
        toast.error(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          My Applications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track the CVs you've submitted and their evaluation status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Submissions
          </CardTitle>
          <CardDescription>
            Scores are hidden until a recruiter completes evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium">No applications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a CV to apply for a position.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Composite Score</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.candidate_id}>
                    <TableCell className="font-mono text-xs">
                      {app.anonymous_id}
                    </TableCell>
                    <TableCell>
                      {app.rubric_name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {app.filename || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell>
                      <ScoreCell
                        status={app.status}
                        score={app.composite_score}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

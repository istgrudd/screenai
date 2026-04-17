import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { getCurrentUser, isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/**
 * Route guard. Usage:
 *   <ProtectedRoute roles={["recruiter", "super_admin"]}>
 *     <DashboardPage />
 *   </ProtectedRoute>
 *
 * - Unauthenticated → redirect to /login.
 * - Wrong role      → render a 403 Forbidden screen.
 */
export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getCurrentUser();
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <ForbiddenPage />;
  }

  return children;
}

function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold">403 — Forbidden</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <Button asChild variant="outline">
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  );
}

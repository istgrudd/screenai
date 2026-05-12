import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { BarChart3, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login as loginApi, resendVerification } from "@/lib/api";
import {
  saveToken,
  isAuthenticated,
  getCurrentUser,
  defaultPathForRole,
} from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(
    location.state?.pendingVerification ? location.state.email : null
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      navigate(defaultPathForRole(user?.role), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state?.registered) {
      toast.success("Account created. Please log in.");
    }
    if (location.state?.verified) {
      toast.success("Email verified! You can now sign in.");
    }
  }, [location.state]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await loginApi(email.trim(), password);
      saveToken(data.access_token);
      toast.success(`Welcome back, ${data.user.full_name}`);
      navigate(defaultPathForRole(data.user.role), { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resendEmail = async () => {
    if (!pendingEmail) return;
    setResending(true);
    try {
      await resendVerification(pendingEmail);
      toast.success("Verification email sent. Check your inbox.");
    } catch (err) {
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Sign in to ScreenAI</CardTitle>
          <CardDescription>
            Access your recruitment screening dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEmail && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <p className="font-medium">Verifikasi email diperlukan</p>
              <p className="mt-1 text-xs">
                Kami mengirim link verifikasi ke{" "}
                <span className="font-mono font-medium">{pendingEmail}</span>.
                Cek inbox atau folder spam kamu.
              </p>
              <button
                type="button"
                onClick={resendEmail}
                disabled={resending}
                className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                {resending ? "Mengirim..." : "Kirim ulang email verifikasi"}
              </button>
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

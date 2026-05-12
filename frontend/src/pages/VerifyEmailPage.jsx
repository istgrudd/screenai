import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { BarChart3, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { verifyEmail } from "@/lib/api";

/**
 * Handles the email verification link:
 *   /verify-email?token=<token>
 *
 * States:
 *   verifying — spinner while API call is in flight
 *   success   — green check, link to /login
 *   error     — red cross, error message, link back to /login
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg("Token verifikasi tidak ditemukan di URL.");
      setStatus("error");
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success");
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { replace: true, state: { verified: true } });
        }, 3000);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Token tidak valid atau sudah kadaluarsa.");
        setStatus("error");
      });
  }, []); // run once on mount

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>

          {status === "verifying" && (
            <>
              <CardTitle className="text-2xl">Memverifikasi email…</CardTitle>
              <CardDescription>Mohon tunggu sebentar.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CardTitle className="text-2xl">Email terverifikasi!</CardTitle>
              <CardDescription>
                Akun kamu sudah aktif. Kamu akan diarahkan ke halaman login.
              </CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <CardTitle className="text-2xl">Verifikasi gagal</CardTitle>
              <CardDescription>{errorMsg}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "verifying" && (
            <Loader2 className="mx-auto w-8 h-8 animate-spin text-muted-foreground" />
          )}
          {status === "success" && (
            <CheckCircle2 className="mx-auto w-12 h-12 text-green-500" />
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto w-12 h-12 text-destructive" />
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Kembali ke halaman login</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"""Email delivery service using the Resend API."""

import httpx

from backend.config import settings


_RESEND_API_URL = "https://api.resend.com/emails"


def send_verification_email(to_email: str, full_name: str, token: str) -> bool:
    """Send a verification link to the given email address.

    In development (RESEND_API_KEY not set), prints the link to stdout
    instead of sending — so registration works without an email account.

    Returns True if accepted or dev mode, False on delivery failure.
    Failures are logged but never raise — registration should still succeed
    so the user can request a resend later.
    """
    if not settings.resend_api_key:
        frontend_base = settings.frontend_url.rstrip("/")
        verify_url = f"{frontend_base}/verify-email?token={token}"
        print(f"[DEV] Email verification link for {to_email}: {verify_url}")
        return True

    frontend_base = settings.frontend_url.rstrip("/")
    verify_url = f"{frontend_base}/verify-email?token={token}"

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #1e293b;">Verifikasi Email Kamu</h2>
      <p>Halo {full_name},</p>
      <p>Klik tombol di bawah untuk mengaktifkan akun ScreenAI kamu.</p>
      <p style="margin: 32px 0;">
        <a href="{verify_url}"
           style="background:#2563eb;color:#fff;padding:12px 24px;
                  border-radius:6px;text-decoration:none;font-weight:600;">
          Verifikasi Email
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">
        Link ini berlaku selama {settings.email_verification_expire_hours} jam.<br>
        Jika kamu tidak mendaftar di ScreenAI, abaikan email ini.
      </p>
    </div>
    """

    try:
        response = httpx.post(
            _RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.email_from,
                "to": [to_email],
                "subject": "Verifikasi Email — ScreenAI",
                "html": html_body,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        return True
    except Exception as exc:
        print(f"[EMAIL] Failed to send verification to {to_email}: {exc}")
        return False

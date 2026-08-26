import smtplib
import threading
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import requests
import msal
from app.config import settings

# Global MSAL app instance cache
_msal_app: Optional[msal.ConfidentialClientApplication] = None
_msal_lock = threading.Lock()
_graph_lock = threading.Lock()

def _get_msal_app(tenant_id: str, client_id: str, client_secret: str) -> msal.ConfidentialClientApplication:
    global _msal_app
    with _msal_lock:
        if _msal_app is None:
            authority = f"https://login.microsoftonline.com/{tenant_id}"
            _msal_app = msal.ConfidentialClientApplication(
                client_id=client_id,
                client_credential=client_secret,
                authority=authority,
            )
        return _msal_app

def _send_via_microsoft_graph(to_email: str, subject: str, body_html: str, 
                              tenant_id: str, client_id: str, client_secret: str, sender_email: str) -> bool:
    """
    Sends an email using Microsoft Graph API (Microsoft 365 / Outlook).
    Endpoint: POST https://graph.microsoft.com/v1.0/users/{sender_email}/sendMail
    Thread-safe and handles Microsoft 429 MailboxConcurrency throttling with automatic retry.
    """
    try:
        app = _get_msal_app(tenant_id, client_id, client_secret)
        scopes = ["https://graph.microsoft.com/.default"]

        result = app.acquire_token_silent(scopes=scopes, account=None)
        if not result:
            result = app.acquire_token_for_client(scopes=scopes)

        if "access_token" not in result:
            err = result.get("error_description") or result.get("error") or "Unknown MSAL error"
            print(f"[Email Service Error] Failed to acquire Microsoft Graph access token: {err}")
            return False

        token = result["access_token"]
        url = f"https://graph.microsoft.com/v1.0/users/{sender_email}/sendMail"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "message": {
                "subject": subject,
                "importance": "normal",
                "body": {
                    "contentType": "HTML",
                    "content": body_html,
                },
                "from": {
                    "emailAddress": {
                        "name": "Quadrant IT Services",
                        "address": sender_email
                    }
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": to_email
                        }
                    }
                ],
            },
            "saveToSentItems": True,
        }

        # Use mutex lock to serialize Microsoft Graph sendMail requests and avoid 429 MailboxConcurrency limits
        with _graph_lock:
            max_retries = 3
            for attempt in range(1, max_retries + 1):
                response = requests.post(url, headers=headers, json=payload, timeout=20)
                if response.status_code in (200, 202):
                    print(f"[Email Service] Successfully sent email to {to_email} via Microsoft Graph (Outlook): '{subject}'", flush=True)
                    time.sleep(0.5)  # Small pacing interval to prevent bursting
                    return True
                elif response.status_code == 429 and attempt < max_retries:
                    print(f"[Email Service Warning] Graph 429 concurrency limit on attempt {attempt} for {to_email}. Retrying in 1.5s...", flush=True)
                    time.sleep(1.5)
                else:
                    try:
                        err_detail = response.json().get("error", {}).get("message", response.text)
                    except Exception:
                        err_detail = response.text
                    print(f"[Email Service Error] Microsoft Graph API error (HTTP {response.status_code}) sending to {to_email}: {err_detail}", flush=True)
                    return False

            return False

    except Exception as e:
        print(f"[Email Service Exception] Error sending email via Microsoft Graph to {to_email}: {e}", flush=True)
        return False

def _send_via_smtp(to_email: str, subject: str, body_html: str,
                   smtp_user: str, smtp_password: str, smtp_host: str, smtp_port: int, from_email: str) -> bool:
    """
    Fallback helper to send an HTML email via standard SMTP (Office 365 / SMTP Relay).
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

        html_part = MIMEText(body_html, "html")
        msg.attach(html_part)

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, 465, timeout=10)
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            print(f"[Email Service] Successfully sent email to {to_email} via SSL Port 465: '{subject}'")
            return True

        # Standard Port 587 STARTTLS
        try:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            print(f"[Email Service] Successfully sent email to {to_email} via Port {smtp_port}: '{subject}'")
            return True
        except Exception as e587:
            print(f"[Email Service Warning] Connection via Port {smtp_port} failed ({e587}). Attempting Port 465 SSL fallback...")
            server = smtplib.SMTP_SSL(smtp_host, 465, timeout=10)
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            print(f"[Email Service] Successfully sent email to {to_email} via Port 465 SSL Fallback: '{subject}'")
            return True

    except Exception as e:
        print(f"[Email Service Error] SMTP failed for {to_email}: {e}")
        return False

def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """
    Primary dispatcher function to send an HTML email.
    Prefers Microsoft Graph API (Outlook / Microsoft 365) if configured,
    and seamlessly falls back to SMTP if SMTP is configured.
    """
    if not getattr(settings, "EMAILS_ENABLED", True):
        print("[Email Service] Email dispatch is disabled in settings.")
        return False

    tenant_id = getattr(settings, "AZURE_TENANT_ID", "").strip()
    client_id = getattr(settings, "AZURE_CLIENT_ID", "").strip()
    client_secret = getattr(settings, "AZURE_CLIENT_SECRET", "").strip()
    sender_email = getattr(settings, "SENDER_EMAIL", "").strip() or getattr(settings, "SMTP_FROM_EMAIL", "").strip()

    # 1. Primary path: Microsoft Graph API (Microsoft 365 / Outlook)
    if tenant_id and client_id and client_secret and sender_email:
        graph_ok = _send_via_microsoft_graph(
            to_email=to_email,
            subject=subject,
            body_html=body_html,
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
            sender_email=sender_email
        )
        if graph_ok:
            return True
        print("[Email Service] Microsoft Graph send failed, attempting SMTP fallback if configured...", flush=True)

    # 2. Fallback path: Standard SMTP
    smtp_user = getattr(settings, "SMTP_USER", "").strip()
    smtp_password = getattr(settings, "SMTP_PASSWORD", "").strip()
    smtp_host = getattr(settings, "SMTP_HOST", "smtp.office365.com").strip()
    smtp_port = int(getattr(settings, "SMTP_PORT", 587))
    from_email = sender_email or smtp_user

    if smtp_user and smtp_password:
        return _send_via_smtp(
            to_email=to_email,
            subject=subject,
            body_html=body_html,
            smtp_user=smtp_user,
            smtp_password=smtp_password,
            smtp_host=smtp_host,
            smtp_port=smtp_port,
            from_email=from_email
        )

    print("[Email Service] Neither Microsoft Graph API nor SMTP credentials are fully configured in .env.")
    return False

def send_email_async(to_email: str, subject: str, body_html: str):
    """
    Dispatches email in a daemon thread so it never blocks or crashes the main request thread.
    """
    def _runner():
        try:
            send_email(to_email, subject, body_html)
        except Exception as ex:
            import traceback
            print(f"[Email Service Thread Error] Exception in send_email_async for {to_email}: {ex}\n{traceback.format_exc()}", flush=True)

    thread = threading.Thread(target=_runner, daemon=True)
    thread.start()

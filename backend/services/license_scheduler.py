import time
import threading
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from services.db_services import get_licenses, get_admin_emails, create_notification, log_activity
from services.email_service import send_email_async

_scheduler_running = False
_scheduler_thread = None
_last_run_date: Optional[date] = None

def parse_license_date(date_str: str) -> Optional[date]:
    """
    Parses various date string formats used for licenses.
    Supported: '10 May 2026', '2026-05-10', '10-05-2026', '10/05/2026', ISO formats, etc.
    """
    if not date_str:
        return None
    cleaned = date_str.strip()
    if "T" in cleaned:
        cleaned = cleaned.split("T")[0]
        
    date_formats = [
        "%d %b %Y",       # 10 May 2026
        "%d %B %Y",       # 10 August 2026
        "%Y-%m-%d",       # 2026-05-10
        "%d-%m-%Y",       # 10-05-2026
        "%d/%m/%Y",       # 10/05/2026
        "%m/%d/%Y",       # 05/10/2026
        "%Y/%m/%d",       # 2026/05/10
        "%b %d, %Y",       # May 10, 2026
        "%B %d, %Y"        # August 10, 2026
    ]
    for fmt in date_formats:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return None

def build_license_expiry_email_html(lic_name: str, end_date: str, days_left: int, status: str, is_automated: bool = True) -> str:
    """
    Constructs an HTML email for software license expiry notice.
    """
    if days_left == 0:
        urgency_text = "EXPIRES TODAY"
        urgency_color = "#dc2626"
        badge_bg = "#fef2f2"
    elif days_left < 0:
        urgency_text = f"EXPIRED ({abs(days_left)} days ago)"
        urgency_color = "#dc2626"
        badge_bg = "#fef2f2"
    elif days_left == 1:
        urgency_text = "EXPIRES TOMORROW (1 Day Left)"
        urgency_color = "#dc2626"
        badge_bg = "#fef2f2"
    elif days_left <= 5:
        urgency_text = f"CRITICAL: {days_left} Days Remaining"
        urgency_color = "#d97706"
        badge_bg = "#fffbeb"
    elif days_left == 10:
        urgency_text = "NOTICE: 10 Days Remaining"
        urgency_color = "#2563eb"
        badge_bg = "#eff6ff"
    else:
        urgency_text = f"Notice: {days_left} Days Remaining"
        urgency_color = "#4b5563"
        badge_bg = "#f3f4f6"

    trigger_type = "Automated Morning 10:00 AM Expiry Alert" if is_automated else "Manual Administrative Expiry Alert"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <style>
            body {{ font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07); }}
            .header {{ background: #0b2545; color: #ffffff; padding: 24px; text-align: center; }}
            .header h2 {{ margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }}
            .header p {{ margin: 0; font-size: 13px; color: #93c5fd; }}
            .content {{ padding: 24px; }}
            .alert-pill {{ display: inline-block; background: {badge_bg}; color: {urgency_color}; border: 1px solid {urgency_color}33; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }}
            .alert-box {{ background: {badge_bg}; border-left: 4px solid {urgency_color}; padding: 16px; border-radius: 8px; margin-bottom: 20px; }}
            .alert-title {{ color: {urgency_color}; font-weight: 700; margin: 0 0 4px 0; font-size: 14px; }}
            .alert-desc {{ color: #334155; font-size: 13px; margin: 0; line-height: 1.5; }}
            .details-table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
            .details-table td {{ padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }}
            .details-table td.label {{ color: #64748b; font-weight: 600; width: 38%; }}
            .details-table td.value {{ color: #0f172a; font-weight: 700; }}
            .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; line-height: 1.5; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Software Subscription Expiry Alert</h2>
                <p>Quadrant IT Services - Asset & License Management</p>
            </div>
            <div class="content">
                <div class="alert-pill">{urgency_text}</div>
                <div class="alert-box">
                    <p class="alert-title">Subscription Renewal Required</p>
                    <p class="alert-desc">The software subscription for <strong>{lic_name}</strong> is nearing expiration. Please review and process the subscription renewal in the Admin Portal.</p>
                </div>
                <table class="details-table">
                    <tr>
                        <td class="label">Software Name:</td>
                        <td class="value">{lic_name}</td>
                    </tr>
                    <tr>
                        <td class="label">Expiry Date:</td>
                        <td class="value" style="color: #dc2626;">{end_date}</td>
                    </tr>
                    <tr>
                        <td class="label">Days Remaining:</td>
                        <td class="value" style="color: {urgency_color};">{days_left if days_left >= 0 else 'Expired'}</td>
                    </tr>
                    <tr>
                        <td class="label">Subscription Status:</td>
                        <td class="value">{status}</td>
                    </tr>
                    <tr>
                        <td class="label">Notification Type:</td>
                        <td class="value">{trigger_type}</td>
                    </tr>
                </table>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Please log in to the QITS Admin Portal to manage licenses and renew subscriptions.</p>
            </div>
            <div class="footer">
                &copy; 2026 Quadrant IT Services &bull; Automated IT Asset Management System
            </div>
        </div>
    </body>
    </html>
    """

def send_license_alert_to_all_admins(
    db: Session,
    lic: Any,
    days_left: Optional[int] = None,
    is_automated: bool = False,
    operator_name: str = "System"
) -> Dict[str, Any]:
    """
    Dispatches expiry notification email for a license to all active admins and logs the event.
    """
    admin_emails = get_admin_emails(db)
    if getattr(lic, "admin_email", None) and lic.admin_email:
        clean_lic_admin = str(lic.admin_email).strip().replace(".@", "@")
        if "@" in clean_lic_admin and "." in clean_lic_admin.split("@")[-1] and clean_lic_admin not in admin_emails:
            admin_emails.append(clean_lic_admin)

    if not admin_emails:
        admin_emails = ["admin@company.com"]

    if days_left is None:
        expiry_date = parse_license_date(lic.end_date)
        if expiry_date:
            days_left = (expiry_date - date.today()).days
        else:
            days_left = 0

    if days_left == 0:
        subject = f"[QITS Asset Alert] 🚨 Final Day Expiry Notice: Software Subscription '{lic.name}'"
    elif days_left < 0:
        subject = f"[QITS Asset Alert] 🚨 EXPIRED Subscription Notice: '{lic.name}'"
    elif days_left == 1:
        subject = f"[QITS Asset Alert] ⚠️ 1 Day Remaining: Software Subscription '{lic.name}'"
    elif days_left <= 5:
        subject = f"[QITS Asset Alert] ⚠️ {days_left} Days Remaining: Software Subscription '{lic.name}'"
    elif days_left == 10:
        subject = f"[QITS Asset Alert] ⚠️ 10-Day Expiry Notice: Software Subscription '{lic.name}'"
    else:
        subject = f"[QITS Asset Alert] Subscription Expiry Notice: {lic.name}"

    body_html = build_license_expiry_email_html(
        lic_name=lic.name,
        end_date=lic.end_date,
        days_left=days_left,
        status=lic.status,
        is_automated=is_automated
    )

    # Dispatch to all admins
    for email_addr in admin_emails:
        send_email_async(email_addr, subject, body_html)

    recipients_str = ", ".join(admin_emails)
    action_type = "Automated Morning 10AM Alert" if is_automated else "Manual Alert"
    msg = f"{action_type} email sent to Admin(s) ({recipients_str}) for license \"{lic.name}\" expiring on {lic.end_date} ({days_left} days remaining)."
    create_notification(db, "License Expiry Email Alert", msg, "alert")
    log_activity(db, operator_name, "License Expiry Alert", msg)

    return {
        "success": True,
        "license_id": lic.id,
        "license_name": lic.name,
        "days_left": days_left,
        "recipients": admin_emails,
        "message": f"Expiry alert email sent successfully to admin(s): {recipients_str}"
    }

def check_and_trigger_all_license_expiry_alerts(db: Optional[Session] = None, force_all: bool = False) -> List[Dict[str, Any]]:
    """
    Checks all software licenses.
    Sends automatic email alert if:
    - Exactly 10 days before expiry (days_left == 10)
    - 5 days before expiry to last day (0 <= days_left <= 5)
    If force_all=True, evaluates without strict schedule filters (useful for full manual scan).
    """
    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    results = []
    try:
        licenses = get_licenses(db)
        today = date.today()

        for lic in licenses:
            if getattr(lic, "status", "") in ["Cancelled", "Inactive"]:
                continue

            expiry_date = parse_license_date(lic.end_date)
            if not expiry_date:
                continue

            days_left = (expiry_date - today).days

            # Condition: 10th day before expiry OR 5th day down to 0 days (last day)
            should_trigger = force_all or (days_left == 10) or (0 <= days_left <= 5)

            if should_trigger:
                res = send_license_alert_to_all_admins(
                    db=db,
                    lic=lic,
                    days_left=days_left,
                    is_automated=True,
                    operator_name="10AM License Scheduler"
                )
                results.append(res)

        print(f"[License Scheduler] Expiry check completed. {len(results)} alerts triggered for today ({today}).")
    except Exception as e:
        print(f"[License Scheduler Error] Failed during license expiry scan: {e}")
    finally:
        if should_close_db:
            db.close()

    return results

def _scheduler_loop():
    global _last_run_date, _scheduler_running
    print("[License Scheduler] Background scheduler daemon started. Monitoring for daily 10:00 AM license expiry alerts.")
    
    while _scheduler_running:
        try:
            now = datetime.now()
            today = now.date()

            # Trigger at 10:00 AM daily (checks during the 10:00-10:59 window once per calendar day)
            if now.hour == 10 and _last_run_date != today:
                print(f"[License Scheduler] Morning 10:00 AM triggered on {today}. Scanning for expiring software licenses...")
                check_and_trigger_all_license_expiry_alerts()
                _last_run_date = today

            # Sleep 30 seconds before next check
            time.sleep(30)
        except Exception as e:
            print(f"[License Scheduler Loop Error]: {e}")
            time.sleep(30)

def start_license_expiry_scheduler():
    """
    Starts the license expiry scheduler background daemon thread.
    """
    global _scheduler_running, _scheduler_thread
    if _scheduler_running:
        return

    _scheduler_running = True
    _scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True, name="LicenseExpirySchedulerThread")
    _scheduler_thread.start()

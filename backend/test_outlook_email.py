"""
Test script to verify Microsoft 365 / Outlook email dispatch.
Run this script after filling in your credentials in .env:
    .venv\\Scripts\\python test_outlook_email.py
"""

import sys
from app.config import settings
from services.email_service import send_email

def main():
    print("==================================================")
    print(" Microsoft 365 / Outlook Email Dispatch Test")
    print("==================================================")
    
    tenant_id = getattr(settings, "AZURE_TENANT_ID", "").strip()
    client_id = getattr(settings, "AZURE_CLIENT_ID", "").strip()
    client_secret = getattr(settings, "AZURE_CLIENT_SECRET", "").strip()
    sender_email = getattr(settings, "SENDER_EMAIL", "").strip()

    print(f"Configured SENDER_EMAIL : {sender_email or '(not set)'}")
    print(f"Configured TENANT_ID    : {'*' * (len(tenant_id) - 4) + tenant_id[-4:] if len(tenant_id) > 4 else '(not set)'}")
    print(f"Configured CLIENT_ID    : {'*' * (len(client_id) - 4) + client_id[-4:] if len(client_id) > 4 else '(not set)'}")
    print(f"Configured CLIENT_SECRET: {'*** Configured ***' if client_secret else '(not set)'}")
    print("--------------------------------------------------")

    if not all([tenant_id, client_id, client_secret, sender_email]):
        print("\n[ERROR] Incomplete Microsoft Azure credentials in backend/.env!")
        print("Please ensure the following are filled in backend/.env:")
        print("  - AZURE_TENANT_ID")
        print("  - AZURE_CLIENT_ID")
        print("  - AZURE_CLIENT_SECRET")
        print("  - SENDER_EMAIL")
        sys.exit(1)

    recipient = input("\nEnter recipient email to receive test message (e.g., your personal/work email): ").strip()
    if not recipient:
        recipient = sender_email

    print(f"\nSending test email to: {recipient} ...")

    subject = "[QITS] Microsoft 365 / Outlook Integration Test"
    body_html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0078D4;">Microsoft 365 / Outlook Email Test</h2>
        <p>Hello,</p>
        <p>This is a test email sent from <strong>QITS Asset Management System</strong> via Microsoft Graph API.</p>
        <div style="background-color: #f4f6f9; padding: 15px; border-left: 4px solid #0078D4; margin: 15px 0;">
            <p style="margin: 0;"><strong>Sender:</strong> {sender_email}</p>
            <p style="margin: 0;"><strong>Status:</strong> Active & Connected</p>
        </div>
        <p>All automated notifications (to Admins and Employees) will now be routed through this mailbox.</p>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">QITS Asset Management</p>
    </div>
    """

    success = send_email(to_email=recipient, subject=subject, body_html=body_html)

    if success:
        print("\n[SUCCESS] Test email was sent successfully!")
    else:
        print("\n[FAILED] Test email could not be sent. Please check the logs above.")

if __name__ == "__main__":
    main()

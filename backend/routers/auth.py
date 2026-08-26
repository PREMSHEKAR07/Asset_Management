import re
import secrets
import time
import threading
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from database.connection import get_db
from schemas import (
    LoginRequest, TokenResponse, ChangePasswordRequest, VerifyPasswordRequest,
    ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest,
    SignUpRequestOtp, SignUpVerifyOtp, EmployeeSignUpRequest
)
from services import (
    get_employee_by_username_or_email, verify_password, get_password_hash,
    create_access_token, decode_access_token, change_employee_password,
    log_activity, send_email_async, create_employee, get_employee_by_id
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Security Dependency to get the current authenticated user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    emp_id = payload.get("sub")
    if not emp_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Query database using raw SQL or ORM. Let's do raw SQL.
    from sqlalchemy import text
    user = db.execute(text("SELECT id, name, email, role, department, designation, username, phone, status, avatar, location, joining_date FROM employees WHERE id = :id"), {"id": emp_id}).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
        
    return user

# Security Dependency to require Admin role
def require_admin(current_user = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privilege required",
        )
    return current_user

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    clean_username = (request.username or "").strip()
    clean_password = (request.password or "")

    if not clean_username or not clean_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email/username and password are required",
        )

    # 1. Find employee by username, email, ID, or name
    user = get_employee_by_username_or_email(db, clean_username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password",
        )
        
    # 2. Verify password against stored hash
    stored_hash = getattr(user, "password_hash", "") or ""
    is_valid_pass = verify_password(clean_password, stored_hash)

    if not is_valid_pass:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password",
        )
        
    if getattr(user, "status", "Active") != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is inactive. Please contact administrator.",
        )

    # Resolve role from user database record
    resolved_role = user.role or "Employee"

    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": resolved_role})
    
    # Log login activity
    log_activity(db, user.name, f"{resolved_role} Login", f"{user.name} logged in as {resolved_role}")
    
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "role": resolved_role,
        "department": user.department,
        "designation": user.designation,
        "phone": user.phone,
        "status": user.status,
        "avatar": user.avatar,
        "location": user.location,
        "joiningDate": user.joining_date
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "department": current_user.department,
        "designation": current_user.designation,
        "phone": current_user.phone,
        "status": current_user.status,
        "avatar": current_user.avatar,
        "location": current_user.location,
        "joiningDate": current_user.joining_date
    }

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify current password
    # Fetch password hash from DB
    from sqlalchemy import text
    import re
    stored_hash = db.execute(text("SELECT password_hash FROM employees WHERE id = :id"), {"id": current_user.id}).scalar()
    
    if not stored_hash or not verify_password(request.current_password, str(stored_hash)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Validate password constraints
    new_pass = request.new_password
    if len(new_pass) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r'[A-Z]', new_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]', new_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )
        
    change_employee_password(db, current_user.id, request.new_password)
    log_activity(db, current_user.name, "Change Password", f"Password changed for {current_user.name}")
    return {"message": "Password changed successfully"}

@router.post("/verify-password")
def verify_admin_password(
    request: VerifyPasswordRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    stored_hash = db.execute(text("SELECT password_hash FROM employees WHERE id = :id"), {"id": current_user.id}).scalar()
    if not stored_hash or not verify_password(request.password, str(stored_hash)):
        return {"valid": False, "message": "Incorrect admin password"}
    return {"valid": True, "message": "Password verified"}

# --- FORGOT PASSWORD / OTP SERVICES ---
_otp_lock = threading.Lock()
_reset_otp_store = {}  # { employee_id: { "otp": str, "expires_at": float, "attempts": int, "email": str, "name": str } }

def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "your registered email"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "***"
    else:
        masked_user = user_part[0] + "***" + user_part[-1]
    return f"{masked_user}@{domain}"

def _build_otp_email_html(recipient_name: str, otp_code: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP - Quadrant IT Services</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:30px 10px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
                        <!-- Header Bar -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding:28px 32px; text-align:left;">
                                <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.5px;">Quadrant IT Services</h1>
                                <p style="margin:4px 0 0 0; color:#bfdbfe; font-size:12px; font-weight:500;">Asset Management Portal &bull; Security Verification</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding:32px 32px 24px 32px;">
                                <h2 style="margin:0 0 12px 0; color:#0f172a; font-size:18px; font-weight:600;">Password Reset Request</h2>
                                <p style="margin:0 0 16px 0; color:#475569; font-size:14px; line-height:1.6;">
                                    Hello <strong>{recipient_name}</strong>,
                                </p>
                                <p style="margin:0 0 24px 0; color:#475569; font-size:14px; line-height:1.6;">
                                    We received a request to reset the password for your Quadrant Asset Management Portal account. Use the verification code below to proceed with resetting your password:
                                </p>
                                
                                <!-- OTP Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                                    <tr>
                                        <td align="center" style="background-color:#f0f7ff; border:2px dashed #93c5fd; border-radius:12px; padding:20px;">
                                            <div style="font-size:12px; font-weight:700; color:#1d4ed8; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px;">Your One-Time Password (OTP)</div>
                                            <div style="font-size:36px; font-weight:800; color:#1e3a8a; letter-spacing:10px; font-family:'Courier New', Courier, monospace;">{otp_code}</div>
                                            <div style="font-size:12px; color:#64748b; margin-top:8px;">Valid for <strong>10 minutes</strong></div>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:4px; margin-bottom:24px;">
                                    <p style="margin:0; color:#92400e; font-size:13px; line-height:1.5;">
                                        <strong>Security Notice:</strong> Do not share this code with anyone. Quadrant IT team members will never ask for your password or verification code.
                                    </p>
                                </div>

                                <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                    If you did not initiate this request, you can safely disregard this email. Your current password will remain unchanged.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center;">
                                <p style="margin:0; color:#94a3b8; font-size:11px;">
                                    &copy; Quadrant IT Services. All rights reserved. &bull; Automated Security Dispatch
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

@router.post("/forgot-password/request-otp")
def request_password_reset_otp(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_identifier = (request.identifier or "").strip()
    if not clean_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email, username, or Employee ID is required."
        )

    # Lookup employee by username, email, ID, or name
    user = get_employee_by_username_or_email(db, clean_identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found matching the provided identifier."
        )

    if getattr(user, "status", "Active") != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is inactive. Please contact administrator."
        )

    user_email = (user.email or "").strip()
    if not user_email or "@" not in user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid registered email associated with this account. Please contact administrator."
        )

    # Generate cryptographically secure 6-digit numeric OTP
    otp = str(secrets.randbelow(900000) + 100000)
    expires_at = time.time() + 600  # 10 minutes

    with _otp_lock:
        _reset_otp_store[user.id] = {
            "otp": otp,
            "expires_at": expires_at,
            "attempts": 0,
            "email": user_email,
            "name": user.name
        }

    # Dispatch email via Microsoft Graph / SMTP (Outlook)
    subject = f"Quadrant IT Services - Password Reset Code: {otp}"
    body_html = _build_otp_email_html(user.name, otp)
    send_email_async(user_email, subject, body_html)

    masked = _mask_email(user_email)
    return {
        "success": True,
        "maskedEmail": masked,
        "message": f"Verification code sent to {masked}"
    }

@router.post("/forgot-password/verify-otp")
def verify_password_reset_otp(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    clean_identifier = (request.identifier or "").strip()
    clean_otp = (request.otp or "").strip()

    if not clean_identifier or not clean_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifier and OTP code are required."
        )

    user = get_employee_by_username_or_email(db, clean_identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )

    with _otp_lock:
        record = _reset_otp_store.get(user.id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active password reset request found. Please request a new code."
            )

        if time.time() > record["expires_at"]:
            _reset_otp_store.pop(user.id, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        record["attempts"] += 1
        if record["attempts"] > 5:
            _reset_otp_store.pop(user.id, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many invalid attempts. Please request a new verification code."
            )

        if record["otp"] != clean_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check and try again."
            )

    return {"success": True, "message": "Verification code verified successfully."}

@router.post("/forgot-password/reset")
def reset_password_with_otp(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    clean_identifier = (request.identifier or "").strip()
    clean_otp = (request.otp or "").strip()
    new_pass = request.new_password or ""

    if not clean_identifier or not clean_otp or not new_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All fields (identifier, OTP code, new password) are required."
        )

    user = get_employee_by_username_or_email(db, clean_identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )

    with _otp_lock:
        record = _reset_otp_store.get(user.id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active password reset request found. Please request a new code."
            )

        if time.time() > record["expires_at"]:
            _reset_otp_store.pop(user.id, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        if record["otp"] != clean_otp:
            record["attempts"] += 1
            if record["attempts"] > 5:
                _reset_otp_store.pop(user.id, None)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many invalid attempts. Please request a new verification code."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check and try again."
            )

        # Clear OTP once verified for reset
        _reset_otp_store.pop(user.id, None)

    # Validate password complexity (same policy across application)
    if len(new_pass) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r'[A-Z]', new_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]', new_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )

    change_employee_password(db, user.id, new_pass)
    log_activity(db, user.name, "Change Password", f"Password reset successfully via OTP for {user.name}")

    return {
        "success": True,
        "message": "Your password has been successfully reset. You can now sign in with your new password."
    }

# --- EMPLOYEE SIGN UP / REGISTRATION OTP SERVICES ---
_signup_otp_store = {}  # { email.lower(): { "otp": str, "expires_at": float, "attempts": int, "verified": bool } }

def _build_signup_otp_email_html(recipient_email: str, otp_code: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Registration OTP - Quadrant IT Services</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:30px 10px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
                        <!-- Header Bar -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding:28px 32px; text-align:left;">
                                <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.5px;">Quadrant IT Services</h1>
                                <p style="margin:4px 0 0 0; color:#bfdbfe; font-size:12px; font-weight:500;">Asset Management Portal &bull; Employee Registration Verification</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding:32px 32px 24px 32px;">
                                <h2 style="margin:0 0 12px 0; color:#0f172a; font-size:18px; font-weight:600;">Welcome to Quadrant IT Services</h2>
                                <p style="margin:0 0 16px 0; color:#475569; font-size:14px; line-height:1.6;">
                                    Hello <strong>{recipient_email}</strong>,
                                </p>
                                <p style="margin:0 0 24px 0; color:#475569; font-size:14px; line-height:1.6;">
                                    We received a request to create a new portal account for your work email. Please use the 6-digit verification code below to verify your email address and complete registration:
                                </p>
                                
                                <!-- OTP Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                                    <tr>
                                        <td align="center" style="background-color:#f0f7ff; border:2px dashed #93c5fd; border-radius:12px; padding:20px;">
                                            <div style="font-size:12px; font-weight:700; color:#1d4ed8; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px;">Your One-Time Password (OTP)</div>
                                            <div style="font-size:36px; font-weight:800; color:#1e3a8a; letter-spacing:10px; font-family:'Courier New', Courier, monospace;">{otp_code}</div>
                                            <div style="font-size:12px; color:#64748b; margin-top:8px;">Valid for <strong>10 minutes</strong></div>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:4px; margin-bottom:24px;">
                                    <p style="margin:0; color:#92400e; font-size:13px; line-height:1.5;">
                                        <strong>Security Notice:</strong> Never share this verification code with anyone. Quadrant IT team members will never request your verification code.
                                    </p>
                                </div>

                                <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                    If you did not initiate this account creation request, please report it to your IT administrator.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center;">
                                <p style="margin:0; color:#94a3b8; font-size:11px;">
                                    &copy; Quadrant IT Services. All rights reserved. &bull; Automated Security Dispatch
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

@router.get("/departments", response_model=List[str])
def get_registration_departments(db: Session = Depends(get_db)):
    """
    Fetch distinct active departments directly from the database for the sign-up form.
    """
    rows = db.execute(text("SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND TRIM(department) != '' ORDER BY department")).fetchall()
    db_depts = [r[0].strip() for r in rows if r[0] and r[0].strip()]
    standard_depts = ["IT", "HR", "Marketing", "Sales", "Finance"]
    # Merge standard departments with any additional departments created in DB
    merged = list(dict.fromkeys(standard_depts + db_depts))
    return merged

@router.post("/signup/request-otp")
def signup_request_otp(request: SignUpRequestOtp, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()

    # 1. Check if Email already exists
    email_exists = db.execute(text("SELECT id FROM employees WHERE LOWER(email) = LOWER(:email)"), {"email": clean_email}).first()
    if email_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{clean_email}' is already registered with an existing account. Please sign in or use Forgot Password."
        )

    # 2. Generate secure 6-digit numeric OTP
    otp = str(secrets.randbelow(900000) + 100000)
    expires_at = time.time() + 600  # 10 minutes

    with _otp_lock:
        _signup_otp_store[clean_email] = {
            "otp": otp,
            "expires_at": expires_at,
            "attempts": 0,
            "verified": False
        }

    # 3. Send Email via Microsoft Graph / Outlook
    subject = f"Quadrant IT Services - Registration OTP: {otp}"
    body_html = _build_signup_otp_email_html(clean_email, otp)
    send_email_async(clean_email, subject, body_html)

    masked = _mask_email(clean_email)
    return {
        "success": True,
        "maskedEmail": masked,
        "message": f"Verification code sent to {masked}"
    }

@router.post("/signup/verify-otp")
def signup_verify_otp(request: SignUpVerifyOtp):
    clean_email = request.email.strip().lower()
    clean_otp = (request.otp or "").strip()

    if not clean_email or not clean_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and OTP verification code are required."
        )

    with _otp_lock:
        record = _signup_otp_store.get(clean_email)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active registration request found for this email. Please request a new code."
            )

        if time.time() > record["expires_at"]:
            _signup_otp_store.pop(clean_email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        record["attempts"] += 1
        if record["attempts"] > 5:
            _signup_otp_store.pop(clean_email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many invalid attempts. Please request a new code."
            )

        if record["otp"] != clean_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check and try again."
            )

        record["verified"] = True

    return {
        "success": True,
        "message": "Email verified successfully. You can now complete your profile registration."
    }

@router.post("/signup", response_model=TokenResponse)
def signup_complete(request: EmployeeSignUpRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    clean_otp = (request.otp or "").strip()
    new_pass = request.password or ""

    # 1. Verify OTP matching in store
    with _otp_lock:
        record = _signup_otp_store.get(clean_email)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification session found. Please request and verify your OTP first."
            )

        if time.time() > record["expires_at"]:
            _signup_otp_store.pop(clean_email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        if record["otp"] != clean_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code."
            )

        # Clear verified signup OTP session
        _signup_otp_store.pop(clean_email, None)

    # 2. Validate password complexity
    if len(new_pass) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r'[A-Z]', new_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]', new_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )

    # 3. Resolve Employee ID (either user-provided or auto-derived from email)
    if request.id and request.id.strip():
        clean_emp_id = request.id.strip().upper()
        if get_employee_by_id(db, clean_emp_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee ID '{clean_emp_id}' is already taken. Please choose another ID."
            )
    else:
        email_prefix = clean_email.split('@')[0].upper().replace('.', '')
        candidate_id = f"Q{email_prefix[:10]}"
        clean_emp_id = candidate_id
        counter = 1
        while get_employee_by_id(db, clean_emp_id):
            clean_emp_id = f"{candidate_id[:8]}{counter}"
            counter += 1

    email_exists = db.execute(text("SELECT id FROM employees WHERE LOWER(email) = LOWER(:email)"), {"email": clean_email}).first()
    if email_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{clean_email}' is already in use."
        )

    # 4. Create Employee record
    emp_dept = (request.department or "Unassigned").strip()
    emp_desig = (request.designation or "Unassigned").strip()
    emp_dict = {
        "id": clean_emp_id,
        "name": request.name.strip(),
        "department": emp_dept,
        "designation": emp_desig,
        "email": clean_email,
        "phone": request.phone,
        "status": "Active",
        "role": "Employee",
        "location": request.location or "Hyderabad, India",
        "password": new_pass
    }

    created_emp = create_employee(db, emp_dict, request.name.strip())
    if not created_emp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve created employee record."
        )

    log_activity(db, request.name.strip(), "Employee Self-Registration", f"New employee registered: {request.name} ({clean_emp_id})")

    # 5. Issue JWT access token for automatic login
    access_token = create_access_token(data={"sub": clean_emp_id, "role": "Employee"})

    user_dict = {
        "id": getattr(created_emp, "id", clean_emp_id),
        "name": getattr(created_emp, "name", request.name.strip()),
        "email": getattr(created_emp, "email", clean_email),
        "username": getattr(created_emp, "username", clean_emp_id),
        "role": "Employee",
        "department": getattr(created_emp, "department", emp_dept),
        "designation": getattr(created_emp, "designation", emp_desig),
        "phone": getattr(created_emp, "phone", request.phone),
        "status": getattr(created_emp, "status", "Active"),
        "avatar": getattr(created_emp, "avatar", None),
        "location": getattr(created_emp, "location", request.location or "Hyderabad, India"),
        "joiningDate": getattr(created_emp, "joining_date", None)
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }



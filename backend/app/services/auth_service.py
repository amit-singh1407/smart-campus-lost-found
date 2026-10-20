import re
import secrets
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token

from app.utils.security import hash_password, verify_password, hash_otp, verify_otp
from app.utils.email_sender import send_verification_email
from app.services.audit_service import record_audit_log


def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number (0-9)."
    if not re.search(r"[^A-Za-z0-9]", password):
        return False, "Password must contain at least one special character."
    return True, ""


OTP_TTL_MINUTES = 15
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60

EMAIL_SEND_FAILED = {
    "error": "Unable to send the verification email right now. Please try again in a few minutes.",
    "status_code": 502,
}


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP string."""
    return "".join(secrets.choice("0123456789") for _ in range(length))


def _otp_expired(record: dict) -> bool:
    return datetime.now(timezone.utc) > datetime.fromisoformat(record["expires_at"])


def _cooldown_remaining(record: dict | None) -> int:
    """Seconds left before another OTP may be sent for this email (0 if allowed)."""
    if not record or not record.get("created_at"):
        return 0
    elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(record["created_at"])).total_seconds()
    return max(0, int(OTP_RESEND_COOLDOWN_SECONDS - elapsed))


def _store_otp(db, email: str, otp_code: str, for_reset: bool) -> None:
    """Persist only the OTP hash, replacing any previous code for this email."""
    now = datetime.now(timezone.utc)
    db.otp_verifications.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "otp_hash": hash_otp(otp_code),   # HMAC-SHA256 digest only
                "expires_at": (now + timedelta(minutes=OTP_TTL_MINUTES)).isoformat(),
                "attempts": 0,
                "for_reset": for_reset,
                "created_at": now.isoformat(),
            }
        },
        upsert=True,
    )


class AuthService:
    @staticmethod
    def register_user(data: dict):
        db = current_app.db
        email = data["email"].strip().lower()
        password = data.get("password", "")

        # Password strength validation on backend
        is_valid, err_msg = validate_password_strength(password)
        if not is_valid:
            return {"error": err_msg, "status_code": 400}

        # Check existing user email
        if db.users.find_one({"email": email}):
            return {"error": "An account with this campus email already exists.", "status_code": 409}

        # Send the OTP first; if the email is not accepted, abort before creating the account
        # (a leftover OTP record with no user is simply overwritten below)
        otp_code = generate_otp()
        if not send_verification_email(email, otp_code, data.get("name", "")):
            return EMAIL_SEND_FAILED

        # Argon2 hash password (after email succeeded)
        hashed = hash_password(password)

        student_id = (data.get("student_id") or "").strip()
        department = (data.get("department") or "").strip()
        phone = (data.get("phone") or "").strip()


        user_doc = {
            "name": (data.get("name") or "").strip(),
            "email": email,
            "password_hash": hashed,
            "student_id": student_id,
            "department": (data.get("department") or "").strip(),
            "phone": (data.get("phone") or "").strip(),
            "role": "USER",  # Strict default: normal registration is always USER
            "email_verified": False,
            "account_status": "pending",  # pending until email verified
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        # Insert user document *after* the email was successfully sent
        res = db.users.insert_one(user_doc)
        user_id = str(res.inserted_id)

        # Store OTP verification record — only the HASH is persisted, never plaintext
        _store_otp(db, email, otp_code, for_reset=False)

        record_audit_log("USER_REGISTER", user_id, email, "New campus user registration initiated")

        return {
            "message": "Registration successful. Please verify your email with the OTP sent.",
            "user_id": user_id,
            "email": email,
            "email_verified": False,
            "status_code": 201,
        }

    @staticmethod
    def verify_email(email: str, otp: str):
        db = current_app.db
        email = email.strip().lower()
        otp = otp.strip()

        record = db.otp_verifications.find_one({"email": email})
        # A password-reset code must not be usable to verify an email
        if not record or record.get("for_reset"):
            return {"error": "No pending verification found for this email.", "status_code": 400}

        if _otp_expired(record):
            return {"error": "Verification OTP has expired. Please request a new code.", "status_code": 400}

        # Check OTP attempt limit
        current_attempts = record.get("attempts", 0)
        if current_attempts >= OTP_MAX_ATTEMPTS:
            db.otp_verifications.delete_one({"email": email})
            return {"error": "Maximum verification attempts exceeded. Please request a new OTP code.", "status_code": 429}

        if not verify_otp(record.get("otp_hash", ""), otp):
            new_attempts = current_attempts + 1
            db.otp_verifications.update_one({"email": email}, {"$inc": {"attempts": 1}})
            remaining = max(0, OTP_MAX_ATTEMPTS - new_attempts)
            return {"error": f"Invalid verification code. {remaining} attempt(s) remaining.", "status_code": 400}

        # Successful verification -> activate account
        db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "email_verified": True,
                    "account_status": "active",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        db.otp_verifications.delete_one({"email": email})
        record_audit_log("EMAIL_VERIFIED", None, email, "Email address successfully verified")

        return {"message": "Email verified successfully! Your account is now active.", "status_code": 200}

    @staticmethod
    def resend_otp(email: str):
        db = current_app.db
        email = email.strip().lower()

        user = db.users.find_one({"email": email})
        if not user:
            return {"error": "No registered account found with this email.", "status_code": 404}

        if user.get("email_verified"):
            return {"error": "This email is already verified. Please sign in.", "status_code": 400}

        # Throttle resends so the free Resend quota can't be drained by repeated clicks
        wait = _cooldown_remaining(db.otp_verifications.find_one({"email": email}))
        if wait:
            return {"error": f"Please wait {wait} seconds before requesting a new code.", "status_code": 429}

        # Only replace the stored code once the new one was actually emailed
        otp_code = generate_otp()
        if not send_verification_email(email, otp_code, user.get("name", "")):
            return EMAIL_SEND_FAILED

        _store_otp(db, email, otp_code, for_reset=False)
        return {"message": "A fresh verification OTP has been sent.", "status_code": 200}

    @staticmethod
    def authenticate_user(email: str, password: str, required_role: str = None):
        db = current_app.db
        email = email.strip().lower()

        user = db.users.find_one({"email": email})
        if not user:
            return {"error": "Invalid email or password.", "status_code": 401}

        # Check Argon2 password
        if not verify_password(user["password_hash"], password):
            return {"error": "Invalid email or password.", "status_code": 401}

        # Check Email Verification
        if not user.get("email_verified", False):
            # If their earlier code is gone or expired, email a fresh one so the verify page is usable
            record = db.otp_verifications.find_one({"email": email})
            if not record or record.get("for_reset") or _otp_expired(record):
                AuthService.resend_otp(email)
            return {
                "error": "Your campus email has not been verified yet. Please enter the OTP sent to your email.",
                "email_unverified": True,
                "email": email,
                "status_code": 403,
            }

        # Check Account Status
        if user.get("account_status") == "suspended":
            return {"error": "This campus account has been suspended by administration.", "status_code": 403}

        # Role enforcement if requested (e.g. for /admin/login)
        user_role = user.get("role", "USER")
        if required_role == "ADMIN" and user_role not in ["ADMIN", "SUPER_ADMIN"]:
            return {"error": "Access Denied: Administrative role clearance required.", "status_code": 403}

        # Generate JWT Token with claims
        user_id = str(user["_id"])
        token_claims = {
            "id": user_id,
            "email": user["email"],
            "role": user_role,
            "name": user.get("name", ""),
        }

        access_token = create_access_token(
            identity=user_id,
            additional_claims=token_claims,
        )
        refresh_token = create_refresh_token(
            identity=user_id,
            additional_claims=token_claims,
        )

        record_audit_log(
            "USER_LOGIN" if user_role == "USER" else "ADMIN_LOGIN",
            user_id,
            email,
            f"Successful login for role: {user_role}",
        )

        user_clean = {
            "id": user_id,
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user_role,
            "student_id": user.get("student_id"),
            "department": user.get("department"),
            "phone": user.get("phone"),
            "email_verified": user.get("email_verified"),
            "account_status": user.get("account_status"),
        }

        return {
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_clean,
            "status_code": 200,
        }

    @staticmethod
    def authenticate_admin(email: str, password: str):
        db = current_app.db
        email = email.strip().lower()
        admin = db.admin_credentials.find_one({"email": email})

        if not admin or not verify_password(admin.get("password_hash", ""), password):
            return {"error": "Invalid email or password.", "status_code": 401}

        if not admin.get("is_active", admin.get("account_status") == "active"):
            return {"error": "This administrator account is not active.", "status_code": 403}

        role = admin.get("role")
        if role not in ["ADMIN", "SUPER_ADMIN"]:
            return {"error": "Access Denied: Administrative role clearance required.", "status_code": 403}

        admin_id = str(admin["admin_id"])
        token_claims = {
            "id": admin_id,
            "admin_id": admin_id,
            "email": admin["email"],
            "role": role,
            "name": admin.get("name", ""),
            "auth_source": "admin_credentials",
        }
        access_token = create_access_token(identity=admin_id, additional_claims=token_claims)
        refresh_token = create_refresh_token(identity=admin_id, additional_claims=token_claims)

        record_audit_log(
            "ADMIN_LOGIN",
            admin_id,
            email,
            f"Successful admin login for role: {role}",
        )

        return {
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": admin_id,
                "admin_id": admin_id,
                "name": admin.get("name"),
                "email": admin.get("email"),
                "role": role,
                "department": admin.get("department"),
                "phone": admin.get("phone"),
                "email_verified": True,
                "account_status": admin.get("account_status"),
                "is_active": admin.get("is_active", False),
            },
            "status_code": 200,
        }

    @staticmethod
    def forgot_password_otp(email: str):
        db = current_app.db
        email = email.strip().lower()
        user = db.users.find_one({"email": email})
        if not user:
            return {"message": "If an account exists, a reset code was sent.", "status_code": 200}

        wait = _cooldown_remaining(db.otp_verifications.find_one({"email": email}))
        if wait:
            return {"error": f"Please wait {wait} seconds before requesting a new code.", "status_code": 429}

        otp_code = generate_otp()
        if not send_verification_email(email, otp_code, user.get("name", ""), purpose="reset"):
            return EMAIL_SEND_FAILED

        _store_otp(db, email, otp_code, for_reset=True)
        return {"message": "Password reset OTP sent to your campus email.", "status_code": 200}

    @staticmethod
    def reset_password_with_otp(email: str, otp: str, new_password: str):
        db = current_app.db
        email = email.strip().lower()
        # Fetch the record by email only, then verify OTP hash — never query by raw OTP
        record = db.otp_verifications.find_one({"email": email})
        # Only a code issued by forgot-password may reset a password
        if not record or not record.get("for_reset") or _otp_expired(record):
            return {"error": "Invalid or expired reset code. Please request a new one.", "status_code": 400}

        current_attempts = record.get("attempts", 0)
        if current_attempts >= OTP_MAX_ATTEMPTS:
            db.otp_verifications.delete_one({"email": email})
            return {"error": "Maximum attempts exceeded. Please request a new reset code.", "status_code": 429}

        if not verify_otp(record.get("otp_hash", ""), otp.strip()):
            db.otp_verifications.update_one({"email": email}, {"$inc": {"attempts": 1}})
            remaining = max(0, OTP_MAX_ATTEMPTS - current_attempts - 1)
            return {"error": f"Invalid reset code. {remaining} attempt(s) remaining.", "status_code": 400}

        hashed = hash_password(new_password)
        db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "password_hash": hashed,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        db.otp_verifications.delete_one({"email": email})
        record_audit_log("PASSWORD_RESET", None, email, "Password successfully reset via OTP")
        return {"message": "Password reset successfully. You can now log in.", "status_code": 200}

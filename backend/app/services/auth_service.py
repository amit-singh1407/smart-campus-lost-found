import re
import random
import string
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token

from app.utils.security import hash_password, verify_password
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


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP string."""
    return "".join(random.choices(string.digits, k=length))


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

        # Check for a pending OTP verification (previous attempt didn't complete)
        if db.otp_verifications.find_one({"email": email}):
            return {"error": "A verification OTP was already sent to this email. Please check your inbox or request a new OTP.", "status_code": 409}

        # Generate OTP first
        otp_code = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # Attempt to send verification email; if it fails, abort registration
        try:
            send_verification_email(email, otp_code, data.get("name", ""))
        except Exception as e:
            current_app.logger.error(f"Failed to send verification email to {email}: {e}")
            return {"error": "Unable to send verification email. Please try again later.", "status_code": 500}

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

        # Insert user document *after* email was successfully sent and OTP stored
        res = db.users.insert_one(user_doc)
        user_id = str(res.inserted_id)

        # Store OTP verification record (already generated above)
        db.otp_verifications.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "otp": otp_code,
                    "expires_at": expires_at.isoformat(),
                    "attempts": 0,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            },
            upsert=True,
        )

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
        if not record:
            return {"error": "No pending verification found for this email.", "status_code": 400}

        # Check expiration
        exp_dt = datetime.fromisoformat(record["expires_at"])
        if datetime.now(timezone.utc) > exp_dt:
            return {"error": "Verification OTP has expired. Please request a new code.", "status_code": 400}

        # Check OTP attempt limit (max 5 attempts)
        current_attempts = record.get("attempts", 0)
        if current_attempts >= 5:
            db.otp_verifications.delete_one({"email": email})
            return {"error": "Maximum verification attempts exceeded. Please request a new OTP code.", "status_code": 429}

        if record.get("otp") != otp:
            new_attempts = current_attempts + 1
            db.otp_verifications.update_one({"email": email}, {"$inc": {"attempts": 1}})
            remaining = max(0, 5 - new_attempts)
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

        otp_code = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        db.otp_verifications.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "otp": otp_code,
                    "expires_at": expires_at.isoformat(),
                    "attempts": 0,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            },
            upsert=True,
        )

        send_verification_email(email, otp_code, user.get("name", ""))
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
    def forgot_password_otp(email: str):
        db = current_app.db
        email = email.strip().lower()
        user = db.users.find_one({"email": email})
        if not user:
            return {"message": "If an account exists, a reset code was sent.", "status_code": 200}

        otp_code = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.otp_verifications.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "otp": otp_code,
                    "expires_at": expires_at.isoformat(),
                    "for_reset": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            },
            upsert=True,
        )
        send_verification_email(email, otp_code, user.get("name", ""))
        return {"message": "Password reset OTP sent to your campus email.", "status_code": 200}

    @staticmethod
    def reset_password_with_otp(email: str, otp: str, new_password: str):
        db = current_app.db
        email = email.strip().lower()
        record = db.otp_verifications.find_one({"email": email, "otp": otp.strip()})
        if not record:
            return {"error": "Invalid or expired reset code.", "status_code": 400}

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

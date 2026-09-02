from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity, create_access_token
from pydantic import ValidationError
from app.models.schemas import (
    UserRegisterSchema,
    UserLoginSchema,
    VerifyEmailSchema,
    ResendOtpSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
)
from app.services.auth_service import AuthService
from app.middleware.auth import jwt_required_custom
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    try:
        data = request.get_json() or {}
        validated = UserRegisterSchema(**data)
        result = AuthService.register_user(validated.model_dump())
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid input format", "errors": err.errors()}), 422
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500


@auth_bp.post("/verify-email")
def verify_email():
    try:
        data = request.get_json() or {}
        validated = VerifyEmailSchema(**data)
        result = AuthService.verify_email(validated.email, validated.otp)
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid verification data", "errors": err.errors()}), 422
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500


@auth_bp.post("/resend-otp")
def resend_otp():
    try:
        data = request.get_json() or {}
        validated = ResendOtpSchema(**data)
        result = AuthService.resend_otp(validated.email)
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid email address", "errors": err.errors()}), 422


@auth_bp.post("/login")
def login():
    try:
        data = request.get_json() or {}
        validated = UserLoginSchema(**data)
        result = AuthService.authenticate_user(validated.email, validated.password)
        if "error" in result:
            resp = {"message": result["error"]}
            if result.get("email_unverified"):
                resp["email_unverified"] = True
                resp["email"] = result.get("email")
            return jsonify(resp), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid login payload", "errors": err.errors()}), 422
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500


@auth_bp.get("/me")
@jwt_required_custom
def get_me():
    from flask import current_app
    from bson import ObjectId

    db = current_app.db
    user = db.users.find_one({"_id": ObjectId(g.user_id)})
    if not user:
        return jsonify({"message": "User not found"}), 404

    user_data = {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role", "USER"),
        "student_id": user.get("student_id"),
        "department": user.get("department"),
        "phone": user.get("phone"),
        "email_verified": user.get("email_verified"),
        "account_status": user.get("account_status"),
    }
    return jsonify({"user": user_data}), 200


@auth_bp.post("/forgot-password")
def forgot_password():
    try:
        data = request.get_json() or {}
        validated = ForgotPasswordSchema(**data)
        result = AuthService.forgot_password_otp(validated.email)
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid input", "errors": err.errors()}), 422


@auth_bp.post("/reset-password")
def reset_password():
    try:
        data = request.get_json() or {}
        validated = ResetPasswordSchema(**data)
        result = AuthService.reset_password_with_otp(validated.email, validated.otp, validated.new_password)
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid reset payload", "errors": err.errors()}), 422


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh_token():
    user_id = get_jwt_identity()
    claims = get_jwt()
    new_access_token = create_access_token(
        identity=user_id,
        additional_claims={
            "id": user_id,
            "email": claims.get("email"),
            "role": claims.get("role", "USER"),
            "name": claims.get("name", ""),
        },
    )
    return jsonify({"access_token": new_access_token}), 200


@auth_bp.post("/logout")
def logout():
    return jsonify({"message": "Successfully logged out"}), 200


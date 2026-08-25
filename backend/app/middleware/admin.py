from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity


def admin_required(fn):
    """Decorator ensuring that caller holds ADMIN or SUPER_ADMIN role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role", "USER")
            if role not in ["ADMIN", "SUPER_ADMIN"]:
                return jsonify({"message": "Forbidden: Administrative access required"}), 403

            g.user_id = get_jwt_identity()
            g.user_email = claims.get("email")
            g.user_role = role
            g.user_name = claims.get("name", "")
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Authentication required", "error": str(e)}), 401
    return wrapper


def super_admin_required(fn):
    """Decorator ensuring that caller holds SUPER_ADMIN role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role", "USER")
            if role != "SUPER_ADMIN":
                return jsonify({"message": "Forbidden: Super Administrator access required"}), 403

            g.user_id = get_jwt_identity()
            g.user_email = claims.get("email")
            g.user_role = role
            g.user_name = claims.get("name", "")
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Authentication required", "error": str(e)}), 401
    return wrapper

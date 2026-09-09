from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity


def jwt_required_custom(fn):
    """Custom JWT requirement decorator injecting current user payload into Flask context."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            g.user_id = get_jwt_identity()
            g.user_email = claims.get("email")
            g.user_role = claims.get("role", "USER")
            g.user_name = claims.get("name", "")
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Authentication required or token expired", "error": str(e)}), 401
    return wrapper


def jwt_optional_custom(fn):
    """Optional JWT decorator that sets user context if token is present, without failing if absent."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity:
                claims = get_jwt()
                g.user_id = identity
                g.user_email = claims.get("email")
                g.user_role = claims.get("role", "USER")
                g.user_name = claims.get("name", "")
            else:
                g.user_id = None
                g.user_email = None
                g.user_role = None
                g.user_name = None
        except Exception:
            g.user_id = None
            g.user_email = None
            g.user_role = None
            g.user_name = None
        return fn(*args, **kwargs)
    return wrapper


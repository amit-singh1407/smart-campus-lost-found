from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
import os

from app.config import Config
from app.middleware.security_headers import register_security_headers

load_dotenv()


class CampusFlask(Flask):
    db: Database


def create_app() -> CampusFlask:
    """Create and configure the Flask application."""
    app = CampusFlask(__name__)
    app.config.from_object(Config)

    # --------------------------------------------------
    # Security Headers
    # --------------------------------------------------
    register_security_headers(app)

    # --------------------------------------------------
    # CORS Configuration
    # --------------------------------------------------
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config.get("CORS_ORIGINS", "*")
            }
        },
        supports_credentials=True,
    )

    # --------------------------------------------------
    # JWT Configuration
    # --------------------------------------------------
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "The token has expired", "error": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"message": "Signature verification failed", "error": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"message": "Request does not contain an access token", "error": "authorization_required"}), 401

    # --------------------------------------------------
    # Rate Limiting
    # --------------------------------------------------
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[app.config.get("RATE_LIMIT_DEFAULT", "500/day")],
        storage_uri=app.config.get("REDIS_URL", "memory://"),
        app=app,
    )

    # --------------------------------------------------
    # MongoDB Connection
    # --------------------------------------------------
    client = MongoClient(
        app.config["MONGODB_URI"],
        serverSelectionTimeoutMS=5000,
    )
    app.db = client[app.config["MONGODB_DATABASE"]]

    # Ensure Indexes on MongoDB Collections
    try:
        app.db.users.create_index("email", unique=True)
        app.db.users.create_index(
            [("student_id", 1)],
            unique=True,
            partialFilterExpression={"student_id": {"$gt": ""}},
        )
        app.db.otp_verifications.create_index("email", unique=True)
        app.db.items.create_index([("title", "text"), ("description", "text"), ("location", "text"), ("brand", "text"), ("color", "text")])
        app.db.items.create_index("created_at")
        app.db.items.create_index("user_id")
        app.db.items.create_index("handover_token_hash", sparse=True)
        app.db.items.create_index("storage_id", unique=True, sparse=True)
        app.db.claims.create_index("user_id")
        app.db.claims.create_index("item_id")
        app.db.matches.create_index([("lost_item_id", 1), ("found_item_id", 1)], unique=True)
        app.db.notifications.create_index("user_id")
        app.db.watchlists.create_index([("user_id", 1), ("lost_item_id", 1)], unique=True)
        app.db.audit_logs.create_index("created_at")
    except Exception as e:
        print(f"MongoDB index initialization note: {e}")

    # --------------------------------------------------
    # Register Route Blueprints
    # --------------------------------------------------
    from app.routes.auth_routes import auth_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.item_routes import item_bp
    from app.routes.claim_routes import claim_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.user_routes import user_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.watchlist_routes import watchlist_bp
    from app.routes.assistant_routes import assistant_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api/v1/dashboard")
    app.register_blueprint(item_bp, url_prefix="/api/v1/items")
    app.register_blueprint(claim_bp, url_prefix="/api/v1/claims")
    app.register_blueprint(notification_bp, url_prefix="/api/v1/notifications")
    app.register_blueprint(user_bp, url_prefix="/api/v1/users")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")
    app.register_blueprint(watchlist_bp, url_prefix="/api/v1/watchlists")
    app.register_blueprint(assistant_bp, url_prefix="/api/v1/assistant")


    # --------------------------------------------------
    # Health Check
    # --------------------------------------------------
    @app.get("/health")
    def health_check():
        return {
            "status": "ok",
            "database": "connected",
            "message": "Smart Campus Lost & Found API is operational."
        }

    return app
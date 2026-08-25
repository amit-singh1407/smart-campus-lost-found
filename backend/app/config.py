import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Central Flask and database settings."""

    SECRET_KEY = os.getenv("SECRET_KEY", "smart-campus-super-secret-key-2026")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "smart_campus")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "smart-campus-jwt-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_SAMESITE = "Lax"

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))
    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "500/day")
    REDIS_URL = os.getenv("REDIS_URL", "memory://")

    # Cloudinary image storage (optional)
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

    # Mail / SMTP settings
    EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
    EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    DEBUG = os.getenv("DEBUG", "True").lower() == "true"

import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

# Add current folder to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.security import hash_password

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))


def seed_admin_user(email=None, password=None, name="Campus Security Admin"):
    uri = os.getenv("MONGODB_URI", "").strip()
    if not uri:
        raise RuntimeError(
            "MONGODB_URI is required. Copy the MongoDB Atlas Python driver URI into backend/.env."
        )
    database_names = ("smart_campus", "smart_campus_lost_found")
    email = (email or os.getenv("ADMIN_EMAIL", "admin@campus.edu")).strip().lower()
    admin_id = os.getenv("ADMIN_ID", "ADMIN001").strip()
    password = password or os.getenv("ADMIN_PASSWORD", "").strip()

    if not admin_id:
        raise RuntimeError("ADMIN_ID must not be empty in backend/.env.")
    if not password:
        raise RuntimeError(
            "ADMIN_PASSWORD is required. Set it in backend/.env before running seed_admin.py."
        )

    hashed = hash_password(password)
    now = datetime.now(timezone.utc).isoformat()
    admin_doc = {
        "admin_id": admin_id,
        "name": name,
        "email": email,
        "password_hash": hashed,
        "department": "Campus Security & Safety",
        "phone": "+1 (555) 999-4400",
        "role": "SUPER_ADMIN",
        "is_active": True,
        "email_verified": True,
        "account_status": "active",
        "updated_at": now,
    }

    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    for database_name in database_names:
        db = client[database_name]
        db.admin_credentials.create_index("email", unique=True)
        db.admin_credentials.create_index("admin_id", unique=True)
        db.admin_credentials.create_index("role")
        db.admin_credentials.create_index("is_active")
        credential_doc = {**admin_doc, "updated_at": now}
        db.admin_credentials.update_one(
            {"email": email},
            {"$set": credential_doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        print(f"[OK] {database_name}: admin_credentials synchronized")

    print("\nAdmin credentials:")
    print(f"  Email:    {email}")
    print("  Password: value configured in ADMIN_PASSWORD")
    print("  Databases: smart_campus, smart_campus_lost_found\n")


if __name__ == "__main__":
    seed_admin_user()

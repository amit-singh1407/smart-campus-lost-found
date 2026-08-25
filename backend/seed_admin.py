import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

# Add current folder to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.security import hash_password

load_dotenv()


def seed_admin_user(email="admin@campus.edu", password="AdminPassword123!", name="Campus Security Admin"):
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DATABASE", "smart_campus")

    client = MongoClient(uri)
    db = client[db_name]

    existing = db.users.find_one({"email": email})
    hashed = hash_password(password)

    admin_doc = {
        "name": name,
        "email": email.lower(),
        "password_hash": hashed,
        "student_id": "STAFF-001",
        "department": "Campus Security & Safety",
        "phone": "+1 (555) 999-4400",
        "role": "SUPER_ADMIN",
        "email_verified": True,
        "account_status": "active",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if existing:
        db.users.update_one({"email": email.lower()}, {"$set": admin_doc})
        print(f"[OK] Existing Admin account updated: {email}")
    else:
        admin_doc["created_at"] = datetime.now(timezone.utc).isoformat()
        db.users.insert_one(admin_doc)
        print(f"[OK] New SUPER_ADMIN account seeded: {email}")

    print(f"\nDefault Admin Credentials:")
    print(f"  Email:    {email}")
    print(f"  Password: {password}\n")


if __name__ == "__main__":
    seed_admin_user()

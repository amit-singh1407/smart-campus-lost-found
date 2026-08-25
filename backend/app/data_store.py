from datetime import datetime
from itertools import count


_item_ids = count(4)
_user_ids = count(2)

users = [
    {
        "_id": "u1",
        "name": "Admin User",
        "email": "admin@campus.edu",
        "student_id": "ADMIN-001",
        "phone": "0000000000",
        "password_hash": None,
        "role": "ADMIN",
        "email_verified": True,
        "account_status": "ACTIVE",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
]

items = [
    {
        "_id": "1",
        "item_name": "Black Water Bottle",
        "category": "Accessories",
        "brand": "Milton",
        "color": "Black",
        "description": "Found near the reading area.",
        "location": "Library",
        "lost_date": "2026-08-20",
        "status": "ACTIVE",
        "type": "found",
        "owner_email": "admin@campus.edu",
        "created_at": datetime.utcnow(),
    },
    {
        "_id": "2",
        "item_name": "HP Laptop",
        "category": "Electronics",
        "brand": "HP",
        "color": "Silver",
        "description": "Laptop found in Computer Lab.",
        "location": "Computer Lab",
        "lost_date": "2026-08-21",
        "status": "ACTIVE",
        "type": "found",
        "owner_email": "admin@campus.edu",
        "created_at": datetime.utcnow(),
    },
    {
        "_id": "3",
        "item_name": "Black Laptop",
        "category": "Electronics",
        "brand": "HP",
        "color": "Black",
        "description": "Lost laptop with stickers on the lid.",
        "location": "Library",
        "lost_date": "2026-08-22",
        "status": "ACTIVE",
        "type": "lost",
        "owner_email": "student@campus.edu",
        "created_at": datetime.utcnow(),
    },
]

claims = [
    {
        "_id": "c1",
        "item_name": "HP Laptop",
        "claimant": "student@campus.edu",
        "status": "PENDING",
        "evidence": "Serial number and charger description provided.",
    }
]


def public_item(item):
    return {
        "_id": item["_id"],
        "item_name": item["item_name"],
        "category": item.get("category") or "Uncategorized",
        "brand": item.get("brand") or "",
        "color": item.get("color") or "",
        "description": item.get("description") or "",
        "location": item.get("location") or "Campus",
        "lost_date": item.get("lost_date") or "",
        "status": item.get("status", "ACTIVE"),
        "type": item.get("type", "lost"),
        "created_at": item.get("created_at", datetime.utcnow()).isoformat(),
    }


def next_item_id():
    return str(next(_item_ids))


def next_user_id():
    return f"u{next(_user_ids)}"

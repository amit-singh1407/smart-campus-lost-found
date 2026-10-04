from flask import Blueprint, jsonify, g, current_app
from bson import ObjectId
from app.middleware.auth import jwt_required_custom

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("")
@jwt_required_custom
def get_user_dashboard():
    """
    Unified User Dashboard endpoint returning real MongoDB aggregated data.
    Includes lost items, found items, smart matches, claims, notifications, and live counts.
    """
    db = current_app.db
    user_id = str(g.user_id)

    # 1. Fetch user's lost reports
    lost_cursor = db.items.find({"user_id": user_id, "type": "lost"}).sort("created_at", -1)
    my_lost_items = []
    lost_item_ids = []
    for doc in lost_cursor:
        doc["_id"] = str(doc["_id"])
        my_lost_items.append(doc)
        lost_item_ids.append(doc["_id"])

    # 2. Fetch user's found submissions
    found_cursor = db.items.find({"user_id": user_id, "type": "found"}).sort("created_at", -1)
    my_found_items = []
    for doc in found_cursor:
        doc["_id"] = str(doc["_id"])
        my_found_items.append(doc)

    # 3. Fetch smart matches for user's lost items
    possible_matches = []
    if lost_item_ids:
        match_cursor = db.matches.find(
            {"lost_item_id": {"$in": lost_item_ids}}
        ).sort("similarity_score", -1).limit(20)

        for match in match_cursor:
            lost_item = db.items.find_one({"_id": ObjectId(match["lost_item_id"])})
            found_item = db.items.find_one({"_id": ObjectId(match["found_item_id"])})

            if lost_item and found_item:
                lost_item["_id"] = str(lost_item["_id"])
                found_item["_id"] = str(found_item["_id"])
                possible_matches.append({
                    "id": str(match["_id"]),
                    "similarity_score": match.get("similarity_score", 80),
                    "match_tier": match.get("match_tier", "possible"),
                    "lost_item": lost_item,
                    "found_item": found_item,
                    "created_at": match.get("created_at"),
                })

    # 4. Fetch user's claims
    claim_cursor = db.claims.find({"user_id": user_id}).sort("created_at", -1)
    my_claims = []
    for doc in claim_cursor:
        doc["_id"] = str(doc["_id"])
        my_claims.append(doc)

    # 5. Fetch user's recent notifications
    notif_cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(10)
    notifications = []
    for doc in notif_cursor:
        doc["_id"] = str(doc["_id"])
        notifications.append(doc)

    # Live calculated metrics
    unread_notifs = db.notifications.count_documents({"user_id": user_id, "read": False})
    pending_claims_count = sum(1 for c in my_claims if c.get("status") in ("pending", "UNDER_REVIEW"))

    return jsonify({
        "stats": {
            "my_lost_count": len(my_lost_items),
            "my_found_count": len(my_found_items),
            "matches_count": len(possible_matches),
            "pending_claims_count": pending_claims_count,
            "unread_notifications_count": unread_notifs,
        },
        "my_lost_items": my_lost_items,
        "my_found_items": my_found_items,
        "possible_matches": possible_matches,
        "claims": my_claims,
        "notifications": notifications,
        "user": {
            "id": user_id,
            "name": g.user_name,
            "email": g.user_email,
            "role": g.user_role,
        },
    }), 200

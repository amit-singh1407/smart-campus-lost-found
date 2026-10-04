from flask import Blueprint, jsonify, g, current_app
from bson import ObjectId
from app.middleware.auth import jwt_required_custom

notification_bp = Blueprint("notifications", __name__)


@notification_bp.get("")
@jwt_required_custom
def get_notifications():
    db = current_app.db
    cursor = db.notifications.find({
        "$or": [
            {"user_id": g.user_id},
            {"target_type": "ALL_ACTIVE_STUDENTS"},
        ]
    }).sort("created_at", -1).limit(50)
    notifs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if doc.get("target_type") == "ALL_ACTIVE_STUDENTS":
            doc["read"] = g.user_id in doc.get("read_by", [])
        notifs.append(doc)
    return jsonify({"notifications": notifs}), 200


@notification_bp.patch("/<notif_id>/read")
@notification_bp.post("/<notif_id>/read")
@jwt_required_custom
def mark_read(notif_id):
    db = current_app.db
    try:
        notification = db.notifications.find_one({"_id": ObjectId(notif_id)})
        if not notification:
            return jsonify({"message": "Notification not found"}), 404

        if notification.get("target_type") == "ALL_ACTIVE_STUDENTS":
            db.notifications.update_one(
                {"_id": notification["_id"]},
                {"$addToSet": {"read_by": g.user_id}},
            )
        else:
            db.notifications.update_one(
                {"_id": notification["_id"], "user_id": g.user_id},
                {"$set": {"read": True}},
            )
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception:
        return jsonify({"message": "Invalid ID format"}), 400


@notification_bp.post("/read-all")
@notification_bp.patch("/read-all")
@jwt_required_custom
def mark_all_read():
    db = current_app.db
    # Mark personal notifications as read
    db.notifications.update_many(
        {"user_id": g.user_id, "read": False},
        {"$set": {"read": True}},
    )
    # Add user to read_by on campus notifications
    db.notifications.update_many(
        {"target_type": "ALL_ACTIVE_STUDENTS"},
        {"$addToSet": {"read_by": g.user_id}},
    )
    return jsonify({"message": "All notifications marked as read"}), 200

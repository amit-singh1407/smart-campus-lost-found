from flask import Blueprint, jsonify, g, current_app
from bson import ObjectId
from app.middleware.auth import jwt_required_custom

notification_bp = Blueprint("notifications", __name__)


@notification_bp.get("")
@jwt_required_custom
def get_notifications():
    db = current_app.db
    cursor = db.notifications.find({"user_id": g.user_id}).sort("created_at", -1).limit(50)
    notifs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        notifs.append(doc)
    return jsonify({"notifications": notifs}), 200


@notification_bp.patch("/<notif_id>/read")
@jwt_required_custom
def mark_read(notif_id):
    db = current_app.db
    try:
        db.notifications.update_one(
            {"_id": ObjectId(notif_id), "user_id": g.user_id},
            {"$set": {"read": True}},
        )
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        return jsonify({"message": "Invalid ID format"}), 400

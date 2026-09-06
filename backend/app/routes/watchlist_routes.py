from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, request, current_app
from bson import ObjectId

from app.middleware.auth import jwt_required_custom

watchlist_bp = Blueprint("watchlists", __name__)


@watchlist_bp.post("")
@jwt_required_custom
def create_watchlist():
    data = request.get_json() or {}
    lost_item_id = str(data.get("lost_item_id", "")).strip()
    if not lost_item_id:
        return jsonify({"message": "lost_item_id is required"}), 422

    db = current_app.db
    try:
        lost_item = db.items.find_one({"_id": ObjectId(lost_item_id), "type": "lost", "user_id": str(g.user_id)})
    except Exception:
        lost_item = None
    if not lost_item:
        return jsonify({"message": "Lost report not found"}), 404

    watchlist = {
        "user_id": str(g.user_id),
        "lost_item_id": lost_item_id,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = db.watchlists.update_one(
        {"user_id": str(g.user_id), "lost_item_id": lost_item_id},
        {"$set": watchlist},
        upsert=True,
    )
    watchlist["_id"] = str(result.upserted_id or db.watchlists.find_one(
        {"user_id": str(g.user_id), "lost_item_id": lost_item_id}
    )["_id"])
    return jsonify({"message": "Smart Watch enabled", "watchlist": watchlist}), 201


@watchlist_bp.delete("/<watchlist_id>")
@jwt_required_custom
def delete_watchlist(watchlist_id):
    try:
        result = current_app.db.watchlists.delete_one({"_id": ObjectId(watchlist_id), "user_id": str(g.user_id)})
    except Exception:
        return jsonify({"message": "Invalid watchlist ID"}), 400
    if result.deleted_count == 0:
        return jsonify({"message": "Watchlist not found"}), 404
    return jsonify({"message": "Smart Watch disabled"}), 200
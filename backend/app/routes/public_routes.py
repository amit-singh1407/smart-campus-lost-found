from flask import Blueprint, jsonify

from app.data_store import items, public_item, users

public_bp = Blueprint("public", __name__)


@public_bp.get("/statistics")
def public_statistics():
    """Public portal statistics for the landing page.

    These values must be backed by database aggregation in production and not
    hardcoded in the frontend.
    """
    resolved_items = len([item for item in items if item.get("status") == "RETURNED"])
    return jsonify({
        "success": True,
        "message": "Public statistics loaded.",
        "data": {
            "total_reports": len(items),
            "lost_reports": len([item for item in items if item["type"] == "lost"]),
            "found_reports": len([item for item in items if item["type"] == "found"]),
            "resolved_items": resolved_items,
            "campus_users": len(users),
        }
    })


@public_bp.get("/items/recent")
def recent_items():
    """Return recently reported found items for the landing page."""
    recent_found = [item for item in reversed(items) if item["type"] == "found"][:3]
    return jsonify({"success": True, "message": "Recent items loaded.", "data": {"items": [public_item(item) for item in recent_found]}})

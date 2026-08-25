from flask import Blueprint, request, jsonify, g, current_app
from bson import ObjectId
from app.middleware.auth import jwt_required_custom

user_bp = Blueprint("users", __name__)


@user_bp.put("/profile")
@jwt_required_custom
def update_profile():
    db = current_app.db
    data = request.get_json() or {}

    updates = {}
    if "name" in data and data["name"].strip():
        updates["name"] = data["name"].strip()
    if "student_id" in data:
        updates["student_id"] = data["student_id"].strip()
    if "department" in data:
        updates["department"] = data["department"].strip()
    if "phone" in data:
        updates["phone"] = data["phone"].strip()

    if updates:
        db.users.update_one({"_id": ObjectId(g.user_id)}, {"$set": updates})

    user = db.users.find_one({"_id": ObjectId(g.user_id)})
    if not user:
        return jsonify({"message": "User not found"}), 404

    user_data = {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role", "USER"),
        "student_id": user.get("student_id"),
        "department": user.get("department"),
        "phone": user.get("phone"),
        "email_verified": user.get("email_verified"),
        "account_status": user.get("account_status"),
    }
    return jsonify({"message": "Profile updated", "user": user_data}), 200

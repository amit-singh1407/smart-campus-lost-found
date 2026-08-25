from flask import Blueprint, request, jsonify, g, current_app
from bson import ObjectId
from pydantic import ValidationError
from app.models.schemas import UserLoginSchema, ClaimResolveSchema
from app.services.auth_service import AuthService
from app.services.claim_service import ClaimService
from app.services.audit_service import record_audit_log
from app.middleware.admin import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.post("/login")
def admin_login():
    """Admin portal login endpoint requiring ADMIN or SUPER_ADMIN role."""
    try:
        data = request.get_json() or {}
        validated = UserLoginSchema(**data)
        result = AuthService.authenticate_user(validated.email, validated.password, required_role="ADMIN")
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid login data", "errors": err.errors()}), 422


@admin_bp.get("/dashboard")
@admin_bp.get("/stats")
@admin_required
def get_admin_dashboard_stats():
    """
    Real MongoDB aggregation statistics for the Admin Dashboard:
    - Total Users, Lost Items, Found Items, Pending Claims, Approved Claims, Returned Items
    - Category breakdown, Location hotspots, Resolution percentage
    """
    db = current_app.db

    total_users = db.users.count_documents({})
    total_items = db.items.count_documents({})
    lost_items_count = db.items.count_documents({"type": "lost"})
    found_items_count = db.items.count_documents({"type": "found"})
    pending_claims_count = db.claims.count_documents({"status": "pending"})
    approved_claims_count = db.claims.count_documents({"status": "approved"})
    returned_items_count = db.items.count_documents({"status": "resolved"})

    # Categories Aggregation
    categories_agg = list(
        db.items.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ])
    )
    categories = {doc["_id"] or "Others": doc["count"] for doc in categories_agg}

    # Location hotspots Aggregation
    locations_agg = list(
        db.items.aggregate([
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 8},
        ])
    )
    locations = {doc["_id"] or "Campus": doc["count"] for doc in locations_agg}

    # Recovery / Resolution Rate
    recovery_rate = (
        round((returned_items_count / total_items) * 100, 1)
        if total_items > 0
        else 0.0
    )

    return jsonify({
        "totalUsers": total_users,
        "totalItems": total_items,
        "lostItems": lost_items_count,
        "foundItems": found_items_count,
        "openClaims": pending_claims_count,
        "pendingClaims": pending_claims_count,
        "approvedClaims": approved_claims_count,
        "resolvedCount": returned_items_count,
        "returnedItems": returned_items_count,
        "recoveryRate": recovery_rate,
        "categories": categories,
        "locations": locations,
    }), 200


@admin_bp.get("/users")
@admin_required
def get_users():
    """Retrieve campus users list with search, role/status filtering, and pagination."""
    db = current_app.db
    search = request.args.get("search", "").strip()
    role = request.args.get("role")
    status = request.args.get("status")

    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}},
        ]
    if role and role != "all":
        query["role"] = role
    if status and status != "all":
        query["account_status"] = status

    cursor = db.users.find(query, {"password_hash": 0}).sort("created_at", -1).limit(100)
    users = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        users.append(doc)
    return jsonify({"users": users, "total": len(users)}), 200


@admin_bp.get("/users/<user_id>")
@admin_required
def get_user_by_id(user_id):
    """Retrieve details for a single campus user."""
    db = current_app.db
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
        if not user:
            return jsonify({"message": "User not found"}), 404
        user["_id"] = str(user["_id"])
        return jsonify({"user": user}), 200
    except Exception:
        return jsonify({"message": "Invalid user ID format"}), 400


@admin_bp.put("/users/<user_id>/status")
@admin_bp.patch("/users/<user_id>/status")
@admin_required
def update_user_status(user_id):
    """Suspend or reactivate a campus user account."""
    db = current_app.db
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ["active", "suspended", "pending"]:
        return jsonify({"message": "Invalid status specified"}), 400

    try:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"account_status": new_status}})
        record_audit_log(
            "ADMIN_USER_STATUS",
            g.user_id,
            g.user_email,
            f"Changed user {user_id} status to {new_status}",
        )
        return jsonify({"message": f"User status updated to {new_status}"}), 200
    except Exception as e:
        return jsonify({"message": "Invalid user ID"}), 400


@admin_bp.patch("/users/<user_id>/role")
@admin_required
def update_user_role(user_id):
    """Assign or revoke administrative role for a user."""
    db = current_app.db
    data = request.get_json() or {}
    new_role = data.get("role")
    if new_role not in ["USER", "ADMIN", "SUPER_ADMIN"]:
        return jsonify({"message": "Invalid role specified"}), 400

    try:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": new_role}})
        record_audit_log(
            "ADMIN_ROLE_CHANGE",
            g.user_id,
            g.user_email,
            f"Changed user {user_id} role to {new_role}",
        )
        return jsonify({"message": f"User role updated to {new_role}"}), 200
    except Exception as e:
        return jsonify({"message": "Invalid user ID"}), 400


@admin_bp.get("/items")
@admin_required
def get_admin_items():
    """Retrieve all items for admin inspection."""
    db = current_app.db
    query = {}
    item_type = request.args.get("type")
    if item_type and item_type != "all":
        query["type"] = item_type

    cursor = db.items.find(query).sort("created_at", -1).limit(100)
    items = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return jsonify({"items": items}), 200


@admin_bp.delete("/items/<item_id>")
@admin_required
def admin_delete_item(item_id):
    """Permanently delete an inappropriate or invalid item report."""
    db = current_app.db
    try:
        res = db.items.delete_one({"_id": ObjectId(item_id)})
        if res.deleted_count == 0:
            return jsonify({"message": "Item not found"}), 404

        record_audit_log(
            "ADMIN_ITEM_REMOVED",
            g.user_id,
            g.user_email,
            f"Admin removed item ID: {item_id}",
        )
        return jsonify({"message": "Item report removed by administration"}), 200
    except Exception as e:
        return jsonify({"message": "Invalid item ID"}), 400


@admin_bp.get("/claims")
@admin_required
def get_admin_claims():
    """Retrieve claims queue with optional status filter."""
    db = current_app.db
    query = {}
    status = request.args.get("status")
    if status and status != "all":
        query["status"] = status

    cursor = db.claims.find(query).sort("created_at", -1).limit(100)
    claims = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        # Enrich with item data if possible
        item = db.items.find_one({"_id": ObjectId(doc.get("item_id"))})
        if item:
            doc["item_title"] = item.get("title")
            doc["item_category"] = item.get("category")
            doc["item_location"] = item.get("location")
        claims.append(doc)
    return jsonify({"claims": claims}), 200


@admin_bp.get("/claims/<claim_id>")
@admin_required
def get_admin_claim_by_id(claim_id):
    """Retrieve details and evidence for a specific claim."""
    db = current_app.db
    try:
        claim = db.claims.find_one({"_id": ObjectId(claim_id)})
        if not claim:
            return jsonify({"message": "Claim not found"}), 404
        claim["_id"] = str(claim["_id"])
        return jsonify({"claim": claim}), 200
    except Exception:
        return jsonify({"message": "Invalid claim ID"}), 400


@admin_bp.patch("/claims/<claim_id>/resolve")
@admin_required
def resolve_claim(claim_id):
    """Approve, reject, or request more info for a claim."""
    try:
        data = request.get_json() or {}
        validated = ClaimResolveSchema(**data)
        result = ClaimService.resolve_claim(
            claim_id,
            validated.decision,
            validated.notes,
            {"id": g.user_id, "email": g.user_email},
        )
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid resolution payload", "errors": err.errors()}), 422


@admin_bp.get("/audit-logs")
@admin_required
def get_audit_logs():
    """Retrieve immutable audit trail records."""
    db = current_app.db
    cursor = db.audit_logs.find({}).sort("created_at", -1).limit(100)
    logs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        logs.append(doc)
    return jsonify({"logs": logs}), 200

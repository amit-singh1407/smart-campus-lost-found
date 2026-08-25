from flask import Blueprint, request, jsonify, g, current_app
from bson import ObjectId
from pydantic import ValidationError
from app.models.schemas import ClaimCreateSchema
from app.services.claim_service import ClaimService
from app.middleware.auth import jwt_required_custom

claim_bp = Blueprint("claims", __name__)


@claim_bp.post("")
@jwt_required_custom
def create_claim():
    """Submit an ownership claim for an item in campus repository."""
    try:
        data = request.get_json() or {}
        validated = ClaimCreateSchema(**data)
        result = ClaimService.create_claim(
            g.user_id,
            g.user_email,
            g.user_name,
            validated.model_dump(),
        )
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid claim data", "errors": err.errors()}), 422


@claim_bp.get("/my")
@claim_bp.get("/my-claims")
@jwt_required_custom
def get_my_claims():
    """Retrieve all claims submitted by the current user."""
    result = ClaimService.get_user_claims(g.user_id)
    return jsonify(result), result["status_code"]


@claim_bp.get("/<claim_id>")
@jwt_required_custom
def get_claim_details(claim_id):
    """Retrieve details for a specific claim."""
    db = current_app.db
    try:
        claim = db.claims.find_one({"_id": ObjectId(claim_id)})
        if not claim:
            return jsonify({"message": "Claim not found"}), 404

        is_admin = g.user_role in ["ADMIN", "SUPER_ADMIN"]
        if not is_admin and claim.get("user_id") != str(g.user_id):
            return jsonify({"message": "Forbidden: You are not authorized to view this claim"}), 403

        claim["_id"] = str(claim["_id"])

        # Enrich with item details
        item = db.items.find_one({"_id": ObjectId(claim["item_id"])})
        if item:
            item["_id"] = str(item["_id"])
            claim["item"] = item

        return jsonify({"claim": claim}), 200
    except Exception as e:
        return jsonify({"message": "Invalid claim ID"}), 400

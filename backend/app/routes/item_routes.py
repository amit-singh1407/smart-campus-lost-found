from flask import Blueprint, request, jsonify, g, current_app
from bson import ObjectId
from pydantic import ValidationError
from app.models.schemas import ItemCreateSchema, ItemUpdateSchema, FoundItemSubmitSchema
from app.services.item_service import ItemService
from app.utils.image_uploader import upload_image_file
from app.middleware.auth import jwt_required_custom

item_bp = Blueprint("items", __name__)


@item_bp.post("/upload-image")
@jwt_required_custom
def upload_image():
    """Upload an image to Cloudinary (with fallback) and return secure URL."""
    if "file" not in request.files:
        return jsonify({"message": "No file payload in request"}), 400

    file = request.files["file"]
    res = upload_image_file(file)
    if "error" in res:
        return jsonify({"message": res["error"]}), res["status_code"]

    return jsonify({"url": res["url"], "image_hash": res.get("image_hash", ""), "message": "Image uploaded successfully"}), 200


@item_bp.get("")
def list_items():
    """Browse items with rich search, filters, and pagination."""
    filters = {
        "type": request.args.get("type"),
        "category": request.args.get("category"),
        "location": request.args.get("location"),
        "brand": request.args.get("brand"),
        "color": request.args.get("color"),
        "status": request.args.get("status"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to"),
        "q": request.args.get("q"),
        "page": request.args.get("page", 1),
        "limit": request.args.get("limit", 12),
    }
    result = ItemService.get_items(filters)
    return jsonify(result), result["status_code"]


@item_bp.get("/<item_id>")
def get_item(item_id):
    """Retrieve detailed item information by ID."""
    result = ItemService.get_item_by_id(item_id)
    if "error" in result:
        return jsonify({"message": result["error"]}), result["status_code"]
    return jsonify(result), result["status_code"]


@item_bp.post("/search-by-image")
def search_by_image():
    """Rank live items against an uploaded image with configurable threshold."""
    if "file" not in request.files:
        return jsonify({"message": "No file payload in request"}), 400

    file_result = upload_image_file(request.files["file"])
    if "error" in file_result:
        return jsonify({"message": file_result["error"]}), file_result["status_code"]

    target_type = request.form.get("target_type", "found")
    threshold = request.form.get("threshold") or request.args.get("threshold")

    result = ItemService.search_items_by_image(
        file_result["image_hash"],
        page=request.form.get("page", 1),
        limit=request.form.get("limit", 12),
        target_type=target_type,
        threshold=threshold,
    )
    return jsonify(result), result["status_code"]


@item_bp.get("/lost/available")
def get_available_lost_items():
    """Retrieve active lost reports available to be found/matched."""
    params = dict(request.args)
    params["type"] = "lost"
    params["status"] = "open"
    result = ItemService.get_items(params)
    return jsonify(result), result["status_code"]


@item_bp.post("/<item_id>/ownership-request")
@jwt_required_custom
def create_item_ownership_request(item_id):
    """Submit an ownership request for an item."""
    from app.services.claim_service import ClaimService
    data = request.get_json() or {}
    data["item_id"] = item_id
    result = ClaimService.create_claim(
        g.user_id,
        g.user_email,
        g.user_name,
        data,
    )
    if "error" in result:
        return jsonify({"message": result["error"]}), result["status_code"]
    return jsonify(result), result["status_code"]


@item_bp.post("/lost")
@jwt_required_custom
def report_lost():
    """Report a lost item on campus."""
    try:
        data = request.get_json() or {}
        data["type"] = "lost"
        # Support alias item_name -> title
        if "item_name" in data and not data.get("title"):
            data["title"] = data["item_name"]
        if "lost_date" in data and not data.get("date"):
            data["date"] = data["lost_date"]
        if "lost_location" in data and not data.get("location"):
            data["location"] = data["lost_location"]

        validated = ItemCreateSchema(**data)
        result = ItemService.create_item(
            g.user_id,
            g.user_email,
            g.user_name,
            validated.model_dump(),
        )
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid report input", "errors": err.errors()}), 422


@item_bp.post("/found")
@jwt_required_custom
def report_found():
    """Report a found item turned in on campus."""
    try:
        data = request.get_json() or {}
        data["type"] = "found"
        # Support alias item_name -> title
        if "item_name" in data and not data.get("title"):
            data["title"] = data["item_name"]
        if "found_date" in data and not data.get("date"):
            data["date"] = data["found_date"]
        if "found_location" in data and not data.get("location"):
            data["location"] = data["found_location"]

        validated = ItemCreateSchema(**data)
        result = ItemService.create_item(
            g.user_id,
            g.user_email,
            g.user_name,
            validated.model_dump(),
        )
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid report input", "errors": err.errors()}), 422


@item_bp.post("/found-confirmation")
@jwt_required_custom
def submit_found_confirmation():
    """Submit a confirmation that a specific lost item was found."""
    try:
        data = request.get_json() or {}
        validated = FoundItemSubmitSchema(**data)
        
        result = ItemService.submit_found_confirmation(
            g.user_id,
            g.user_email,
            g.user_name,
            validated.model_dump(),
        )
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid found confirmation input", "errors": err.errors()}), 422


@item_bp.get("/my")
@item_bp.get("/my-reports")
@jwt_required_custom
def my_reports():
    """Fetch all reports authored by the currently logged-in user."""
    result = ItemService.get_user_reports(g.user_id)
    return jsonify(result), result["status_code"]


@item_bp.put("/<item_id>")
@jwt_required_custom
def update_item(item_id):
    """Update user's own item report."""
    try:
        data = request.get_json() or {}
        validated = ItemUpdateSchema(**data)
        is_admin = g.user_role in ["ADMIN", "SUPER_ADMIN"]
        result = ItemService.update_item(
            item_id,
            user_id=g.user_id,
            update_data=validated.model_dump(exclude_unset=True),
            is_admin=is_admin,
        )
        if "error" in result:
            return jsonify({"message": result["error"]}), result["status_code"]
        return jsonify(result), result["status_code"]
    except ValidationError as err:
        return jsonify({"message": "Invalid update input", "errors": err.errors()}), 422


@item_bp.delete("/<item_id>")
@jwt_required_custom
def delete_item(item_id):
    """Delete user's own item report."""
    is_admin = g.user_role in ["ADMIN", "SUPER_ADMIN"]
    result = ItemService.delete_item(item_id, user_id=g.user_id, is_admin=is_admin)
    if "error" in result:
        return jsonify({"message": result["error"]}), result["status_code"]
    return jsonify(result), result["status_code"]


@item_bp.patch("/<item_id>/status")
@jwt_required_custom
def update_status(item_id):
    """Update item status."""
    data = request.get_json() or {}
    new_status = data.get("status", "resolved")
    is_admin = g.user_role in ["ADMIN", "SUPER_ADMIN"]
    result = ItemService.update_item_status(item_id, status=new_status, user_id=g.user_id, is_admin=is_admin)
    if "error" in result:
        return jsonify({"message": result["error"]}), result["status_code"]
    return jsonify(result), result["status_code"]


@item_bp.get("/matches")
@jwt_required_custom
def get_matches():
    """Retrieve all candidate matches computed for user's lost reports."""
    db = current_app.db
    user_lost_items = list(db.items.find({"user_id": str(g.user_id), "type": "lost"}))
    user_lost_ids = [str(item["_id"]) for item in user_lost_items]

    if not user_lost_ids:
        return jsonify({"matches": []}), 200

    match_docs = list(db.matches.find({"lost_item_id": {"$in": user_lost_ids}}).sort("similarity_score", -1))
    enriched_matches = []

    for match in match_docs:
        lost_doc = db.items.find_one({"_id": ObjectId(match["lost_item_id"])})
        found_doc = db.items.find_one({"_id": ObjectId(match["found_item_id"])})

        if lost_doc and found_doc:
            enriched_matches.append({
                "id": str(match["_id"]),
                "similarity_score": match.get("similarity_score", 80),
                "match_tier": match.get("match_tier", "possible"),
                "breakdown": match.get("breakdown", {}),
                "category": lost_doc.get("category"),
                "lost_item_id": match["lost_item_id"],
                "found_item_id": match["found_item_id"],
                "lost_item": ItemService._public_item(lost_doc),
                "found_item": ItemService._public_item(found_doc),
                "created_at": match.get("created_at"),
            })

    return jsonify({"matches": enriched_matches}), 200

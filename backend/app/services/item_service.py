import math
import secrets
from datetime import datetime, timezone
from bson import ObjectId
from flask import current_app
from app.services.audit_service import record_audit_log
from app.services.matching_engine import MatchingEngine


class ItemService:
    @staticmethod
    def _public_item(doc: dict):
        """Return only fields safe for public discovery and claim review, concealing private markers."""
        return {
            "_id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "item_name": doc.get("title", ""),
            "category": doc.get("category", "Others"),
            "brand": doc.get("brand", ""),
            "color": doc.get("color", ""),
            "location": doc.get("location", "Campus"),
            "date": doc.get("date"),
            "description": doc.get("description", ""),
            "storage_location": doc.get("storage_location", ""),
            "storage_shelf": doc.get("storage_shelf", ""),
            "storage_locker": doc.get("storage_locker", ""),
            "storage_status": doc.get("storage_status", "SAFE_STORAGE" if doc.get("type") == "found" else ""),
            "storage_id": doc.get("storage_id", ""),
            "is_high_value": doc.get("is_high_value", False),
            "image_url": doc.get("image_url", ""),
            "imageUrl": doc.get("image_url", ""),
            "type": doc.get("type"),
            "status": doc.get("status", "open"),
            "has_verification_questions": bool(doc.get("private_verification_questions")),
            "custody_events": doc.get("custody_events", []),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }


    @staticmethod
    def search_items_by_image(image_hash: str, page=1, limit=12):
        """Rank found items by perceptual-hash similarity without exposing hashes."""
        db = current_app.db
        try:
            page = max(1, int(page))
            limit = max(1, min(100, int(limit)))
        except (TypeError, ValueError):
            page, limit = 1, 12

        candidates = db.items.find({
            "type": "found",
            "status": {"$in": ["open", "matched"]},
            "image_hash": {"$exists": True, "$ne": ""},
        })
        ranked = []
        for doc in candidates:
            stored_hash = doc.get("image_hash", "")
            if len(stored_hash) != len(image_hash):
                continue
            distance = sum(left != right for left, right in zip(image_hash, stored_hash))
            score = round((1 - distance / len(image_hash)) * 100)
            ranked.append((score, doc))

        ranked.sort(key=lambda entry: entry[0], reverse=True)
        total = len(ranked)
        start = (page - 1) * limit
        results = []
        for score, doc in ranked[start:start + limit]:
            item = ItemService._public_item(doc)
            item["image_match_score"] = score
            results.append(item)

        total_pages = max(1, math.ceil(total / limit))
        return {
            "items": results,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": total_pages,
            "total_pages": total_pages,
            "status_code": 200,
        }

    @staticmethod
    def create_item(user_id: str, user_email: str, user_name: str, data: dict):
        db = current_app.db

        category = data.get("category", "Others").strip()
        is_high_value = bool(data.get("is_high_value")) or any(
            hv in category.lower() for hv in ["laptop", "electronic", "phone", "wallet", "watch", "card"]
        )

        item_doc = {
            "title": data["title"].strip(),
            "category": category,
            "brand": data.get("brand", "").strip(),
            "color": data.get("color", "").strip(),
            "location": data.get("location", "Campus").strip(),
            "date": data.get("date") or datetime.now(timezone.utc).isoformat(),
            "description": data.get("description", "").strip(),
            "distinctive_features": data.get("distinctive_features", "").strip(),
            "private_verification_questions": data.get("private_verification_questions", "").strip(),
            "storage_location": data.get("storage_location", "").strip(),
            "storage_shelf": data.get("storage_shelf", "").strip(),
            "storage_locker": data.get("storage_locker", "").strip(),
            "is_high_value": is_high_value,
            "image_url": data.get("image_url", "").strip(),
            "image_hash": data.get("image_hash", "").strip(),
            "type": data["type"],  # 'lost' or 'found'
            "status": "open",  # 'open', 'matched', 'claimed', 'resolved'
            "user_id": str(user_id),
            "user_email": user_email,
            "user_name": user_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if item_doc["type"] == "found":
            shelf = data.get("storage_shelf", "").strip() or "Shelf A"
            locker = data.get("storage_locker", "").strip() or f"Locker-{secrets.randbelow(50) + 1}"
            item_doc.update({
                "storage_shelf": shelf,
                "storage_locker": locker,
                "storage_id": f"LF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}",
                "storage_status": "STORED",
                "custody_events": [{
                    "event": "FOUND_REPORTED",
                    "actor_id": str(user_id),
                    "actor_name": user_name,
                    "location_details": f"{data.get('storage_location', 'Security Vault')} ({shelf}, {locker})",
                    "timestamp": item_doc["created_at"],
                }],
            })


        res = db.items.insert_one(item_doc)
        item_id = str(res.inserted_id)
        item_doc["_id"] = item_id

        record_audit_log(
            "ITEM_CREATED",
            user_id,
            user_email,
            f"Created {data['type']} item report: {data['title']} (Category: {data.get('category')})",
        )

        # Trigger AI & Rule-based Smart Matching Engine
        matches_found = MatchingEngine.run_matching_for_new_item(item_doc, item_id)
        if matches_found > 0:
            db.items.update_one({"_id": ObjectId(item_id)}, {"$set": {"status": "matched"}})
            item_doc["status"] = "matched"

        return {
            "message": "Report published successfully",
            "item": item_doc,
            "matches_found": matches_found,
            "status_code": 201,
        }

    @staticmethod
    def get_items(filter_params: dict):
        db = current_app.db
        query = {}

        # Type filter ('lost', 'found', 'all')
        if filter_params.get("type") and filter_params["type"] != "all":
            query["type"] = filter_params["type"]

        # Category filter
        if filter_params.get("category") and filter_params["category"] != "All":
            query["category"] = filter_params["category"]

        # Location filter
        if filter_params.get("location") and filter_params["location"] != "All Locations":
            query["location"] = {"$regex": filter_params["location"], "$options": "i"}

        # Brand filter
        if filter_params.get("brand") and filter_params["brand"].strip():
            query["brand"] = {"$regex": filter_params["brand"].strip(), "$options": "i"}

        # Color filter
        if filter_params.get("color") and filter_params["color"].strip():
            query["color"] = {"$regex": filter_params["color"].strip(), "$options": "i"}

        # Status filter
        if filter_params.get("status") and filter_params["status"] != "all":
            query["status"] = filter_params["status"]

        # Date range filter
        if filter_params.get("date_from") or filter_params.get("date_to"):
            date_filter = {}
            if filter_params.get("date_from"):
                date_filter["$gte"] = filter_params["date_from"]
            if filter_params.get("date_to"):
                date_filter["$lte"] = filter_params["date_to"]
            query["date"] = date_filter

        # Match each search term across the fields visible to campus users.
        if filter_params.get("q") and filter_params["q"].strip():
            terms = filter_params["q"].strip().split()
            query["$and"] = [{"$or": [
                {"title": {"$regex": term, "$options": "i"}},
                {"category": {"$regex": term, "$options": "i"}},
                {"description": {"$regex": term, "$options": "i"}},
                {"location": {"$regex": term, "$options": "i"}},
                {"brand": {"$regex": term, "$options": "i"}},
                {"color": {"$regex": term, "$options": "i"}},
            ]} for term in terms]

        # Pagination
        try:
            page = max(1, int(filter_params.get("page", 1)))
        except (ValueError, TypeError):
            page = 1

        try:
            limit = max(1, min(100, int(filter_params.get("limit", 12))))
        except (ValueError, TypeError):
            limit = 12

        skip = (page - 1) * limit

        total_count = db.items.count_documents(query)
        total_pages = max(1, math.ceil(total_count / limit))

        cursor = db.items.find(query).sort("created_at", -1).skip(skip).limit(limit)
        items = [ItemService._public_item(doc) for doc in cursor]

        return {
            "items": items,
            "total": total_count,
            "page": page,
            "limit": limit,
            "pages": total_pages,
            "total_pages": total_pages,
            "status_code": 200,
        }

    @staticmethod
    def get_item_by_id(item_id: str):
        db = current_app.db
        try:
            doc = db.items.find_one({"_id": ObjectId(item_id)})
            if not doc:
                return {"error": "Item not found", "status_code": 404}
            return {"item": ItemService._public_item(doc), "status_code": 200}
        except Exception:
            return {"error": "Invalid item ID format", "status_code": 400}

    @staticmethod
    def get_user_reports(user_id: str):
        db = current_app.db
        cursor = db.items.find({"user_id": str(user_id)}).sort("created_at", -1)
        items = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            items.append(doc)
        return {"items": items, "status_code": 200}

    @staticmethod
    def update_item(item_id: str, user_id: str, update_data: dict, is_admin: bool = False):
        db = current_app.db
        try:
            query = {"_id": ObjectId(item_id)}
            if not is_admin:
                query["user_id"] = str(user_id)

            existing = db.items.find_one(query)
            if not existing:
                return {
                    "error": "Item not found or you are not authorized to edit this report.",
                    "status_code": 403,
                }

            cleaned_updates = {k: v for k, v in update_data.items() if v is not None}
            cleaned_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

            db.items.update_one(query, {"$set": cleaned_updates})

            updated_doc = db.items.find_one({"_id": ObjectId(item_id)})
            updated_doc["_id"] = str(updated_doc["_id"])

            record_audit_log("ITEM_UPDATED", user_id, None, f"Updated item ID: {item_id}")
            return {
                "message": "Item report updated successfully",
                "item": updated_doc,
                "status_code": 200,
            }
        except Exception as e:
            return {"error": str(e), "status_code": 400}

    @staticmethod
    def delete_item(item_id: str, user_id: str = None, is_admin: bool = False):
        db = current_app.db
        try:
            query = {"_id": ObjectId(item_id)}
            if not is_admin:
                query["user_id"] = str(user_id)

            res = db.items.delete_one(query)
            if res.deleted_count == 0:
                return {
                    "error": "Item not found or unauthorized to delete.",
                    "status_code": 403,
                }

            # Clean up associated matches
            db.matches.delete_many({
                "$or": [{"lost_item_id": item_id}, {"found_item_id": item_id}]
            })

            record_audit_log("ITEM_DELETED", user_id, None, f"Deleted item ID: {item_id}")
            return {"message": "Item deleted successfully", "status_code": 200}
        except Exception as e:
            return {"error": str(e), "status_code": 400}

    @staticmethod
    def update_item_status(item_id: str, status: str, user_id: str = None, is_admin: bool = False):
        db = current_app.db
        try:
            query = {"_id": ObjectId(item_id)}
            if not is_admin:
                query["user_id"] = str(user_id)

            res = db.items.update_one(
                query,
                {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            if res.matched_count == 0:
                return {"error": "Item not found or unauthorized.", "status_code": 404}

            return {"message": f"Item status updated to {status}", "status_code": 200}
        except Exception as e:
            return {"error": str(e), "status_code": 400}

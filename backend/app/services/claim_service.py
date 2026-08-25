from datetime import datetime, timezone
from bson import ObjectId
from flask import current_app
from app.services.audit_service import record_audit_log


class ClaimService:
    @staticmethod
    def create_claim(user_id: str, user_email: str, user_name: str, data: dict):
        db = current_app.db
        item_id = data["item_id"]

        try:
            item = db.items.find_one({"_id": ObjectId(item_id)})
            if not item:
                return {"error": "Item not found", "status_code": 404}
        except Exception:
            return {"error": "Invalid item ID", "status_code": 400}

        claim_doc = {
            "item_id": item_id,
            "item_title": item.get("title", ""),
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "proof_description": data["proof_description"].strip(),
            "contact_phone": data.get("contact_phone", ""),
            "status": "pending",  # 'pending', 'approved', 'rejected', 'completed'
            "admin_notes": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        res = db.claims.insert_one(claim_doc)
        claim_id = str(res.inserted_id)

        record_audit_log(
            "CLAIM_SUBMITTED",
            user_id,
            user_email,
            f"Submitted claim for item ID: {item_id}",
        )

        return {"message": "Claim submitted successfully for review", "claim_id": claim_id, "status_code": 201}

    @staticmethod
    def get_user_claims(user_id: str):
        db = current_app.db
        cursor = db.claims.find({"user_id": user_id}).sort("created_at", -1)
        claims = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            claims.append(doc)
        return {"claims": claims, "status_code": 200}

    @staticmethod
    def resolve_claim(claim_id: str, decision: str, notes: str, admin_user: dict):
        db = current_app.db
        try:
            claim = db.claims.find_one({"_id": ObjectId(claim_id)})
            if not claim:
                return {"error": "Claim not found", "status_code": 404}

            db.claims.update_one(
                {"_id": ObjectId(claim_id)},
                {
                    "$set": {
                        "status": decision,
                        "admin_notes": notes.strip(),
                        "resolved_by": admin_user.get("email"),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
            )

            # If approved, update item status
            if decision == "approved":
                db.items.update_one(
                    {"_id": ObjectId(claim["item_id"])},
                    {"$set": {"status": "resolved"}},
                )

            # Send notification to claimant
            db.notifications.insert_one({
                "user_id": claim["user_id"],
                "type": "claim",
                "title": f"Claim Decision: {decision.capitalize()}",
                "message": f"Your claim for '{claim.get('item_title')}' was {decision}. Note: {notes or 'No notes provided'}",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

            record_audit_log(
                "CLAIM_RESOLVED",
                admin_user.get("id"),
                admin_user.get("email"),
                f"Resolved claim {claim_id} with decision: {decision}",
            )

            return {"message": f"Claim has been {decision}", "status_code": 200}
        except Exception as e:
            return {"error": str(e), "status_code": 400}

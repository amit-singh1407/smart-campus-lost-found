from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from bson import ObjectId
from flask import current_app
from app.services.audit_service import record_audit_log


class ClaimService:
    @staticmethod
    def _custody_event(item: dict, event: str, actor: dict):
        return {
            "event": event,
            "actor_id": actor.get("id"),
            "actor_name": actor.get("name") or actor.get("email"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _calculate_claim_priority(item: dict, claim_data: dict) -> dict:
        """
        Calculates automated priority and fraud-risk score for the Admin Work Queue:
        - Category value (laptops, phones, wallets -> +40 pts)
        - Evidence length and presence of serial / receipt numbers (+25 pts)
        - Private question verification answers (+25 pts)
        - High-value tag (+10 pts)
        """
        priority_score = 30
        reasons = []

        is_high_val = item.get("is_high_value", False) or any(
            k in item.get("category", "").lower() for k in ["laptop", "phone", "wallet", "electronic", "card"]
        )
        if is_high_val:
            priority_score += 35
            reasons.append("High-value item tier")

        proof_desc = (claim_data.get("proof_description") or "").lower()
        if len(proof_desc.split()) >= 15:
            priority_score += 15
            reasons.append("Comprehensive ownership evidence provided")
        elif len(proof_desc.split()) < 5:
            priority_score -= 15
            reasons.append("Sparse evidence description")

        # Check for serial numbers, receipts, or distinctive identifiers in proof
        if any(w in proof_desc for w in ["serial", "sn", "imei", "bill", "receipt", "model", "sticker", "scratch"]):
            priority_score += 15
            reasons.append("Contains hardware identifiers or receipt references")

        # Verification questions answered
        answers = (claim_data.get("answers_to_private_questions") or "").strip()
        if answers and len(answers) >= 5:
            priority_score += 20
            reasons.append("Private verification questions answered")

        priority_score = max(5, min(100, priority_score))

        if priority_score >= 80:
            priority_tier = "URGENT"
        elif priority_score >= 60:
            priority_tier = "HIGH"
        elif priority_score >= 40:
            priority_tier = "NORMAL"
        else:
            priority_tier = "LOW"

        # Fraud risk calculation
        if len(proof_desc.split()) < 5 and not answers:
            fraud_risk = "HIGH"
        elif priority_score >= 70:
            fraud_risk = "LOW"
        else:
            fraud_risk = "MEDIUM"

        return {
            "priority_score": priority_score,
            "priority_tier": priority_tier,
            "fraud_risk": fraud_risk,
            "priority_reasons": reasons,
        }

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

        priority_info = ClaimService._calculate_claim_priority(item, data)

        claim_doc = {
            "item_id": item_id,
            "item_title": item.get("title", ""),
            "item_category": item.get("category", ""),
            "storage_id": item.get("storage_id", ""),
            "storage_locker": item.get("storage_locker", ""),
            "storage_shelf": item.get("storage_shelf", ""),
            "is_high_value": item.get("is_high_value", False),
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "proof_description": data["proof_description"].strip(),
            "contact_phone": data.get("contact_phone", ""),
            "answers_to_private_questions": data.get("answers_to_private_questions", "").strip(),
            "priority_score": priority_info["priority_score"],
            "priority_tier": priority_info["priority_tier"],
            "fraud_risk": priority_info["fraud_risk"],
            "priority_reasons": priority_info["priority_reasons"],
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
            f"Submitted claim for item ID: {item_id} (Priority: {priority_info['priority_tier']})",
        )

        return {
            "message": "Claim submitted successfully for review",
            "claim_id": claim_id,
            "priority_tier": priority_info["priority_tier"],
            "status_code": 201,
        }


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

            handover_url = None
            raw_token = None
            if decision == "approved":
                raw_token = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
                handover_url = f"/api/v1/admin/collection/verify?token={raw_token}"
                now = datetime.now(timezone.utc).isoformat()
                db.items.update_one(
                    {"_id": ObjectId(claim["item_id"])},
                    {
                        "$set": {
                            "status": "ready_for_collection",
                            "storage_status": "READY_FOR_COLLECTION",
                            "handover_claim_id": claim_id,
                            "handover_token_hash": token_hash,
                            "handover_expires_at": (datetime.now(timezone.utc) + timedelta(hours=48)).replace(microsecond=0).isoformat(),
                        },
                        "$push": {"custody_events": {
                            "event": "CLAIM_APPROVED",
                            "actor_id": admin_user.get("id"),
                            "actor_name": admin_user.get("email"),
                            "timestamp": now,
                        }},
                    },
                )

                # Store handover token on claim so user can render the dynamic QR Code
                db.claims.update_one(
                    {"_id": ObjectId(claim_id)},
                    {"$set": {
                        "handover_token": raw_token,
                        "handover_expires_at": (datetime.now(timezone.utc) + timedelta(hours=48)).replace(microsecond=0).isoformat(),
                        "collection_location": "Central Campus Security Desk (Building A, Room 102)",
                    }}
                )

            # Send notification to claimant
            db.notifications.insert_one({
                "user_id": claim["user_id"],
                "type": "claim",
                "title": f"Claim Decision: {decision.capitalize()}",
                "message": f"Your claim for '{claim.get('item_title')}' was {decision}. Note: {notes or 'No notes provided'}"
                    + (f" Handover link: {handover_url}" if handover_url else ""),
                "handover_url": handover_url,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

            record_audit_log(
                "CLAIM_RESOLVED",
                admin_user.get("id"),
                admin_user.get("email"),
                f"Resolved claim {claim_id} with decision: {decision}",
            )

            return {
                "message": f"Claim has been {decision}",
                "handover_url": handover_url,
                "handover_token": raw_token,
                "status_code": 200,
            }
        except Exception as e:
            return {"error": str(e), "status_code": 400}


    @staticmethod
    def collect_item(token: str, admin_user: dict):
        db = current_app.db
        token_hash = hashlib.sha256((token or "").encode("utf-8")).hexdigest()
        item = db.items.find_one({
            "handover_token_hash": token_hash,
            "status": "ready_for_collection",
        })
        if not item:
            return {"error": "Handover token is invalid or already used.", "status_code": 404}

        expires_at = item.get("handover_expires_at")
        if expires_at:
            try:
                expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if expiry <= datetime.now(timezone.utc):
                    return {"error": "This handover token has expired.", "status_code": 410}
            except ValueError:
                return {"error": "This handover token is invalid.", "status_code": 400}

        now = datetime.now(timezone.utc).isoformat()
        claim = db.claims.find_one({"_id": ObjectId(item["handover_claim_id"])})
        result = db.items.update_one(
            {"_id": item["_id"], "handover_token_hash": token_hash, "status": "ready_for_collection"},
            {
                "$set": {"status": "resolved", "storage_status": "COLLECTED", "collected_at": now},
                "$unset": {"handover_token_hash": "", "handover_claim_id": "", "handover_expires_at": ""},
                "$push": {"custody_events": ClaimService._custody_event(item, "ITEM_COLLECTED", admin_user)},
            },
        )
        if result.modified_count != 1:
            return {"error": "Handover was completed by another request.", "status_code": 409}

        if claim:
            db.claims.update_one(
                {"_id": claim["_id"], "status": "approved"},
                {"$set": {"status": "completed", "updated_at": now}},
            )

        record_audit_log("ITEM_COLLECTED", admin_user.get("id"), admin_user.get("email"), f"Collected item {item['_id']}")
        db.notifications.insert_one({
            "user_id": claim.get("user_id") if claim else "",
            "type": "claim",
            "title": "Item collected",
            "message": f"Your item '{item.get('title', 'item')}' was recorded as collected.",
            "read": False,
            "created_at": now,
        })
        return {"message": "Collection verified and recorded.", "item_id": str(item["_id"]), "status_code": 200}

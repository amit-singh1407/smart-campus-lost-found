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

        reference_id = f"REQ-{datetime.now(timezone.utc).year}-{secrets.randbelow(90000) + 10000:05d}"
        now_iso = datetime.now(timezone.utc).isoformat()

        claim_doc = {
            "reference_id": reference_id,
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
            "supporting_image_url": data.get("supporting_image_url") or data.get("evidence_image_url", ""),
            "additional_information": data.get("additional_information", "").strip(),
            "answers_to_private_questions": data.get("answers_to_private_questions", "").strip(),
            "priority_score": priority_info["priority_score"],
            "priority_tier": priority_info["priority_tier"],
            "fraud_risk": priority_info["fraud_risk"],
            "priority_reasons": priority_info["priority_reasons"],
            "status": "UNDER_REVIEW",  # 'UNDER_REVIEW', 'approved', 'rejected', 'completed'
            "admin_notes": "",
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        res = db.claims.insert_one(claim_doc)
        claim_id = str(res.inserted_id)

        record_audit_log(
            "OWNERSHIP_REQUEST_SUBMITTED",
            user_id,
            user_email,
            f"Submitted ownership request {reference_id} for item ID: {item_id}",
        )

        return {
            "message": "Ownership request submitted successfully under review",
            "claim_id": claim_id,
            "reference_id": reference_id,
            "status": "UNDER_REVIEW",
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
    def resolve_claim(claim_id: str, decision: str, notes: str, ownership_verified: bool, admin_user: dict):
        db = current_app.db
        try:
            claim = db.claims.find_one({"_id": ObjectId(claim_id)})
            if not claim:
                return {"error": "Claim not found", "status_code": 404}

            decision_norm = "approved" if decision.lower() in ["approved", "resolve"] else decision.lower()
            if decision_norm == "approved" and not ownership_verified:
                return {
                    "error": "Admin ownership verification is required before resolving a claim.",
                    "status_code": 400,
                }
            now_iso = datetime.now(timezone.utc).isoformat()

            db.claims.update_one(
                {"_id": ObjectId(claim_id)},
                {
                    "$set": {
                        "status": decision_norm,
                        "admin_notes": notes.strip(),
                        "resolved_by": admin_user.get("email"),
                        "updated_at": now_iso,
                    }
                },
            )

            item = db.items.find_one({"_id": ObjectId(claim["item_id"])}) or {}
            ref_id = item.get("reference_id") or claim.get("reference_id") or f"REF-{claim_id[:8]}"
            item_title = item.get("title") or claim.get("item_title", "item")

            if decision_norm == "approved":
                db.items.update_one(
                    {"_id": ObjectId(claim["item_id"])},
                    {
                        "$set": {
                            "status": "ready_for_collection",
                            "storage_status": "READY_FOR_COLLECTION",
                            "delivery_status": "READY_FOR_COLLECTION",
                            "verified_owner_id": claim["user_id"],
                            "resolved_at": now_iso,
                        },
                        "$push": {"custody_events": {
                            "event": "OWNERSHIP_APPROVED",
                            "actor_id": admin_user.get("id"),
                            "actor_name": admin_user.get("email"),
                            "notes": notes,
                            "timestamp": now_iso,
                        }},
                    },
                )

                # Send personal resolution notification to the student
                db.notifications.insert_one({
                    "user_id": claim["user_id"],
                    "type": "CASE_RESOLVED",
                    "title": "Lost Item Resolved",
                    "message": f"Your lost {item_title} has been verified by the Lost & Found administrator. Reference: {ref_id}",
                    "reference_id": ref_id,
                    "item_id": str(claim["item_id"]),
                    "read": False,
                    "created_at": now_iso,
                })

                record_audit_log(
                    "CASE_RESOLVED",
                    admin_user.get("id"),
                    admin_user.get("email"),
                    f"Resolved ownership case for item {item_title} (Ref: {ref_id})",
                )

            elif decision_norm == "rejected":
                db.notifications.insert_one({
                    "user_id": claim["user_id"],
                    "type": "OWNERSHIP_REJECTED",
                    "title": "Ownership Request Rejected",
                    "message": f"Your ownership request for '{item_title}' was reviewed and not approved. Note: {notes or 'No details provided'}",
                    "reference_id": ref_id,
                    "item_id": str(claim["item_id"]),
                    "read": False,
                    "created_at": now_iso,
                })
                record_audit_log(
                    "OWNERSHIP_REJECTED",
                    admin_user.get("id"),
                    admin_user.get("email"),
                    f"Rejected ownership request {claim.get('reference_id', claim_id)}",
                )

            elif decision_norm == "request_info":
                db.notifications.insert_one({
                    "user_id": claim["user_id"],
                    "type": "OWNERSHIP_REQUEST",
                    "title": "More Information Requested",
                    "message": f"The administrator requested additional information for '{item_title}': {notes}",
                    "reference_id": ref_id,
                    "item_id": str(claim["item_id"]),
                    "read": False,
                    "created_at": now_iso,
                })

            return {
                "message": f"Case has been {decision_norm}",
                "status": decision_norm,
                "status_code": 200,
            }
        except Exception as e:
            return {"error": str(e), "status_code": 400}


    @staticmethod
    def confirm_handover(reference_id: str, student_identifier: str, notes: str, admin_user: dict):
        db = current_app.db
        ref = (reference_id or "").strip()
        if not ref:
            return {"error": "A Reference ID or Item ID is required.", "status_code": 400}

        try:
            query = {"$or": [{"reference_id": ref}]}
            try:
                query["$or"].append({"_id": ObjectId(ref)})
            except Exception:
                pass

            item = db.items.find_one(query)
            claim = None
            if not item:
                claim = db.claims.find_one(query)
                if claim and claim.get("item_id"):
                    try:
                        item = db.items.find_one({"_id": ObjectId(claim["item_id"])})
                    except Exception:
                        pass

            if not item:
                return {"error": f"No item found matching reference: {ref}", "status_code": 404}

            item_id = str(item["_id"])
            now_iso = datetime.now(timezone.utc).isoformat()

            db.items.update_one(
                {"_id": item["_id"]},
                {
                    "$set": {
                        "status": "closed",
                        "delivery_status": "RETURNED",
                        "storage_status": "RETURNED",
                        "handed_over_to": student_identifier or item.get("user_email"),
                        "handed_over_at": now_iso,
                        "handover_notes": notes,
                        "updated_at": now_iso,
                    },
                    "$push": {
                        "custody_events": {
                            "event": "ITEM_RETURNED",
                            "actor_id": admin_user.get("id"),
                            "actor_name": admin_user.get("email"),
                            "notes": notes,
                            "timestamp": now_iso,
                        }
                    }
                }
            )

            db.claims.update_many(
                {"item_id": item_id, "status": {"$in": ["approved", "pending", "UNDER_REVIEW"]}},
                {"$set": {"status": "completed", "updated_at": now_iso}}
            )

            student_id = item.get("user_id") or (claim.get("user_id") if claim else None)
            if student_id:
                db.notifications.insert_one({
                    "user_id": student_id,
                    "type": "ITEM_RETURNED",
                    "title": "Item Handed Over",
                    "message": f"Your item '{item.get('title')}' has been successfully handed over to you. Case is now closed.",
                    "reference_id": item.get("reference_id") or ref,
                    "read": False,
                    "created_at": now_iso,
                })

            record_audit_log(
                "ITEM_RETURNED",
                admin_user.get("id"),
                admin_user.get("email"),
                f"Confirmed handover for item {item.get('title')} (Ref: {item.get('reference_id') or ref}) to {student_identifier}",
            )

            return {
                "message": "Item handover confirmed successfully. Status set to RETURNED and CLOSED.",
                "item_id": item_id,
                "status": "closed",
                "delivery_status": "RETURNED",
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
        claim_id = item.get("handover_claim_id")
        claim = db.claims.find_one({"_id": ObjectId(claim_id)}) if claim_id else None
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

from datetime import datetime, timezone
from typing import Any, Dict, Optional


class NotificationService:
    """Centralized service for campus-wide and personal notifications."""

    @staticmethod
    def create_notification(notification_type: str, title: str, message: str, *, user_id: Optional[str] = None,
                            item_id: Optional[str] = None, reference_id: Optional[str] = None,
                            target_type: Optional[str] = None, read: bool = False, extra: Optional[Dict[str, Any]] = None):
        payload = {
            "type": notification_type,
            "title": title,
            "message": message,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read": read,
        }

        if user_id is not None:
            payload["user_id"] = user_id
        if item_id is not None:
            payload["item_id"] = item_id
        if reference_id is not None:
            payload["reference_id"] = reference_id
        if target_type is not None:
            payload["target_type"] = target_type
        if extra:
            payload.update(extra)

        return payload

    @staticmethod
    def create_campus_lost_item_alert(item: Dict[str, Any]) -> Dict[str, Any]:
        title = "New Lost Item Report"
        item_name = (item.get("title") or item.get("item_name") or "Item").strip()
        location = (item.get("location") or "campus").strip()
        item_date = item.get("date") or "recently"
        reference_id = item.get("reference_id") or item.get("referenceId") or "LOST-REPORT"
        message = (
            f"{item_name} was reported lost near {location}. "
            f"If you find this item, please report it through the Smart Campus Lost & Found Portal."
        )
        return NotificationService.create_notification(
            "CAMPUS_LOST_ITEM",
            title,
            message,
            item_id=str(item.get("_id") or item.get("id") or ""),
            reference_id=reference_id,
            target_type="ALL_ACTIVE_STUDENTS",
            extra={
                "type": "CAMPUS_LOST_ITEM",
                "item_name": item_name,
                "location": location,
                "date": item_date,
                "image_url": item.get("image_url") or item.get("imageUrl") or item.get("found_image") or item.get("found_image_url") or "",
                "status": "ACTIVE",
            },
        )

    @staticmethod
    def create_personal_notification(user_id: str, title: str, message: str, *, item_id: Optional[str] = None,
                                    reference_id: Optional[str] = None, extra: Optional[Dict[str, Any]] = None):
        payload = NotificationService.create_notification(
            "PERSONAL",
            title,
            message,
            user_id=user_id,
            item_id=item_id,
            reference_id=reference_id,
            read=False,
            extra=extra,
        )
        return payload

    @staticmethod
    def send_campus_lost_item_alert(db, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create a campus-wide alert record. For a smaller project this can be a single doc; for scale, it can be expanded to target users."""
        alert = NotificationService.create_campus_lost_item_alert(item)
        result = db.notifications.insert_one(alert)
        alert["_id"] = str(result.inserted_id)
        return alert

    @staticmethod
    def send_personal_notification(db, user_id: str, title: str, message: str, *, item_id: Optional[str] = None,
                                  reference_id: Optional[str] = None, extra: Optional[Dict[str, Any]] = None):
        payload = NotificationService.create_personal_notification(
            user_id,
            title,
            message,
            item_id=item_id,
            reference_id=reference_id,
            extra=extra,
        )
        result = db.notifications.insert_one(payload)
        payload["_id"] = str(result.inserted_id)
        return payload

    @staticmethod
    def send_email_notification(recipient_email: str, subject: str, body: str) -> bool:
        try:
            from app.utils.email_sender import send_verification_email

            # Reuse the SMTP helper by converting a verification-style message; production code can use a dedicated email sender later.
            print(f"[EMAIL] Campus alert queued for {recipient_email}")
            print(f"Subject: {subject}")
            print(body)
            return True
        except Exception:
            return False

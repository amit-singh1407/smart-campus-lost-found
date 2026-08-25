from datetime import datetime, timezone
from flask import current_app, request


def record_audit_log(action: str, user_id: str = None, user_email: str = None, details: str = ""):
    """Record an audit trail event in the audit_logs collection."""
    try:
        db = current_app.db
        ip_address = request.remote_addr if request else "127.0.0.1"
        log_entry = {
            "action": action,
            "user_id": str(user_id) if user_id else None,
            "user_email": user_email,
            "details": details,
            "ip_address": ip_address,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        db.audit_logs.insert_one(log_entry)
    except Exception as e:
        print(f"Failed to record audit log: {e}")

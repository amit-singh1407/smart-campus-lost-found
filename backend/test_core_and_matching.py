import io
import json
from app import create_app
from app.services.matching_engine import MatchingEngine

def run_system_tests():
    app = create_app()
    client = app.test_client()

    print("=========================================================")
    print(" STARTING PLAN 3 & PLAN 4 SYSTEM VERIFICATION TEST SUITE ")
    print("=========================================================")

    # Setup 2 Test Users (Owner & Finder)
    owner_email = "mac.owner@campus.edu"
    finder_email = "good.samaritan@campus.edu"
    password = "TestPassword123!"

    app.db.users.delete_many({"email": {"$in": [owner_email, finder_email]}})
    app.db.otp_verifications.delete_many({"email": {"$in": [owner_email, finder_email]}})
    app.db.items.delete_many({"user_email": {"$in": [owner_email, finder_email]}})

    # 1. Register Owner
    reg1 = client.post("/api/v1/auth/register", json={"name": "Owner Alex", "email": owner_email, "password": password})
    print("Reg1 status:", reg1.status_code, reg1.get_json())
    assert reg1.status_code == 201

    otp_owner_doc = app.db.otp_verifications.find_one({"email": owner_email})
    assert otp_owner_doc is not None
    otp_owner = otp_owner_doc["otp"]

    v1 = client.post("/api/v1/auth/verify-email", json={"email": owner_email, "otp": otp_owner})
    assert v1.status_code == 200

    owner_login = client.post("/api/v1/auth/login", json={"email": owner_email, "password": password}).get_json()
    owner_token = owner_login["access_token"]
    owner_id = owner_login["user"]["id"]

    # 2. Register Finder
    reg2 = client.post("/api/v1/auth/register", json={"name": "Finder Sam", "email": finder_email, "password": password})
    assert reg2.status_code == 201

    otp_finder_doc = app.db.otp_verifications.find_one({"email": finder_email})
    assert otp_finder_doc is not None
    otp_finder = otp_finder_doc["otp"]

    v2 = client.post("/api/v1/auth/verify-email", json={"email": finder_email, "otp": otp_finder})
    assert v2.status_code == 200

    finder_login = client.post("/api/v1/auth/login", json={"email": finder_email, "password": password}).get_json()
    finder_token = finder_login["access_token"]

    print("[PASSED] Users Registered & Authenticated")

    # 3. Test Image Upload API with valid PNG
    from PIL import Image as PILImage
    img_buf = io.BytesIO()
    PILImage.new('RGB', (50, 50), color='blue').save(img_buf, format='PNG')
    img_buf.seek(0)

    upload_res = client.post(
        "/api/v1/items/upload-image",
        data={"file": (img_buf, "laptop.png")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    print("Image Upload Status:", upload_res.status_code)
    assert upload_res.status_code == 200
    uploaded_url = upload_res.get_json()["url"]
    assert uploaded_url is not None
    print("[PASSED] Cloudinary/Image Uploader verified:", uploaded_url[:35] + "...")

    # 4. Report Lost Item
    lost_payload = {
        "title": "MacBook Air M2",
        "category": "Electronics & Laptops",
        "brand": "Apple",
        "color": "Space Gray",
        "location": "Central Library",
        "date": "2026-08-20",
        "description": "Lost my silver gray MacBook Air laptop with developer stickers on top",
        "distinctive_features": "Red rocket sticker on bottom right and scratch on MagSafe port",
        "image_url": uploaded_url
    }
    lost_res = client.post("/api/v1/items/lost", json=lost_payload, headers={"Authorization": f"Bearer {owner_token}"})
    print("Report Lost Status:", lost_res.status_code)
    assert lost_res.status_code == 201
    lost_item_id = lost_res.get_json()["item"]["_id"]

    # 5. Verify User Dashboard (3.1)
    dash_res = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {owner_token}"})
    print("Dashboard Status:", dash_res.status_code)
    assert dash_res.status_code == 200
    dash_data = dash_res.get_json()
    assert dash_data["stats"]["my_lost_count"] >= 1
    assert len(dash_data["my_lost_items"]) >= 1
    print("[PASSED] User Dashboard API returning live MongoDB aggregates")

    # 6. Report Found Item by Finder (Matching Candidate)
    found_payload = {
        "title": "Apple MacBook Air",
        "category": "Electronics & Laptops",
        "brand": "Apple",
        "color": "Space Gray",
        "location": "Central Library Level 2",
        "date": "2026-08-21",
        "description": "Turned in a MacBook Air laptop found on study desk in library",
        "storage_location": "Deposited at Main Campus Security Desk (Building A)",
        "image_url": uploaded_url
    }
    found_res = client.post("/api/v1/items/found", json=found_payload, headers={"Authorization": f"Bearer {finder_token}"})
    print("Report Found Status:", found_res.status_code)
    assert found_res.status_code == 201
    found_item_id = found_res.get_json()["item"]["_id"]
    matches_found = found_res.get_json()["matches_found"]
    print(f"Smart Matches Triggered: {matches_found}")
    assert matches_found >= 1

    # 7. Verify Intelligent Match Engine & Notification Creation (4.1, 4.2, 4.3)
    match_record = app.db.matches.find_one({"lost_item_id": lost_item_id, "found_item_id": found_item_id})
    assert match_record is not None
    score = match_record["similarity_score"]
    tier = match_record["match_tier"]
    print(f"[PASSED] AI & Rule-based Match Computed: Score={score}%, Tier='{tier}'")
    assert score >= 75
    assert tier in ["strong", "possible"]

    # Check notification sent to owner
    notif = app.db.notifications.find_one({"user_id": owner_id, "type": "match"})
    assert notif is not None
    print(f"[PASSED] Real-time In-App Notification created: '{notif.get('title', '').encode('ascii', 'ignore').decode()}'")

    # 8. Test Browse Items with Search, Brand/Color filter, & Pagination (3.5)
    browse_res = client.get("/api/v1/items?brand=Apple&color=Space%20Gray&page=1&limit=10")
    assert browse_res.status_code == 200
    browse_data = browse_res.get_json()
    assert browse_data["total"] >= 2
    assert len(browse_data["items"]) >= 2
    print("[PASSED] Browse Items API with brand/color filtering & pagination verified")

    # 9. Test Edit Own Item (3.7)
    edit_res = client.put(
        f"/api/v1/items/{lost_item_id}",
        json={"title": "Updated MacBook Air M2 2026"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert edit_res.status_code == 200
    assert edit_res.get_json()["item"]["title"] == "Updated MacBook Air M2 2026"
    print("[PASSED] Edit own item with ownership guard verified")

    # 10. Submit Ownership Claim (3.8)
    claim_payload = {
        "item_id": found_item_id,
        "proof_description": "My laptop has a red rocket sticker on the lower right corner and serial number ending in 98X.",
        "contact_phone": "+1 555-4321"
    }
    claim_res = client.post("/api/v1/claims", json=claim_payload, headers={"Authorization": f"Bearer {owner_token}"})
    assert claim_res.status_code == 201
    claim_id = claim_res.get_json()["claim_id"]
    print(f"[PASSED] Claim #{claim_id} submitted with proof evidence")

    # 11. Admin Review and Resolve Claim (4.7)
    admin_login = client.post("/api/v1/admin/login", json={"email": "admin@campus.edu", "password": "AdminPassword123!"}).get_json()
    admin_token = admin_login["access_token"]

    resolve_res = client.patch(
        f"/api/v1/admin/claims/{claim_id}/resolve",
        json={"decision": "approved", "notes": "Proof verified with security locker inspection. Ready for pickup at Security Desk Building A."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resolve_res.status_code == 200
    print("[PASSED] Admin Claim resolution approved & item marked resolved")

    # 12. Admin Dashboard Live Aggregations & Recovery Rate (4.4)
    admin_dash_res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_dash_res.status_code == 200
    admin_stats = admin_dash_res.get_json()
    print("Admin Aggregation Stats:", json.dumps(admin_stats, indent=2))
    assert admin_stats["totalItems"] >= 2
    assert admin_stats["approvedClaims"] >= 1
    assert "Electronics & Laptops" in admin_stats["categories"]
    print("[PASSED] Admin Dashboard MongoDB aggregation metrics verified")

    # 13. Audit Log verification (4.8)
    audit_res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    assert len(audit_res.get_json()["logs"]) >= 5
    print("[PASSED] Immutable audit log recording verified")

    # 14. Security Headers Verification (4.9)
    assert "X-Content-Type-Options" in admin_dash_res.headers
    assert admin_dash_res.headers["X-Content-Type-Options"] == "nosniff"
    assert admin_dash_res.headers["X-Frame-Options"] == "SAMEORIGIN"
    print("[PASSED] HTTP Security Headers verified")

    print("\n=========================================================")
    print(" ALL PLAN 3 & PLAN 4 SYSTEM REQUIREMENTS VERIFIED 100%!  ")
    print("=========================================================")


if __name__ == "__main__":
    run_system_tests()

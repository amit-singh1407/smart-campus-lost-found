import json
from app import create_app

def run_tests():
    app = create_app()
    client = app.test_client()

    print("--- 1. Testing Health Endpoint ---")
    res = client.get("/health")
    print("Health Status:", res.status_code, res.get_json())
    assert res.status_code == 200

    test_email = "test.student@campus.edu"
    test_password = "SecurePassword123!"

    # Clean up prior test data
    app.db.users.delete_many({"email": test_email})
    app.db.otp_verifications.delete_many({"email": test_email})

    print("\n--- 2. Testing User Registration ---")
    reg_payload = {
        "name": "Jane Student",
        "email": test_email,
        "password": test_password,
        "student_id": "CS-2026-881",
        "department": "Computer Science",
        "phone": "+1 555-0199"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    print("Register Status:", res.status_code, res.get_json())
    assert res.status_code == 201

    # Verify user in database has email_verified=False
    user_in_db = app.db.users.find_one({"email": test_email})
    assert user_in_db is not None
    assert user_in_db["email_verified"] is False
    assert user_in_db["role"] == "USER"

    # Fetch OTP from db
    otp_record = app.db.otp_verifications.find_one({"email": test_email})
    assert otp_record is not None
    otp_code = otp_record["otp"]
    print("Generated OTP from DB:", otp_code)

    print("\n--- 3. Testing Login BEFORE Email Verification (Should be 403) ---")
    login_payload = {"email": test_email, "password": test_password}
    res = client.post("/api/v1/auth/login", json=login_payload)
    print("Unverified Login Status:", res.status_code, res.get_json())
    assert res.status_code == 403

    print("\n--- 4. Testing OTP Email Verification ---")
    verify_payload = {"email": test_email, "otp": otp_code}
    res = client.post("/api/v1/auth/verify-email", json=verify_payload)
    print("Verify Email Status:", res.status_code, res.get_json())
    assert res.status_code == 200

    # User in db should now have email_verified=True and account_status=active
    user_in_db = app.db.users.find_one({"email": test_email})
    assert user_in_db["email_verified"] is True
    assert user_in_db["account_status"] == "active"

    print("\n--- 5. Testing Login AFTER Email Verification ---")
    res = client.post("/api/v1/auth/login", json=login_payload)
    print("Verified Login Status:", res.status_code)
    login_data = res.get_json()
    assert res.status_code == 200
    access_token = login_data["access_token"]
    assert access_token is not None
    print("Received JWT token successfully.")

    print("\n--- 6. Testing Authenticated /auth/me Endpoint ---")
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    print("/auth/me Status:", res.status_code, res.get_json())
    assert res.status_code == 200
    assert res.get_json()["user"]["email"] == test_email

    print("\n--- 7. Testing Admin Authentication (/admin/login) ---")
    admin_login_res = client.post(
        "/api/v1/admin/login",
        json={"email": "admin@campus.edu", "password": "AdminPassword123!"}
    )
    print("Admin Login Status:", admin_login_res.status_code)
    admin_data = admin_login_res.get_json()
    assert admin_login_res.status_code == 200
    admin_token = admin_data["access_token"]

    print("\n--- 8. Testing Protected Admin Stats with Admin Token ---")
    stats_res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    print("Admin Stats Status:", stats_res.status_code, stats_res.get_json())
    assert stats_res.status_code == 200

    print("\n--- 9. Testing Admin Protection: Normal User Token on Admin Route (Should be 403) ---")
    forbidden_res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {access_token}"})
    print("Forbidden Access Status:", forbidden_res.status_code, forbidden_res.get_json())
    assert forbidden_res.status_code == 403

    print("\n==============================================")
    print(" ALL PLAN 2 BACKEND AUTH & SECURITY TESTS PASSED! ")
    print("==============================================")


if __name__ == "__main__":
    run_tests()

"""Quick test script to verify Resend email integration."""
import os
import sys

# Load .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

api_key    = os.getenv("RESEND_API_KEY", "")
from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
from_name  = os.getenv("RESEND_FROM_NAME", "Smart Campus Lost and Found")
# Recipient: first command-line argument, otherwise yourself
# e.g. python test_resend.py friend@example.com
to_email   = sys.argv[1] if len(sys.argv) > 1 else os.getenv("EMAIL_USERNAME", "")

print("=" * 55)
print("  Resend Email Integration Test")
print("=" * 55)
print(f"  API Key   : {'SET ✓ (' + api_key[:8] + '...)' if api_key else 'NOT SET ✗'}")
print(f"  From      : {from_name} <{from_email}>")
print(f"  To (test) : {to_email}")
print("=" * 55)

if not api_key:
    print("\n[FAIL] RESEND_API_KEY is not set in .env")
    sys.exit(1)

if not to_email:
    print("\n[FAIL] EMAIL_USERNAME (recipient) is not set in .env")
    sys.exit(1)

try:
    import resend
    resend.api_key = api_key

    params: resend.Emails.SendParams = {
        "from": f"{from_name} <{from_email}>",
        "to":   [to_email],
        "subject": "✅ Smart Campus — Resend Test Email",
        "html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                    padding: 24px; border-radius: 12px; background:#0b0f19; color:#f8fafc;
                    border: 1px solid #1e293b;">
            <h2 style="color:#60a5fa; text-align:center;">Smart Campus Lost &amp; Found</h2>
            <div style="background:#1e293b; border-radius:8px; padding:20px; text-align:center; margin:20px 0;">
                <p style="color:#94a3b8; font-size:14px;">Resend Integration Test</p>
                <h1 style="color:#38bdf8; font-size:48px; letter-spacing:10px; font-family:monospace;">
                    1 2 3 4 5 6
                </h1>
                <p style="color:#64748b; font-size:12px;">This is a test OTP code — not a real one.</p>
            </div>
            <p style="color:#64748b; font-size:12px; text-align:center;">
                If you received this, Resend is working correctly! 🎉
            </p>
        </div>
        """,
    }

    print("\n[...] Sending test email via Resend ...")
    response = resend.Emails.send(params)
    email_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", response)
    print(f"\n[SUCCESS] Email sent successfully!")
    print(f"     Email ID : {email_id}")
    print(f"     Check inbox: {to_email}")

except Exception as e:
    print(f"\n[FAIL] Error: {e}")
    sys.exit(1)

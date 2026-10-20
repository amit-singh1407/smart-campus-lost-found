import os
import logging
import resend

logger = logging.getLogger("smart_campus")

# Initialize Resend API key once at module load
resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FROM_NAME  = os.getenv("RESEND_FROM_NAME",  "Smart Campus Lost and Found")
FROM_FULL  = f"{FROM_NAME} <{FROM_EMAIL}>"


def send_verification_email(recipient_email: str, otp: str, name: str = "", purpose: str = "verify") -> bool:
    """Send a 6-digit OTP code via Resend.

    purpose: "verify" for signup email verification, "reset" for password reset.
    Returns True only if Resend accepted the email; callers must check this.

    SECURITY: The raw OTP is NEVER printed, logged, or returned to callers.
    Only non-sensitive metadata (recipient address, email delivery ID) is logged.
    """
    # Redacted log — no OTP value in output
    logger.info(f"[EMAIL] Dispatching {purpose} OTP email to {recipient_email}")

    if not resend.api_key:
        logger.error("[EMAIL] [ERROR] RESEND_API_KEY not configured. OTP email NOT sent.")
        return False

    if purpose == "reset":
        heading = "Password Reset"
        subject = "Smart Campus — Password Reset Code"
    else:
        heading = "Email Verification"
        subject = "Smart Campus — Email Verification Code"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;
                border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0b0f19; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0;">Smart Campus Lost &amp; Found</h2>
            <p style="color: #94a3b8; font-size: 14px;">{heading}</p>
        </div>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 8px;">
                Hello {name or 'Student'}, your 6-Digit One-Time Password is:
            </p>
            <h1 style="color: #38bdf8; font-size: 36px; letter-spacing: 8px; margin: 10px 0; font-family: monospace;">
                {otp}
            </h1>
            <p style="color: #94a3b8; font-size: 12px;">This code is valid for 15 minutes.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">
            If you did not request this email, you can safely ignore it.
        </p>
    </div>
    """

    try:
        params: resend.Emails.SendParams = {
            "from": FROM_FULL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info(f"[EMAIL] [OK] {purpose} OTP email sent to {recipient_email} | id={response.get('id')}")
        return True

    except Exception as e:
        # Log the error only — never log the OTP in the exception handler
        logger.error(f"[EMAIL] [ERROR] Resend error sending verification to {recipient_email}: {e}")
        return False


def send_match_notification_email(
    recipient_email: str,
    name: str,
    lost_item_title: str,
    found_item_title: str,
    match_score: int,
    match_tier: str,
) -> bool:
    """Send an email notification when a potential match is found."""

    print(f"\n=======================================================")
    print(f" [EMAIL MATCH NOTIFICATION] -> {recipient_email}")
    print(f" LOST ITEM:  {lost_item_title}")
    print(f" FOUND ITEM: {found_item_title}")
    print(f" SCORE:      {match_score}% ({match_tier})")
    print(f"=======================================================\n")

    if not resend.api_key:
        print("[EMAIL] WARNING: RESEND_API_KEY not set. Match notification not sent.")
        logger.warning("RESEND_API_KEY not configured. Match email NOT sent.")
        return True

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;
                border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0b0f19; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0;">Smart Campus Lost &amp; Found</h2>
            <p style="color: #94a3b8; font-size: 14px;">Potential Match Found!</p>
        </div>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 8px;">Hello {name or 'Student'},</p>
            <p style="color: #cbd5e1; font-size: 14px;">
                We found a potential match for your lost item <strong>{lost_item_title}</strong>.
            </p>
            <p style="color: #cbd5e1; font-size: 14px;">
                A newly reported found item <strong>{found_item_title}</strong> matches your description
                with a score of <strong>{match_score}%</strong> ({match_tier} match).
            </p>
            <br>
            <p style="color: #cbd5e1; font-size: 14px;">
                Please log in to the Smart Campus system and review the related campus reports to verify if this is your item.
            </p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">
            If you did not request this email, you can safely ignore it.
        </p>
    </div>
    """

    try:
        params: resend.Emails.SendParams = {
            "from": FROM_FULL,
            "to": [recipient_email],
            "subject": f"Smart Campus: Potential Match for your '{lost_item_title}'",
            "html": html_body,
        }
        response = resend.Emails.send(params)
        print(f"[EMAIL] [OK] Match notification sent to {recipient_email} | id={response.get('id')}")
        logger.info(f"Match notification sent to {recipient_email} | id={response.get('id')}")
        return True

    except Exception as e:
        print(f"\n[EMAIL] [ERROR] Failed to send match notification: {e}")
        logger.error(f"Resend error sending match notification to {recipient_email}: {e}")
        return False

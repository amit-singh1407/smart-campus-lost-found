import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger("smart_campus")


def send_verification_email(recipient_email: str, otp: str, name: str = "") -> bool:
    """Send a 6-digit OTP verification code via SMTP email or fallback to console log."""
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port = int(os.getenv("EMAIL_PORT", 587))
    username = os.getenv("EMAIL_USERNAME", "")
    password = os.getenv("EMAIL_PASSWORD", "")

    # Always log OTP to server output for instant local testing / fallback
    print(f"\n=======================================================")
    print(f" [EMAIL OTP DISPATCH] -> {recipient_email}")
    print(f" OTP CODE: {otp}")
    print(f" RECIPIENT: {name or recipient_email}")
    print(f"=======================================================\n")

    if not username or not password:
        print("[EMAIL] WARNING: SMTP credentials not set. OTP only available in console above.")
        logger.warning("SMTP credentials not fully configured. Email NOT sent.")
        return True  # Fallback: OTP is readable from console

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Smart Campus Verification Code: {otp}"
        msg["From"] = f"Smart Campus System <{username}>"
        msg["To"] = recipient_email

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0b0f19; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #60a5fa; margin: 0;">Smart Campus Lost &amp; Found</h2>
                <p style="color: #94a3b8; font-size: 14px;">Email Verification</p>
            </div>
            <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 8px;">Your 6-Digit One-Time Password:</p>
                <h1 style="color: #38bdf8; font-size: 36px; letter-spacing: 8px; margin: 10px 0; font-family: monospace;">{otp}</h1>
                <p style="color: #94a3b8; font-size: 12px;">This code is valid for 15 minutes.</p>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center;">
                If you did not request this email, you can safely ignore it.
            </p>
        </div>
        """

        msg.attach(MIMEText(html_body, "html"))

        print(f"[EMAIL] Connecting to {host}:{port} as {username} ...", flush=True)
        with smtplib.SMTP(host, port, timeout=5) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(username, password)
            server.send_message(msg)

        print(f"[EMAIL] [OK] Verification email sent successfully to {recipient_email}")
        logger.info(f"Verification email sent successfully to {recipient_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        print(f"\n[EMAIL] [ERROR] SMTP AUTHENTICATION FAILED!")
        print(f"[EMAIL]   Error: {e}")
        print(f"[EMAIL]   Check your EMAIL_USERNAME and EMAIL_PASSWORD in .env")
        print(f"[EMAIL]   For Gmail: use a 16-character App Password (not your regular password)")
        print(f"[EMAIL]   Generate one at: https://myaccount.google.com/apppasswords")
        print(f"[EMAIL]   OTP is still available in the console above.\n")
        logger.error(f"SMTP auth failed: {e}")
        return False  # Signal that email was NOT delivered

    except smtplib.SMTPException as e:
        print(f"\n[EMAIL] [ERROR] SMTP error: {e}")
        print(f"[EMAIL]   OTP is still available in the console above.\n")
        logger.error(f"SMTP error sending to {recipient_email}: {e}")
        return False

    except Exception as e:
        print(f"\n[EMAIL] [ERROR] Unexpected error sending email: {e}")
        print(f"[EMAIL]   OTP is still available in the console above.\n")
        logger.error(f"Unexpected email error: {e}")
        return False


def send_match_notification_email(recipient_email: str, name: str, lost_item_title: str, found_item_title: str, match_score: int, match_tier: str) -> bool:
    """Send an email notification when a potential match is found."""
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port = int(os.getenv("EMAIL_PORT", 587))
    username = os.getenv("EMAIL_USERNAME", "")
    password = os.getenv("EMAIL_PASSWORD", "")

    print(f"\n=======================================================")
    print(f" [EMAIL MATCH NOTIFICATION] -> {recipient_email}")
    print(f" LOST ITEM: {lost_item_title}")
    print(f" FOUND ITEM: {found_item_title}")
    print(f" SCORE: {match_score}% ({match_tier})")
    print(f"=======================================================\n")

    if not username or not password:
        print("[EMAIL] WARNING: SMTP credentials not set. Notification not sent.")
        logger.warning("SMTP credentials not fully configured. Match email NOT sent.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Smart Campus: Potential Match for your '{lost_item_title}'"
        msg["From"] = f"Smart Campus System <{username}>"
        msg["To"] = recipient_email

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0b0f19; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #60a5fa; margin: 0;">Smart Campus Lost &amp; Found</h2>
                <p style="color: #94a3b8; font-size: 14px;">Potential Match Found!</p>
            </div>
            <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 8px;">Hello {name or 'Student'},</p>
                <p style="color: #cbd5e1; font-size: 14px;">We found a potential match for your lost item <strong>{lost_item_title}</strong>.</p>
                <p style="color: #cbd5e1; font-size: 14px;">A newly reported found item <strong>{found_item_title}</strong> matches your description with a score of {match_score}% ({match_tier} match).</p>
                <br>
                <p style="color: #cbd5e1; font-size: 14px;">Please log in to the Smart Campus system and review the related campus reports to verify if this is your item.</p>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center;">
                If you did not request this email, you can safely ignore it.
            </p>
        </div>
        """

        msg.attach(MIMEText(html_body, "html"))

        print(f"[EMAIL] Connecting to {host}:{port} as {username} ...", flush=True)
        with smtplib.SMTP(host, port, timeout=5) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(username, password)
            server.send_message(msg)

        print(f"[EMAIL] [OK] Match notification email sent successfully to {recipient_email}")
        logger.info(f"Match notification email sent successfully to {recipient_email}")
        return True

    except Exception as e:
        print(f"\n[EMAIL] [ERROR] Unexpected error sending match notification: {e}")
        logger.error(f"Unexpected email error: {e}")
        return False


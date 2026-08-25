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

    # Always log OTP to server output for instant local testing
    print(f"\n=======================================================")
    print(f" [EMAIL OTP DISPATCH] -> {recipient_email}")
    print(f" OTP CODE: {otp}")
    print(f" RECIPIENT: {name or recipient_email}")
    print(f"=======================================================\n")

    if not username or not password:
        logger.info(f"SMTP credentials not fully set. OTP code is logged: {otp}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Smart Campus Verification Code: {otp}"
        msg["From"] = f"Smart Campus System <{username}>"
        msg["To"] = recipient_email

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0b0f19; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #60a5fa; margin: 0;">Smart Campus Lost & Found</h2>
                <p style="color: #94a3b8; font-size: 14px;">Campus Verification Protocol</p>
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

        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)

        logger.info(f"Verification email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP: {e}. (Console OTP is still valid).")
        return True

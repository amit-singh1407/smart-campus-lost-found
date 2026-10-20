import hmac
import hashlib
import os

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

# Argon2 password hasher instance
ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=2,
    hash_len=32,
    salt_len=16,
)

# Secret used for HMAC-SHA256 OTP hashing (never stored in logs or DB as plaintext)
_OTP_SECRET = os.getenv("OTP_SECRET_KEY", "sc-otp-hmac-fallback-secret").encode("utf-8")


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return ph.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Verify an Argon2 password hash against plain text password."""
    try:
        return ph.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def hash_otp(otp: str) -> str:
    """Return a hex HMAC-SHA256 digest of the OTP.

    The raw OTP is NEVER stored in the database or written to any log.
    Only this digest is persisted; verification is done by hashing the
    candidate and doing a constant-time comparison.
    """
    return hmac.new(_OTP_SECRET, otp.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_otp(stored_hash: str, candidate_otp: str) -> bool:
    """Constant-time comparison of a stored HMAC digest against a candidate OTP."""
    expected = hash_otp(candidate_otp)
    return hmac.compare_digest(stored_hash, expected)

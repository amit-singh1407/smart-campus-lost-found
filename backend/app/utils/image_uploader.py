import os
import io
import base64
import logging
import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename
from PIL import Image

logger = logging.getLogger("smart_campus")

# Whitelist allowed extensions and maximum file size (5MB)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def image_perceptual_hash(file_bytes: bytes) -> str:
    """Return a compact average hash for approximate image comparisons."""
    image = Image.open(io.BytesIO(file_bytes)).convert("L").resize((8, 8))
    pixels = list(image.getdata())
    average = sum(pixels) / len(pixels)
    return "".join("1" if pixel >= average else "0" for pixel in pixels)


def init_cloudinary():
    """Initialize Cloudinary SDK with environment credentials."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.getenv("CLOUDINARY_API_KEY", "")
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "")

    if cloud_name and api_key and api_secret:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )
        return True
    return False


def allowed_file(filename: str) -> bool:
    """Check whether filename has an allowed image extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_image_file(file_storage) -> dict:
    """Validate and upload an image to Cloudinary (with fallback handling)."""
    if not file_storage or not file_storage.filename:
        return {"error": "No file selected for upload", "status_code": 400}

    filename = secure_filename(file_storage.filename)
    if not allowed_file(filename):
        return {
            "error": "Invalid file format. Allowed formats: PNG, JPG, JPEG, WEBP.",
            "status_code": 400,
        }

    # Read and validate file content
    file_bytes = file_storage.read()
    if len(file_bytes) > MAX_IMAGE_SIZE:
        return {
            "error": "File size exceeds the 5MB limit.",
            "status_code": 400,
        }

    # Verify it is a valid image using PIL
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()
    except Exception:
        return {"error": "Corrupted or invalid image file.", "status_code": 400}

    # Reset file pointer for uploading
    file_storage.seek(0)
    image_hash = image_perceptual_hash(file_bytes)

    # Attempt Cloudinary upload
    cloudinary_ready = init_cloudinary()
    if cloudinary_ready:
        try:
            upload_result = cloudinary.uploader.upload(
                file_storage,
                folder="smart_campus/items",
                resource_type="image",
            )
            secure_url = upload_result.get("secure_url")
            if secure_url:
                return {"url": secure_url, "public_id": upload_result.get("public_id"), "image_hash": image_hash, "status_code": 200}
        except Exception as e:
            logger.warning(f"Cloudinary upload error: {e}. Generating base64 fallback.")

    # Fallback: create base64 data URI if Cloudinary is unavailable
    ext = filename.rsplit(".", 1)[1].lower()
    mime = f"image/{ext if ext != 'jpg' else 'jpeg'}"
    b64_str = base64.b64encode(file_bytes).decode("utf-8")
    data_uri = f"data:{mime};base64,{b64_str}"

    return {"url": data_uri, "image_hash": image_hash, "status_code": 200}

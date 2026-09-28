from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserRegisterSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    student_id: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailSchema(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)


class ResendOtpSchema(BaseModel):
    email: EmailStr


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)


class ItemCreateSchema(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    category: str
    brand: Optional[str] = ""
    color: Optional[str] = ""
    location: str
    date: Optional[str] = None
    description: Optional[str] = ""
    distinctive_features: Optional[str] = ""
    private_verification_questions: Optional[str] = ""  # Hidden from public, used in claim verification
    storage_location: Optional[str] = ""
    storage_shelf: Optional[str] = ""  # e.g., "Shelf B"
    storage_locker: Optional[str] = ""  # e.g., "Locker 17"
    is_high_value: Optional[bool] = False
    image_url: Optional[str] = ""
    image_hash: Optional[str] = ""
    type: str = Field(..., pattern="^(lost|found)$")
    
    # New fields for Found Item Recovery Flow
    matched_lost_item_id: Optional[str] = None
    found_by: Optional[str] = None
    found_location: Optional[str] = None
    found_at: Optional[str] = None
    found_image: Optional[str] = None
    delivery_method: Optional[str] = None
    delivery_status: Optional[str] = None
    received_by_admin: Optional[str] = None
    received_at: Optional[str] = None


class ItemUpdateSchema(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    distinctive_features: Optional[str] = None
    private_verification_questions: Optional[str] = None
    storage_location: Optional[str] = None
    storage_shelf: Optional[str] = None
    storage_locker: Optional[str] = None
    is_high_value: Optional[bool] = None
    image_url: Optional[str] = None
    image_hash: Optional[str] = None
    status: Optional[str] = None
    
    # New fields for Found Item Recovery Flow
    matched_lost_item_id: Optional[str] = None
    found_by: Optional[str] = None
    found_location: Optional[str] = None
    found_at: Optional[str] = None
    found_image: Optional[str] = None
    delivery_method: Optional[str] = None
    delivery_status: Optional[str] = None
    received_by_admin: Optional[str] = None
    received_at: Optional[str] = None

class FoundItemSubmitSchema(BaseModel):
    matched_lost_item_id: str
    found_location: str
    delivery_method: str = Field(..., pattern="^(LOST_FOUND_CENTER|CURRENTLY_HAVE_IT)$")
    found_image: Optional[str] = None
    found_at: Optional[datetime] = None


class ClaimCreateSchema(BaseModel):
    item_id: str
    proof_description: str = Field(..., min_length=5)
    contact_phone: Optional[str] = ""
    evidence_image_url: Optional[str] = ""
    answers_to_private_questions: Optional[str] = ""


class ClaimResolveSchema(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected|completed|request_info)$")
    notes: Optional[str] = ""


class AssistantChatSchema(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)
    language: Optional[str] = "en"


class QualityAnalyzeSchema(BaseModel):
    title: Optional[str] = ""
    category: Optional[str] = ""
    brand: Optional[str] = ""
    color: Optional[str] = ""
    location: Optional[str] = ""
    description: Optional[str] = ""
    distinctive_features: Optional[str] = ""
    has_image: Optional[bool] = False
    type: Optional[str] = "lost"


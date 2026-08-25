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
    storage_location: Optional[str] = ""
    image_url: Optional[str] = ""
    type: str = Field(..., pattern="^(lost|found)$")


class ItemUpdateSchema(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    distinctive_features: Optional[str] = None
    storage_location: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


class ClaimCreateSchema(BaseModel):
    item_id: str
    proof_description: str = Field(..., min_length=5)
    contact_phone: Optional[str] = ""
    evidence_image_url: Optional[str] = ""


class ClaimResolveSchema(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected|completed|request_info)$")
    notes: Optional[str] = ""

from datetime import date, datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole, PlanType


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.BAILLEUR


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: UserRole
    plan: PlanType
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    avatar_url: str | None = None
    date_naissance: date | None = None
    adresse: str | None = None
    cni_numero: str | None = None
    cni_url: str | None = None
    cni_date_delivrance: date | None = None
    cni_lieu_delivrance: str | None = None


class UserUpdatePlan(BaseModel):
    plan: PlanType


class UserUpdateActive(BaseModel):
    is_active: bool


class UpdateProfileRequest(BaseModel):
    full_name: str
    phone: str | None = None
    date_naissance: date | None = None
    adresse: str | None = None
    cni_numero: str | None = None
    cni_date_delivrance: date | None = None
    cni_lieu_delivrance: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

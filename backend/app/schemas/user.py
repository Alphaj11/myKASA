from datetime import datetime

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
    created_at: datetime


class UserUpdatePlan(BaseModel):
    plan: PlanType


class UserUpdateActive(BaseModel):
    is_active: bool

import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    BAILLEUR = "BAILLEUR"
    LOCATAIRE = "LOCATAIRE"
    GESTIONNAIRE = "GESTIONNAIRE"


class PlanType(str, enum.Enum):
    FREEMIUM = "FREEMIUM"
    PREMIUM = "PREMIUM"
    AGENCE = "AGENCE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.BAILLEUR)
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType), nullable=False, default=PlanType.FREEMIUM)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    code_locataire: Mapped[str | None] = mapped_column(String(10), unique=True, nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    date_naissance: Mapped[date | None] = mapped_column(Date, nullable=True)
    adresse: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cni_numero: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cni_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cni_date_delivrance: Mapped[date | None] = mapped_column(Date, nullable=True)
    cni_lieu_delivrance: Mapped[str | None] = mapped_column(String(255), nullable=True)

    immeubles = relationship("Immeuble", back_populates="bailleur", cascade="all, delete-orphan")
    locataire_profile = relationship(
        "Locataire", back_populates="utilisateur", uselist=False, foreign_keys="Locataire.utilisateur_id"
    )

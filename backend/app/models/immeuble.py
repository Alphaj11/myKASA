from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Immeuble(Base):
    __tablename__ = "immeubles"

    id: Mapped[int] = mapped_column(primary_key=True)
    bailleur_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    adresse: Mapped[str] = mapped_column(String(500), nullable=False)
    ville: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type_bien: Mapped[str | None] = mapped_column(String(100), nullable=True)
    superficie_totale: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    annee_construction: Mapped[int | None] = mapped_column(Integer, nullable=True)
    photo_principale_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_level: Mapped[int] = mapped_column(Integer, default=0)
    declaration_acceptee: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bailleur = relationship("User", back_populates="immeubles")
    logements = relationship("Logement", back_populates="immeuble", cascade="all, delete-orphan")

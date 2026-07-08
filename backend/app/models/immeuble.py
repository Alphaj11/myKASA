from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Immeuble(Base):
    __tablename__ = "immeubles"

    id: Mapped[int] = mapped_column(primary_key=True)
    bailleur_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    adresse: Mapped[str] = mapped_column(String(500), nullable=False)
    ville: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bailleur = relationship("User", back_populates="immeubles")
    logements = relationship("Logement", back_populates="immeuble", cascade="all, delete-orphan")

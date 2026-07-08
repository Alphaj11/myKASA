from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Locataire(Base):
    __tablename__ = "locataires"

    id: Mapped[int] = mapped_column(primary_key=True)
    bailleur_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    utilisateur_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    logement_id: Mapped[int | None] = mapped_column(ForeignKey("logements.id"), nullable=True)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    prenom: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    piece_identite: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    logement = relationship("Logement", back_populates="locataires", foreign_keys=[logement_id])
    utilisateur = relationship("User", back_populates="locataire_profile", foreign_keys=[utilisateur_id])
    contrats = relationship("Contrat", back_populates="locataire")

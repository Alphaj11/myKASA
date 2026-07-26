import enum
from datetime import datetime, date

from sqlalchemy import String, DateTime, Date, Enum, ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StatutContrat(str, enum.Enum):
    EN_ATTENTE_SIGNATURE = "EN_ATTENTE_SIGNATURE"
    ACTIF = "ACTIF"
    ARCHIVE = "ARCHIVE"
    RESILIE = "RESILIE"


class Contrat(Base):
    __tablename__ = "contrats"

    id: Mapped[int] = mapped_column(primary_key=True)
    bailleur_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    logement_id: Mapped[int] = mapped_column(ForeignKey("logements.id"), nullable=False)
    locataire_id: Mapped[int] = mapped_column(ForeignKey("locataires.id"), nullable=False)
    date_debut: Mapped[date] = mapped_column(Date, nullable=False)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    loyer_mensuel: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    jour_paiement: Mapped[int] = mapped_column(Integer, default=1)
    depot_garantie: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    statut: Mapped[StatutContrat] = mapped_column(Enum(StatutContrat), default=StatutContrat.ACTIF)
    duree_mois: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lieu_signature: Mapped[str | None] = mapped_column(String(255), nullable=True)
    juridiction: Mapped[str | None] = mapped_column(String(255), nullable=True)
    signature_bailleur_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    signature_locataire_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    logement = relationship("Logement", back_populates="contrats")
    locataire = relationship("Locataire", back_populates="contrats")
    paiements = relationship("Paiement", back_populates="contrat", cascade="all, delete-orphan")

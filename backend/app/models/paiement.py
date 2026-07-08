import enum
from datetime import datetime, date

from sqlalchemy import String, DateTime, Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ModePaiement(str, enum.Enum):
    ESPECES = "ESPECES"
    VIREMENT = "VIREMENT"
    MOBILE_MONEY = "MOBILE_MONEY"
    AUTRE = "AUTRE"


class Paiement(Base):
    __tablename__ = "paiements"

    id: Mapped[int] = mapped_column(primary_key=True)
    contrat_id: Mapped[int] = mapped_column(ForeignKey("contrats.id"), nullable=False)
    montant: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    periode: Mapped[str] = mapped_column(String(7), nullable=False)  # format "YYYY-MM"
    date_paiement: Mapped[date] = mapped_column(Date, default=date.today)
    mode_paiement: Mapped[ModePaiement] = mapped_column(Enum(ModePaiement), default=ModePaiement.ESPECES)
    commentaire: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    contrat = relationship("Contrat", back_populates="paiements")
    quittance = relationship("Quittance", back_populates="paiement", uselist=False, cascade="all, delete-orphan")

from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Quittance(Base):
    __tablename__ = "quittances"

    id: Mapped[int] = mapped_column(primary_key=True)
    paiement_id: Mapped[int] = mapped_column(ForeignKey("paiements.id"), unique=True, nullable=False)
    numero: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    pdf_path: Mapped[str] = mapped_column(String(500), nullable=False)
    genere_le: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    paiement = relationship("Paiement", back_populates="quittance")

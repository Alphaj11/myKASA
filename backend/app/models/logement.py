import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TypeLogement(str, enum.Enum):
    STUDIO = "STUDIO"
    APPARTEMENT = "APPARTEMENT"
    MAISON = "MAISON"
    CHAMBRE = "CHAMBRE"


class StatutLogement(str, enum.Enum):
    VACANT = "VACANT"
    OCCUPE = "OCCUPE"


class Logement(Base):
    __tablename__ = "logements"

    id: Mapped[int] = mapped_column(primary_key=True)
    immeuble_id: Mapped[int] = mapped_column(ForeignKey("immeubles.id"), nullable=False)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[TypeLogement] = mapped_column(Enum(TypeLogement), nullable=False)
    loyer_mensuel: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    statut: Mapped[StatutLogement] = mapped_column(Enum(StatutLogement), default=StatutLogement.VACANT)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    immeuble = relationship("Immeuble", back_populates="logements")
    locataires = relationship("Locataire", back_populates="logement")
    contrats = relationship("Contrat", back_populates="logement")

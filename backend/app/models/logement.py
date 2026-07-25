import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TypeLogement(str, enum.Enum):
    STUDIO = "STUDIO"
    APPARTEMENT = "APPARTEMENT"
    MAISON = "MAISON"
    CHAMBRE = "CHAMBRE"
    VILLA = "VILLA"
    BUREAU = "BUREAU"


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
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    superficie: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    etage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nb_chambres: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nb_salles_de_bain: Mapped[int | None] = mapped_column(Integer, nullable=True)
    meuble: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_principale_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    immeuble = relationship("Immeuble", back_populates="logements")
    locataires = relationship("Locataire", back_populates="logement")
    contrats = relationship("Contrat", back_populates="logement")

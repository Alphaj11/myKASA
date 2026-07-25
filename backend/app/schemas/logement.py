from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.logement import TypeLogement, StatutLogement


class LogementBase(BaseModel):
    nom: str
    type: TypeLogement
    loyer_mensuel: float
    description: str | None = None
    superficie: float | None = None
    etage: int | None = None
    nb_chambres: int | None = None
    nb_salles_de_bain: int | None = None
    meuble: bool = False


class LogementCreate(LogementBase):
    immeuble_id: int


class LogementUpdate(BaseModel):
    nom: str | None = None
    type: TypeLogement | None = None
    loyer_mensuel: float | None = None
    statut: StatutLogement | None = None
    description: str | None = None
    superficie: float | None = None
    etage: int | None = None
    nb_chambres: int | None = None
    nb_salles_de_bain: int | None = None
    meuble: bool | None = None


class LogementRead(LogementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    immeuble_id: int
    statut: StatutLogement
    photo_principale_url: str | None = None
    created_at: datetime

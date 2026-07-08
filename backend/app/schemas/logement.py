from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.logement import TypeLogement, StatutLogement


class LogementBase(BaseModel):
    nom: str
    type: TypeLogement
    loyer_mensuel: float


class LogementCreate(LogementBase):
    immeuble_id: int


class LogementUpdate(BaseModel):
    nom: str | None = None
    type: TypeLogement | None = None
    loyer_mensuel: float | None = None
    statut: StatutLogement | None = None


class LogementRead(LogementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    immeuble_id: int
    statut: StatutLogement
    created_at: datetime

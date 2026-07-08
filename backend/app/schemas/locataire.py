from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LocataireBase(BaseModel):
    nom: str
    prenom: str
    email: str | None = None
    telephone: str | None = None
    piece_identite: str | None = None


class LocataireCreate(LocataireBase):
    logement_id: int | None = None


class LocataireUpdate(BaseModel):
    nom: str | None = None
    prenom: str | None = None
    email: str | None = None
    telephone: str | None = None
    piece_identite: str | None = None
    logement_id: int | None = None


class LocataireRead(LocataireBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bailleur_id: int
    logement_id: int | None
    created_at: datetime

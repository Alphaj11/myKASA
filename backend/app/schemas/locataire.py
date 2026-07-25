from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class LocataireBase(BaseModel):
    nom: str
    prenom: str
    email: str | None = None
    telephone: str | None = None
    piece_identite: str | None = None
    date_naissance: date | None = None
    adresse: str | None = None
    cni_numero: str | None = None
    profession: str | None = None
    employeur: str | None = None


class LocataireCreate(LocataireBase):
    logement_id: int | None = None


class LocataireUpdate(BaseModel):
    nom: str | None = None
    prenom: str | None = None
    email: str | None = None
    telephone: str | None = None
    piece_identite: str | None = None
    logement_id: int | None = None
    date_naissance: date | None = None
    adresse: str | None = None
    cni_numero: str | None = None
    profession: str | None = None
    employeur: str | None = None


class LocataireRead(LocataireBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bailleur_id: int
    logement_id: int | None
    photo_url: str | None = None
    created_at: datetime

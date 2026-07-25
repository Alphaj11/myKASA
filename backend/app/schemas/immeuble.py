from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImmeubleBase(BaseModel):
    nom: str
    adresse: str
    ville: str
    description: str | None = None
    type_bien: str | None = None
    superficie_totale: float | None = None
    annee_construction: int | None = None


class ImmeubleCreate(ImmeubleBase):
    declaration_acceptee: bool = False


class ImmeubleUpdate(BaseModel):
    nom: str | None = None
    adresse: str | None = None
    ville: str | None = None
    description: str | None = None
    type_bien: str | None = None
    superficie_totale: float | None = None
    annee_construction: int | None = None


class ImmeubleRead(ImmeubleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bailleur_id: int
    photo_principale_url: str | None = None
    verification_level: int = 0
    declaration_acceptee: bool = False
    created_at: datetime
    nb_logements: int = 0

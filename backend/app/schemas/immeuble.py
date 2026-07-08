from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImmeubleBase(BaseModel):
    nom: str
    adresse: str
    ville: str


class ImmeubleCreate(ImmeubleBase):
    pass


class ImmeubleUpdate(BaseModel):
    nom: str | None = None
    adresse: str | None = None
    ville: str | None = None


class ImmeubleRead(ImmeubleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bailleur_id: int
    created_at: datetime
    nb_logements: int = 0

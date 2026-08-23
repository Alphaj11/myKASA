from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


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
    lieu_naissance: str | None = None
    nationalite: str | None = None
    statut_matrimonial: str | None = None
    nb_enfants: int | None = None


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
    lieu_naissance: str | None = None
    nationalite: str | None = None
    statut_matrimonial: str | None = None
    nb_enfants: int | None = None


class LocataireRead(LocataireBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bailleur_id: int
    logement_id: int | None
    utilisateur_id: int | None = None
    photo_url: str | None = None
    created_at: datetime
    lieu_naissance: str | None = None
    nationalite: str | None = None
    statut_matrimonial: str | None = None
    nb_enfants: int | None = None


class UtilisateurPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    utilisateur_id: int
    full_name: str
    email: str
    phone: str | None = None
    avatar_url: str | None = None
    code_locataire: str


class LocataireDepuisCodeCreate(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)
    logement_id: int | None = None
    date_entree: date | None = None
    loyer_mensuel: float | None = None
    depot_garantie: float | None = None
    jour_paiement: int = 1

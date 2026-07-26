from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.contrat import StatutContrat


class ContratBase(BaseModel):
    logement_id: int
    locataire_id: int
    date_debut: date
    date_fin: date | None = None
    loyer_mensuel: float
    jour_paiement: int = 1
    depot_garantie: float | None = None
    duree_mois: int | None = None
    lieu_signature: str | None = None
    juridiction: str | None = None


class ContratCreate(ContratBase):
    pass


class ContratUpdate(BaseModel):
    date_fin: date | None = None
    statut: StatutContrat | None = None
    duree_mois: int | None = None
    lieu_signature: str | None = None
    juridiction: str | None = None


class ContratRead(ContratBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bailleur_id: int
    statut: StatutContrat
    pdf_path: str | None
    signature_bailleur_url: str | None = None
    signature_locataire_url: str | None = None
    created_at: datetime
    en_retard: bool = False

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.contrat import StatutContrat


class PayerLoyerPayload(BaseModel):
    contrat_id: int
    periode: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # YYYY-MM
    utiliser_points: bool = False


class PayerLoyerResult(BaseModel):
    paiement_id: int
    montant_paye: float
    points_utilises: int
    points_gagnes: int
    points_disponibles: int
    points_cumules: int
    message: str


class MaFicheLocataire(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str | None
    telephone: str | None
    logement_nom: str | None
    immeuble_nom: str | None
    bailleur_nom: str
    bailleur_email: str
    bailleur_telephone: str | None


class MonContrat(BaseModel):
    id: int
    logement_nom: str
    immeuble_nom: str
    bailleur_nom: str
    date_debut: date
    date_fin: date | None
    loyer_mensuel: float
    jour_paiement: int
    depot_garantie: float | None
    statut: StatutContrat
    pdf_path: str | None
    signature_locataire_url: str | None = None
    created_at: datetime
    en_retard: bool = False
    points_cumules: int = 0
    points_disponibles: int = 0


class MonPaiement(BaseModel):
    id: int
    contrat_id: int
    logement_nom: str
    montant: float
    periode: str
    date_paiement: date
    mode_paiement: str
    quittance_id: int | None


class MaQuittance(BaseModel):
    id: int
    paiement_id: int
    numero: str
    periode: str
    genere_le: datetime

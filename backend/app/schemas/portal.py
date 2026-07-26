from datetime import date, datetime

from pydantic import BaseModel

from app.models.contrat import StatutContrat


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

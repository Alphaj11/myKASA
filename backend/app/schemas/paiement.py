from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.paiement import ModePaiement


class PaiementBase(BaseModel):
    contrat_id: int
    montant: float
    periode: str
    date_paiement: date = date.today()
    mode_paiement: ModePaiement = ModePaiement.ESPECES
    commentaire: str | None = None


class PaiementCreate(PaiementBase):
    pass


class PaiementRead(PaiementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    quittance_id: int | None = None

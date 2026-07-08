from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuittanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paiement_id: int
    numero: str
    pdf_path: str
    genere_le: datetime

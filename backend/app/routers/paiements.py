import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.contrat import Contrat
from app.models.paiement import Paiement
from app.models.quittance import Quittance
from app.models.user import User, UserRole
from app.schemas.paiement import PaiementCreate, PaiementRead
from app.services.pdf import generate_quittance_pdf

router = APIRouter(prefix="/api/paiements", tags=["paiements"])


def _to_read(paiement: Paiement) -> PaiementRead:
    data = PaiementRead.model_validate(paiement)
    data.quittance_id = paiement.quittance.id if paiement.quittance else None
    return data


@router.get("", response_model=list[PaiementRead])
def list_paiements(
    contrat_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Paiement).join(Contrat, Paiement.contrat_id == Contrat.id)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Contrat.bailleur_id == current_user.id)
    if contrat_id is not None:
        query = query.filter(Paiement.contrat_id == contrat_id)
    return [_to_read(p) for p in query.order_by(Paiement.date_paiement.desc()).all()]


@router.post("", response_model=PaiementRead, status_code=201)
def create_paiement(
    payload: PaiementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    contrat = db.get(Contrat, payload.contrat_id)
    if not contrat or contrat.bailleur_id != current_user.id:
        raise HTTPException(status_code=404, detail="Contrat introuvable")

    paiement = Paiement(**payload.model_dump())
    db.add(paiement)
    db.commit()
    db.refresh(paiement)

    numero = f"{paiement.periode.replace('-', '')}-{uuid.uuid4().hex[:6].upper()}"
    pdf_path = generate_quittance_pdf(
        numero, paiement, contrat, contrat.logement, contrat.locataire, current_user
    )
    quittance = Quittance(paiement_id=paiement.id, numero=numero, pdf_path=pdf_path)
    db.add(quittance)
    db.commit()
    db.refresh(paiement)

    return _to_read(paiement)

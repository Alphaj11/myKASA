import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.contrat import Contrat
from app.models.paiement import Paiement
from app.models.quittance import Quittance
from app.models.user import User, UserRole
from app.schemas.quittance import QuittanceRead
from app.services.pdf import STORAGE_ROOT

router = APIRouter(prefix="/api/quittances", tags=["quittances"])


@router.get("", response_model=list[QuittanceRead])
def list_quittances(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = (
        db.query(Quittance)
        .join(Paiement, Quittance.paiement_id == Paiement.id)
        .join(Contrat, Paiement.contrat_id == Contrat.id)
    )
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Contrat.bailleur_id == current_user.id)
    return query.order_by(Quittance.genere_le.desc()).all()


def _get_owned_quittance(db: Session, quittance_id: int, current_user: User) -> Quittance:
    quittance = db.get(Quittance, quittance_id)
    if not quittance:
        raise HTTPException(status_code=404, detail="Quittance introuvable")
    contrat = quittance.paiement.contrat
    if current_user.role != UserRole.ADMIN and contrat.bailleur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return quittance


@router.get("/{quittance_id}/pdf")
def download_quittance_pdf(
    quittance_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    quittance = _get_owned_quittance(db, quittance_id, current_user)
    full_path = os.path.join(STORAGE_ROOT, quittance.pdf_path)
    return FileResponse(full_path, filename=f"quittance_{quittance.numero}.pdf", media_type="application/pdf")

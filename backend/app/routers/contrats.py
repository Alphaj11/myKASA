import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.contrat import Contrat, StatutContrat
from app.models.locataire import Locataire
from app.models.logement import Logement, StatutLogement
from app.models.user import User, UserRole
from app.schemas.contrat import ContratCreate, ContratRead, ContratUpdate
from app.services.pdf import STORAGE_ROOT, generate_contrat_pdf
from app.services.stats import est_en_retard

router = APIRouter(prefix="/api/contrats", tags=["contrats"])


@router.get("", response_model=list[ContratRead])
def list_contrats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Contrat)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Contrat.bailleur_id == current_user.id)
    contrats = query.order_by(Contrat.created_at.desc()).all()
    for contrat in contrats:
        contrat.en_retard = est_en_retard(db, contrat)
    return contrats


@router.post("", response_model=ContratRead, status_code=201)
def create_contrat(
    payload: ContratCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    logement = db.get(Logement, payload.logement_id)
    if not logement or logement.immeuble.bailleur_id != current_user.id:
        raise HTTPException(status_code=404, detail="Logement introuvable")
    locataire = db.get(Locataire, payload.locataire_id)
    if not locataire or locataire.bailleur_id != current_user.id:
        raise HTTPException(status_code=404, detail="Locataire introuvable")

    contrat = Contrat(**payload.model_dump(), bailleur_id=current_user.id)
    db.add(contrat)
    logement.statut = StatutLogement.OCCUPE
    locataire.logement_id = logement.id
    db.commit()
    db.refresh(contrat)

    contrat.pdf_path = generate_contrat_pdf(contrat, logement, locataire, current_user)
    db.commit()
    db.refresh(contrat)
    contrat.en_retard = est_en_retard(db, contrat)
    return contrat


def _get_owned_contrat(db: Session, contrat_id: int, current_user: User) -> Contrat:
    contrat = db.get(Contrat, contrat_id)
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    if current_user.role != UserRole.ADMIN and contrat.bailleur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return contrat


def _get_viewable_contrat(db: Session, contrat_id: int, current_user: User) -> Contrat:
    """Comme _get_owned_contrat, mais autorise aussi le locataire proprietaire (lecture seule)."""
    contrat = db.get(Contrat, contrat_id)
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    is_owner_bailleur = contrat.bailleur_id == current_user.id
    is_owner_locataire = (
        current_user.role == UserRole.LOCATAIRE and contrat.locataire.utilisateur_id == current_user.id
    )
    if current_user.role != UserRole.ADMIN and not is_owner_bailleur and not is_owner_locataire:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return contrat


@router.get("/{contrat_id}", response_model=ContratRead)
def get_contrat(contrat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contrat = _get_viewable_contrat(db, contrat_id, current_user)
    contrat.en_retard = est_en_retard(db, contrat)
    return contrat


@router.patch("/{contrat_id}", response_model=ContratRead)
def update_contrat(
    contrat_id: int,
    payload: ContratUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contrat = _get_owned_contrat(db, contrat_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contrat, field, value)
    if payload.statut in (StatutContrat.ARCHIVE, StatutContrat.RESILIE):
        contrat.logement.statut = StatutLogement.VACANT
    db.commit()
    db.refresh(contrat)
    return contrat


@router.get("/{contrat_id}/pdf")
def download_contrat_pdf(contrat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contrat = _get_viewable_contrat(db, contrat_id, current_user)
    if not contrat.pdf_path:
        raise HTTPException(status_code=404, detail="PDF non disponible")
    full_path = os.path.join(STORAGE_ROOT, contrat.pdf_path)
    return FileResponse(full_path, filename=f"contrat_{contrat.id}.pdf", media_type="application/pdf")

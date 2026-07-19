import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.contrat import Contrat
from app.models.locataire import Locataire
from app.models.logement import Logement, StatutLogement
from app.models.user import User, UserRole
from app.schemas.locataire import LocataireCreate, LocataireRead, LocataireUpdate
from app.services.documents import STORAGE_ROOT, save_locataire_document

router = APIRouter(prefix="/api/locataires", tags=["locataires"])


@router.get("", response_model=list[LocataireRead])
def list_locataires(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Locataire)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Locataire.bailleur_id == current_user.id)
    return query.order_by(Locataire.created_at.desc()).all()


@router.post("", response_model=LocataireRead, status_code=201)
def create_locataire(
    payload: LocataireCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    if payload.logement_id is not None:
        logement = db.get(Logement, payload.logement_id)
        if not logement or logement.immeuble.bailleur_id != current_user.id:
            raise HTTPException(status_code=404, detail="Logement introuvable")
        logement.statut = StatutLogement.OCCUPE

    locataire = Locataire(**payload.model_dump(), bailleur_id=current_user.id)
    db.add(locataire)
    db.commit()
    db.refresh(locataire)
    return locataire


def _get_owned_locataire(db: Session, locataire_id: int, current_user: User) -> Locataire:
    locataire = db.get(Locataire, locataire_id)
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    if current_user.role != UserRole.ADMIN and locataire.bailleur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return locataire


@router.get("/{locataire_id}", response_model=LocataireRead)
def get_locataire(locataire_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_owned_locataire(db, locataire_id, current_user)


@router.patch("/{locataire_id}", response_model=LocataireRead)
def update_locataire(
    locataire_id: int,
    payload: LocataireUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    locataire = _get_owned_locataire(db, locataire_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(locataire, field, value)
    db.commit()
    db.refresh(locataire)
    return locataire


@router.delete("/{locataire_id}", status_code=204)
def delete_locataire(
    locataire_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    locataire = _get_owned_locataire(db, locataire_id, current_user)
    has_contrats = db.query(Contrat).filter(Contrat.locataire_id == locataire_id).first() is not None
    if has_contrats:
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer un locataire ayant des contrats associés.",
        )
    db.delete(locataire)
    db.commit()


@router.post("/{locataire_id}/document", response_model=LocataireRead)
async def upload_locataire_document(
    locataire_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    locataire = _get_owned_locataire(db, locataire_id, current_user)
    content = await file.read()
    new_path = save_locataire_document(locataire_id, file, content)

    if locataire.piece_identite:
        old_path = os.path.join(STORAGE_ROOT, locataire.piece_identite)
        if os.path.exists(old_path):
            os.remove(old_path)

    locataire.piece_identite = new_path
    db.commit()
    db.refresh(locataire)
    return locataire


@router.get("/{locataire_id}/document")
def download_locataire_document(
    locataire_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    locataire = _get_owned_locataire(db, locataire_id, current_user)
    if not locataire.piece_identite:
        raise HTTPException(status_code=404, detail="Aucun document associé")
    full_path = os.path.join(STORAGE_ROOT, locataire.piece_identite)
    return FileResponse(full_path)

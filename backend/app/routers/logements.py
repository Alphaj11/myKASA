from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.contrat import Contrat
from app.models.immeuble import Immeuble
from app.models.logement import Logement
from app.models.user import User, UserRole
from app.schemas.logement import LogementCreate, LogementRead, LogementUpdate

router = APIRouter(prefix="/api/logements", tags=["logements"])


def _assert_immeuble_owned(db: Session, immeuble_id: int, current_user: User) -> Immeuble:
    immeuble = db.get(Immeuble, immeuble_id)
    if not immeuble:
        raise HTTPException(status_code=404, detail="Immeuble introuvable")
    if current_user.role != UserRole.ADMIN and immeuble.bailleur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return immeuble


@router.get("", response_model=list[LogementRead])
def list_logements(
    immeuble_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Logement).join(Immeuble, Logement.immeuble_id == Immeuble.id)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Immeuble.bailleur_id == current_user.id)
    if immeuble_id is not None:
        query = query.filter(Logement.immeuble_id == immeuble_id)
    return query.order_by(Logement.created_at.desc()).all()


@router.post("", response_model=LogementRead, status_code=201)
def create_logement(
    payload: LogementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    _assert_immeuble_owned(db, payload.immeuble_id, current_user)
    logement = Logement(**payload.model_dump())
    db.add(logement)
    db.commit()
    db.refresh(logement)
    return logement


def _get_owned_logement(db: Session, logement_id: int, current_user: User) -> Logement:
    logement = db.get(Logement, logement_id)
    if not logement:
        raise HTTPException(status_code=404, detail="Logement introuvable")
    _assert_immeuble_owned(db, logement.immeuble_id, current_user)
    return logement


@router.get("/{logement_id}", response_model=LogementRead)
def get_logement(logement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_owned_logement(db, logement_id, current_user)


@router.patch("/{logement_id}", response_model=LogementRead)
def update_logement(
    logement_id: int,
    payload: LogementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logement = _get_owned_logement(db, logement_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(logement, field, value)
    db.commit()
    db.refresh(logement)
    return logement


@router.delete("/{logement_id}", status_code=204)
def delete_logement(logement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logement = _get_owned_logement(db, logement_id, current_user)
    has_contrats = db.query(Contrat).filter(Contrat.logement_id == logement_id).first() is not None
    if has_contrats:
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer un logement ayant des contrats associés.",
        )
    db.delete(logement)
    db.commit()

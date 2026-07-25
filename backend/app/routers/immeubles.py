from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.contrat import Contrat
from app.models.immeuble import Immeuble
from app.models.logement import Logement
from app.models.user import User, UserRole
from app.schemas.immeuble import ImmeubleCreate, ImmeubleRead, ImmeubleUpdate
from app.services.images import delete_image, save_image

router = APIRouter(prefix="/api/immeubles", tags=["immeubles"])


def _to_read(immeuble: Immeuble) -> ImmeubleRead:
    data = ImmeubleRead.model_validate(immeuble)
    data.nb_logements = len(immeuble.logements)
    return data


@router.get("", response_model=list[ImmeubleRead])
def list_immeubles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Immeuble)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Immeuble.bailleur_id == current_user.id)
    return [_to_read(i) for i in query.order_by(Immeuble.created_at.desc()).all()]


@router.post("", response_model=ImmeubleRead, status_code=201)
def create_immeuble(
    payload: ImmeubleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    data = payload.model_dump()
    declaration = data.pop("declaration_acceptee", False)
    immeuble = Immeuble(
        **data,
        bailleur_id=current_user.id,
        declaration_acceptee=declaration,
        verification_level=1 if declaration else 0,
    )
    db.add(immeuble)
    db.commit()
    db.refresh(immeuble)
    return _to_read(immeuble)


def _get_owned_immeuble(db: Session, immeuble_id: int, current_user: User) -> Immeuble:
    immeuble = db.get(Immeuble, immeuble_id)
    if not immeuble:
        raise HTTPException(status_code=404, detail="Immeuble introuvable")
    if current_user.role != UserRole.ADMIN and immeuble.bailleur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return immeuble


@router.get("/{immeuble_id}", response_model=ImmeubleRead)
def get_immeuble(immeuble_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _to_read(_get_owned_immeuble(db, immeuble_id, current_user))


@router.patch("/{immeuble_id}", response_model=ImmeubleRead)
def update_immeuble(
    immeuble_id: int,
    payload: ImmeubleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    immeuble = _get_owned_immeuble(db, immeuble_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(immeuble, field, value)
    db.commit()
    db.refresh(immeuble)
    return _to_read(immeuble)


@router.post("/{immeuble_id}/photo", response_model=ImmeubleRead)
async def upload_immeuble_photo(
    immeuble_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    immeuble = _get_owned_immeuble(db, immeuble_id, current_user)
    content = await file.read()
    delete_image(immeuble.photo_principale_url)
    immeuble.photo_principale_url = save_image("immeubles", file, content)
    db.commit()
    db.refresh(immeuble)
    return _to_read(immeuble)


@router.delete("/{immeuble_id}", status_code=204)
def delete_immeuble(immeuble_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    immeuble = _get_owned_immeuble(db, immeuble_id, current_user)
    has_contrats = (
        db.query(Contrat)
        .join(Logement, Contrat.logement_id == Logement.id)
        .filter(Logement.immeuble_id == immeuble_id)
        .first()
        is not None
    )
    if has_contrats:
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer un immeuble dont des logements ont des contrats associés.",
        )
    delete_image(immeuble.photo_principale_url)
    db.delete(immeuble)
    db.commit()

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
from app.schemas.locataire import (
    LocataireCreate,
    LocataireDepuisCodeCreate,
    LocataireRead,
    LocataireUpdate,
    UtilisateurPublic,
)
from app.services.documents import STORAGE_ROOT, save_locataire_document
from app.services.images import delete_image, save_image

router = APIRouter(prefix="/api/locataires", tags=["locataires"])


@router.get("/recherche/{code}", response_model=UtilisateurPublic)
def recherche_par_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    utilisateur = db.query(User).filter(User.code_locataire == code.upper().strip()).first()
    if not utilisateur or not utilisateur.code_locataire:
        raise HTTPException(status_code=404, detail="Aucun utilisateur trouvé avec ce code")
    return UtilisateurPublic(
        utilisateur_id=utilisateur.id,
        full_name=utilisateur.full_name,
        email=utilisateur.email,
        phone=utilisateur.phone,
        avatar_url=utilisateur.avatar_url,
        code_locataire=utilisateur.code_locataire,
    )


@router.post("/depuis-code", response_model=LocataireRead, status_code=201)
def create_locataire_depuis_code(
    payload: LocataireDepuisCodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    utilisateur = db.query(User).filter(User.code_locataire == payload.code.upper().strip()).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Aucun utilisateur trouvé avec ce code")

    already = db.query(Locataire).filter(
        Locataire.utilisateur_id == utilisateur.id,
        Locataire.bailleur_id == current_user.id,
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="Ce locataire est déjà dans votre liste")

    logement = None
    if payload.logement_id is not None:
        logement = db.get(Logement, payload.logement_id)
        if not logement or logement.immeuble.bailleur_id != current_user.id:
            raise HTTPException(status_code=404, detail="Logement introuvable")

    parts = utilisateur.full_name.strip().split(" ", 1)
    prenom = parts[0]
    nom = parts[1] if len(parts) > 1 else ""

    locataire = Locataire(
        bailleur_id=current_user.id,
        utilisateur_id=utilisateur.id,
        logement_id=payload.logement_id,
        nom=nom,
        prenom=prenom,
        email=utilisateur.email,
        telephone=utilisateur.phone,
        adresse=utilisateur.adresse,
        date_naissance=utilisateur.date_naissance,
        cni_numero=utilisateur.cni_numero,
    )
    db.add(locataire)
    db.flush()

    if logement and payload.date_entree and payload.loyer_mensuel is not None:
        logement.statut = StatutLogement.OCCUPE
        contrat = Contrat(
            bailleur_id=current_user.id,
            logement_id=payload.logement_id,
            locataire_id=locataire.id,
            date_debut=payload.date_entree,
            loyer_mensuel=payload.loyer_mensuel,
            depot_garantie=payload.depot_garantie,
            jour_paiement=payload.jour_paiement,
        )
        db.add(contrat)
    elif logement:
        logement.statut = StatutLogement.OCCUPE

    db.commit()
    db.refresh(locataire)
    return locataire


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
    delete_image(locataire.photo_url)
    db.delete(locataire)
    db.commit()


@router.post("/{locataire_id}/photo", response_model=LocataireRead)
async def upload_locataire_photo(
    locataire_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    locataire = _get_owned_locataire(db, locataire_id, current_user)
    content = await file.read()
    delete_image(locataire.photo_url)
    locataire.photo_url = save_image("locataires", file, content)
    db.commit()
    db.refresh(locataire)
    return locataire


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

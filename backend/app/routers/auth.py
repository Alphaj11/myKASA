import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import check_rate_limit, record_failed_attempt, reset_attempts
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    create_verify_email_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.locataire import Locataire
from app.models.user import User, UserRole
from app.schemas.auth import (
    AccessToken,
    ForgotPasswordRequest,
    RefreshRequest,
    ResetPasswordRequest,
    Token,
    VerifyEmailRequest,
)
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest, UserCreate, UserRead
from app.services.images import delete_image, save_image

logger = logging.getLogger("localtrack.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _send_verification_email(user: User) -> None:
    token = create_verify_email_token(str(user.id))
    verify_link = f"{settings.frontend_url}/verify-email?token={token}"
    # Pas de service d'email configure : le lien est journalise cote serveur
    # (a remplacer par un envoi reel en production).
    logger.warning("Lien de verification d'email pour %s : %s", user.email, verify_link)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if payload.role not in (UserRole.BAILLEUR, UserRole.LOCATAIRE):
        raise HTTPException(status_code=400, detail="Inscription publique reservee aux bailleurs et locataires")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un compte existe deja avec cet email")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == UserRole.LOCATAIRE:
        # Un bailleur a pu créer la fiche locataire avant que la personne ne
        # crée son compte : on relie automatiquement par email.
        db.query(Locataire).filter(
            Locataire.email == user.email, Locataire.utilisateur_id.is_(None)
        ).update({"utilisateur_id": user.id})
        db.commit()

    _send_verification_email(user)

    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    rate_limit_key = form_data.username.lower()
    check_rate_limit(rate_limit_key)

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        record_failed_attempt(rate_limit_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte desactive")

    reset_attempts(rate_limit_key)

    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=AccessToken)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    user = db.get(User, int(token_data["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable ou désactivé")
    return AccessToken(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.full_name = payload.full_name
    current_user.phone = payload.phone
    current_user.date_naissance = payload.date_naissance
    current_user.adresse = payload.adresse
    current_user.cni_numero = payload.cni_numero
    current_user.cni_date_delivrance = payload.cni_date_delivrance
    current_user.cni_lieu_delivrance = payload.cni_lieu_delivrance
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    delete_image(current_user.avatar_url)
    current_user.avatar_url = save_image("avatars", file, content)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès."}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = create_reset_token(str(user.id))
        reset_link = f"{settings.frontend_url}/reset-password?token={token}"
        # Pas de service d'email configure : le lien est journalise cote serveur
        # (a remplacer par un envoi reel en production).
        logger.warning("Lien de reinitialisation pour %s : %s", user.email, reset_link)
    return {"message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_data = decode_token(payload.token)
    if token_data.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Token invalide")
    user = db.get(User, int(token_data["sub"]))
    if not user:
        raise HTTPException(status_code=400, detail="Token invalide")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès."}


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    token_data = decode_token(payload.token)
    if token_data.get("type") != "verify":
        raise HTTPException(status_code=400, detail="Token invalide")
    user = db.get(User, int(token_data["sub"]))
    if not user:
        raise HTTPException(status_code=400, detail="Token invalide")
    user.is_email_verified = True
    db.commit()
    return {"message": "Email vérifié avec succès."}


@router.post("/resend-verification")
def resend_verification(current_user: User = Depends(get_current_user)):
    if current_user.is_email_verified:
        return {"message": "Cet email est déjà vérifié."}
    _send_verification_email(current_user)
    return {"message": "Un nouveau lien de vérification a été envoyé."}

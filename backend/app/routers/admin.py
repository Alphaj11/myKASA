from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.dashboard import AdminStats
from app.schemas.user import UserRead, UserUpdateActive, UserUpdatePlan
from app.services.stats import compute_admin_stats

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    return compute_admin_stats(db)


@router.get("/users", response_model=list[UserRead])
def list_users(
    role: UserRole | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


@router.patch("/users/{user_id}/active", response_model=UserRead)
def set_user_active(
    user_id: int,
    payload: UserUpdateActive,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = _get_user_or_404(db, user_id)
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/plan", response_model=UserRead)
def set_user_plan(
    user_id: int,
    payload: UserUpdatePlan,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = _get_user_or_404(db, user_id)
    user.plan = payload.plan
    db.commit()
    db.refresh(user)
    return user

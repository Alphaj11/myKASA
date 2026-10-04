from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole, PlanType
from app.schemas.dashboard import DashboardStats
from app.services.stats import compute_dashboard_stats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_PREMIUM_PLANS = {PlanType.PREMIUM, PlanType.AGENCE}


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    immeuble_id: int | None = Query(None),
    type_logement: str | None = Query(None),
    nb_mois: int = Query(6, ge=1, le=36),
    periode_debut: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    periode_fin: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BAILLEUR)),
):
    is_premium = current_user.plan in _PREMIUM_PLANS
    return compute_dashboard_stats(
        db,
        bailleur_id=current_user.id,
        immeuble_id=immeuble_id if is_premium else None,
        type_logement=type_logement if is_premium else None,
        nb_mois=nb_mois,
        periode_debut=periode_debut,
        periode_fin=periode_fin,
    )

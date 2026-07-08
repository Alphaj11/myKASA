from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardStats
from app.services.stats import compute_dashboard_stats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.BAILLEUR))
):
    return compute_dashboard_stats(db, current_user.id)

from fastapi import HTTPException

from app.models.user import PlanType, User

LIMITS: dict[PlanType, dict[str, int | None]] = {
    PlanType.FREEMIUM: {"immeubles": 1, "logements": 2},
    PlanType.PREMIUM:  {"immeubles": 3, "logements": None},
    PlanType.AGENCE:   {"immeubles": None, "logements": None},
}

PLAN_LABELS: dict[PlanType, str] = {
    PlanType.FREEMIUM: "Gratuit",
    PlanType.PREMIUM:  "Premium",
    PlanType.AGENCE:   "Agence",
}


def _limit(user: User, key: str) -> int | None:
    return LIMITS[user.plan][key]


def check_immeuble_limit(user: User, current_count: int) -> None:
    lim = _limit(user, "immeubles")
    if lim is not None and current_count >= lim:
        raise HTTPException(
            status_code=402,
            detail=(
                f"Votre plan {PLAN_LABELS[user.plan]} est limité à {lim} propriété(s). "
                "Passez au plan supérieur pour continuer."
            ),
        )


def check_logement_limit(user: User, current_count: int) -> None:
    lim = _limit(user, "logements")
    if lim is not None and current_count >= lim:
        raise HTTPException(
            status_code=402,
            detail=(
                f"Votre plan {PLAN_LABELS[user.plan]} est limité à {lim} logement(s) au total. "
                "Passez au plan supérieur pour continuer."
            ),
        )


def get_usage(user: User, immeuble_count: int, logement_count: int) -> dict:
    return {
        "plan": user.plan,
        "plan_label": PLAN_LABELS[user.plan],
        "immeubles": {
            "current": immeuble_count,
            "max": _limit(user, "immeubles"),
        },
        "logements": {
            "current": logement_count,
            "max": _limit(user, "logements"),
        },
    }

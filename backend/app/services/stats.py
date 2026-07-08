from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.contrat import Contrat, StatutContrat
from app.models.immeuble import Immeuble
from app.models.locataire import Locataire
from app.models.logement import Logement, StatutLogement
from app.models.paiement import Paiement
from app.models.user import User, UserRole, PlanType


def _current_period() -> str:
    return date.today().strftime("%Y-%m")


def _last_n_periods(n: int = 6) -> list[str]:
    periods = []
    year, month = date.today().year, date.today().month
    for _ in range(n):
        periods.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(periods))


def compute_dashboard_stats(db: Session, bailleur_id: int) -> dict:
    period = _current_period()

    loyers_encaisses_mois = (
        db.query(func.coalesce(func.sum(Paiement.montant), 0))
        .join(Contrat, Paiement.contrat_id == Contrat.id)
        .filter(Contrat.bailleur_id == bailleur_id, Paiement.periode == period)
        .scalar()
    )

    contrats_actifs = (
        db.query(Contrat)
        .filter(Contrat.bailleur_id == bailleur_id, Contrat.statut == StatutContrat.ACTIF)
        .all()
    )
    today_day = date.today().day
    contrats_en_retard = 0
    loyers_en_retard_montant = 0.0
    for contrat in contrats_actifs:
        deja_paye = (
            db.query(Paiement)
            .filter(Paiement.contrat_id == contrat.id, Paiement.periode == period)
            .first()
        )
        if not deja_paye and today_day > contrat.jour_paiement:
            contrats_en_retard += 1
            loyers_en_retard_montant += float(contrat.loyer_mensuel)

    logements_occupes = (
        db.query(func.count(Logement.id))
        .join(Immeuble, Logement.immeuble_id == Immeuble.id)
        .filter(Immeuble.bailleur_id == bailleur_id, Logement.statut == StatutLogement.OCCUPE)
        .scalar()
    )
    logements_vacants = (
        db.query(func.count(Logement.id))
        .join(Immeuble, Logement.immeuble_id == Immeuble.id)
        .filter(Immeuble.bailleur_id == bailleur_id, Logement.statut == StatutLogement.VACANT)
        .scalar()
    )

    nb_locataires = db.query(func.count(Locataire.id)).filter(Locataire.bailleur_id == bailleur_id).scalar()

    revenus_par_mois = []
    for p in _last_n_periods(6):
        total = (
            db.query(func.coalesce(func.sum(Paiement.montant), 0))
            .join(Contrat, Paiement.contrat_id == Contrat.id)
            .filter(Contrat.bailleur_id == bailleur_id, Paiement.periode == p)
            .scalar()
        )
        revenus_par_mois.append({"mois": p, "montant": float(total)})

    return {
        "loyers_encaisses_mois": float(loyers_encaisses_mois),
        "loyers_en_retard_montant": loyers_en_retard_montant,
        "contrats_en_retard": contrats_en_retard,
        "logements_occupes": logements_occupes,
        "logements_vacants": logements_vacants,
        "nb_locataires": nb_locataires,
        "revenus_par_mois": revenus_par_mois,
    }


def compute_admin_stats(db: Session) -> dict:
    period = _current_period()

    nb_bailleurs = db.query(func.count(User.id)).filter(User.role == UserRole.BAILLEUR).scalar()
    nb_locataires = db.query(func.count(User.id)).filter(User.role == UserRole.LOCATAIRE).scalar()
    nb_immeubles = db.query(func.count(Immeuble.id)).scalar()
    nb_logements = db.query(func.count(Logement.id)).scalar()
    nb_contrats_actifs = db.query(func.count(Contrat.id)).filter(Contrat.statut == StatutContrat.ACTIF).scalar()
    volume_paiements_mois = (
        db.query(func.coalesce(func.sum(Paiement.montant), 0)).filter(Paiement.periode == period).scalar()
    )

    repartition_plans = {plan.value: 0 for plan in PlanType}
    for plan, count in (
        db.query(User.plan, func.count(User.id)).filter(User.role == UserRole.BAILLEUR).group_by(User.plan).all()
    ):
        repartition_plans[plan.value] = count

    return {
        "nb_bailleurs": nb_bailleurs,
        "nb_locataires": nb_locataires,
        "nb_immeubles": nb_immeubles,
        "nb_logements": nb_logements,
        "nb_contrats_actifs": nb_contrats_actifs,
        "volume_paiements_mois": float(volume_paiements_mois),
        "repartition_plans": repartition_plans,
    }

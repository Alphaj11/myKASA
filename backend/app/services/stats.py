from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.contrat import Contrat, StatutContrat
from app.models.immeuble import Immeuble
from app.models.locataire import Locataire
from app.models.logement import Logement, StatutLogement, TypeLogement
from app.models.paiement import Paiement
from app.models.user import User, UserRole, PlanType


def _current_period() -> str:
    return date.today().strftime("%Y-%m")


def _periods_range(debut: str | None, fin: str | None, nb_mois: int = 6) -> list[str]:
    if debut and fin:
        periods = []
        y, m = map(int, debut.split("-"))
        ey, em = map(int, fin.split("-"))
        while (y, m) <= (ey, em):
            periods.append(f"{y:04d}-{m:02d}")
            m += 1
            if m > 12:
                m = 1
                y += 1
        return periods

    periods = []
    today = date.today()
    year, month = today.year, today.month
    for _ in range(nb_mois):
        periods.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(periods))


def est_en_retard(db: Session, contrat: Contrat) -> bool:
    if contrat.statut != StatutContrat.ACTIF:
        return False
    if date.today().day <= contrat.jour_paiement:
        return False
    deja_paye = (
        db.query(Paiement)
        .filter(Paiement.contrat_id == contrat.id, Paiement.periode == _current_period())
        .first()
    )
    return deja_paye is None


def compute_dashboard_stats(
    db: Session,
    bailleur_id: int,
    immeuble_id: int | None = None,
    type_logement: str | None = None,
    nb_mois: int = 6,
    periode_debut: str | None = None,
    periode_fin: str | None = None,
) -> dict:
    periods = _periods_range(periode_debut, periode_fin, nb_mois)
    period_actuelle = _current_period()

    # ── Base query helpers ────────────────────────────────────────────────
    def logement_q():
        q = db.query(Logement).join(Immeuble, Logement.immeuble_id == Immeuble.id).filter(
            Immeuble.bailleur_id == bailleur_id
        )
        if immeuble_id:
            q = q.filter(Immeuble.id == immeuble_id)
        if type_logement:
            q = q.filter(Logement.type == type_logement)
        return q

    logement_ids = [l.id for l in logement_q().all()]

    def contrat_q():
        q = db.query(Contrat).filter(
            Contrat.bailleur_id == bailleur_id,
            Contrat.statut == StatutContrat.ACTIF,
        )
        if logement_ids is not None and (immeuble_id or type_logement):
            q = q.filter(Contrat.logement_id.in_(logement_ids))
        return q

    def paiement_q(periode: str | None = None):
        q = (
            db.query(Paiement)
            .join(Contrat, Paiement.contrat_id == Contrat.id)
            .filter(Contrat.bailleur_id == bailleur_id)
        )
        if immeuble_id or type_logement:
            q = q.filter(Contrat.logement_id.in_(logement_ids))
        if periode:
            q = q.filter(Paiement.periode == periode)
        return q

    # ── KPIs ──────────────────────────────────────────────────────────────
    loyers_encaisses = float(
        paiement_q()
        .filter(Paiement.periode.in_(periods))
        .with_entities(func.coalesce(func.sum(Paiement.montant), 0))
        .scalar()
    )

    contrats_actifs = contrat_q().all()
    contrats_en_retard = 0
    montant_en_attente = 0.0
    revenu_previsionnel = 0.0
    for contrat in contrats_actifs:
        revenu_previsionnel += float(contrat.loyer_mensuel)
        if est_en_retard(db, contrat):
            contrats_en_retard += 1
            montant_en_attente += float(contrat.loyer_mensuel)

    taux_impayes = (
        round(contrats_en_retard / len(contrats_actifs) * 100, 1) if contrats_actifs else 0.0
    )

    nb_occupes = logement_q().filter(Logement.statut == StatutLogement.OCCUPE).count()
    nb_vacants = logement_q().filter(Logement.statut == StatutLogement.VACANT).count()
    nb_total = nb_occupes + nb_vacants
    taux_occupation = round(nb_occupes / nb_total * 100, 1) if nb_total else 0.0

    nb_locataires = (
        db.query(func.count(Locataire.id))
        .filter(Locataire.bailleur_id == bailleur_id)
        .scalar()
    )

    # ── Revenus par mois (courbe) ─────────────────────────────────────────
    revenus_par_mois = []
    for p in periods:
        total = float(
            paiement_q(p)
            .with_entities(func.coalesce(func.sum(Paiement.montant), 0))
            .scalar()
        )
        mois_label = p[5:] + "/" + p[2:4]  # "01/26"
        revenus_par_mois.append({"mois": mois_label, "periode": p, "montant": total})

    # ── Revenus par logement (barres) ─────────────────────────────────────
    revenus_par_logement = []
    for lid in logement_ids[:10]:
        logement = db.get(Logement, lid)
        if not logement:
            continue
        total = float(
            db.query(func.coalesce(func.sum(Paiement.montant), 0))
            .join(Contrat, Paiement.contrat_id == Contrat.id)
            .filter(Contrat.logement_id == lid, Paiement.periode.in_(periods))
            .scalar()
        )
        revenus_par_logement.append({"logement": logement.nom, "montant": total})

    revenus_par_logement.sort(key=lambda x: x["montant"], reverse=True)

    return {
        "loyers_encaisses_mois": loyers_encaisses,
        "montant_en_attente": montant_en_attente,
        "taux_impayes": taux_impayes,
        "contrats_en_retard": contrats_en_retard,
        "taux_occupation": taux_occupation,
        "logements_occupes": nb_occupes,
        "logements_vacants": nb_vacants,
        "revenu_previsionnel": revenu_previsionnel,
        "nb_locataires": nb_locataires,
        "revenus_par_mois": revenus_par_mois,
        "revenus_par_logement": revenus_par_logement,
        # legacy
        "loyers_en_retard_montant": montant_en_attente,
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

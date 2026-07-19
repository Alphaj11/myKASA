from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.contrat import Contrat
from app.models.locataire import Locataire
from app.models.paiement import Paiement
from app.models.quittance import Quittance
from app.models.user import User, UserRole
from app.schemas.portal import MaFicheLocataire, MaQuittance, MonContrat, MonPaiement
from app.services.stats import est_en_retard

router = APIRouter(prefix="/api/me", tags=["locataire-portal"])


def _mes_locataires(db: Session, current_user: User) -> list[Locataire]:
    return db.query(Locataire).filter(Locataire.utilisateur_id == current_user.id).all()


@router.get("/fiches", response_model=list[MaFicheLocataire])
def mes_fiches(
    db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.LOCATAIRE))
):
    fiches = []
    for locataire in _mes_locataires(db, current_user):
        bailleur_user = db.get(User, locataire.bailleur_id)
        fiches.append(
            MaFicheLocataire(
                id=locataire.id,
                nom=locataire.nom,
                prenom=locataire.prenom,
                email=locataire.email,
                telephone=locataire.telephone,
                logement_nom=locataire.logement.nom if locataire.logement else None,
                immeuble_nom=locataire.logement.immeuble.nom if locataire.logement else None,
                bailleur_nom=bailleur_user.full_name if bailleur_user else "Bailleur",
                bailleur_email=bailleur_user.email if bailleur_user else "",
                bailleur_telephone=bailleur_user.phone if bailleur_user else None,
            )
        )
    return fiches


@router.get("/contrats", response_model=list[MonContrat])
def mes_contrats(
    db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.LOCATAIRE))
):
    locataire_ids = [l.id for l in _mes_locataires(db, current_user)]
    if not locataire_ids:
        return []
    contrats = (
        db.query(Contrat)
        .filter(Contrat.locataire_id.in_(locataire_ids))
        .order_by(Contrat.created_at.desc())
        .all()
    )
    result = []
    for contrat in contrats:
        bailleur_user = db.get(User, contrat.bailleur_id)
        result.append(
            MonContrat(
                id=contrat.id,
                logement_nom=contrat.logement.nom,
                immeuble_nom=contrat.logement.immeuble.nom,
                bailleur_nom=bailleur_user.full_name if bailleur_user else "Bailleur",
                date_debut=contrat.date_debut,
                date_fin=contrat.date_fin,
                loyer_mensuel=contrat.loyer_mensuel,
                jour_paiement=contrat.jour_paiement,
                depot_garantie=contrat.depot_garantie,
                statut=contrat.statut,
                pdf_path=contrat.pdf_path,
                created_at=contrat.created_at,
                en_retard=est_en_retard(db, contrat),
            )
        )
    return result


@router.get("/paiements", response_model=list[MonPaiement])
def mes_paiements(
    db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.LOCATAIRE))
):
    locataire_ids = [l.id for l in _mes_locataires(db, current_user)]
    if not locataire_ids:
        return []
    contrat_ids = [
        c.id for c in db.query(Contrat).filter(Contrat.locataire_id.in_(locataire_ids)).all()
    ]
    if not contrat_ids:
        return []
    paiements = (
        db.query(Paiement)
        .filter(Paiement.contrat_id.in_(contrat_ids))
        .order_by(Paiement.date_paiement.desc())
        .all()
    )
    return [
        MonPaiement(
            id=p.id,
            contrat_id=p.contrat_id,
            logement_nom=p.contrat.logement.nom,
            montant=p.montant,
            periode=p.periode,
            date_paiement=p.date_paiement,
            mode_paiement=p.mode_paiement.value,
            quittance_id=p.quittance.id if p.quittance else None,
        )
        for p in paiements
    ]


@router.get("/quittances", response_model=list[MaQuittance])
def mes_quittances(
    db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.LOCATAIRE))
):
    locataire_ids = [l.id for l in _mes_locataires(db, current_user)]
    if not locataire_ids:
        return []
    contrat_ids = [
        c.id for c in db.query(Contrat).filter(Contrat.locataire_id.in_(locataire_ids)).all()
    ]
    if not contrat_ids:
        return []
    paiement_ids = [
        p.id for p in db.query(Paiement).filter(Paiement.contrat_id.in_(contrat_ids)).all()
    ]
    if not paiement_ids:
        return []
    quittances = (
        db.query(Quittance)
        .filter(Quittance.paiement_id.in_(paiement_ids))
        .order_by(Quittance.genere_le.desc())
        .all()
    )
    return [
        MaQuittance(
            id=q.id,
            paiement_id=q.paiement_id,
            numero=q.numero,
            periode=q.paiement.periode,
            genere_le=q.genere_le,
        )
        for q in quittances
    ]

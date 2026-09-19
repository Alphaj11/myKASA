"""
Script de seed pour peupler la base de données avec des données de test.
Usage : python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole, PlanType
from app.models.immeuble import Immeuble
from app.models.logement import Logement, TypeLogement, StatutLogement
from app.models.locataire import Locataire
from app.models.contrat import Contrat, StatutContrat

db = SessionLocal()

try:
    # ── 1. Utilisateurs ──────────────────────────────────────────────
    admin = User(
        email="admin@mykasa.cm",
        hashed_password=hash_password("test1234"),
        full_name="Admin MyKASA",
        role=UserRole.ADMIN,
        plan=PlanType.AGENCE,
        is_active=True,
        is_email_verified=True,
    )

    bailleur = User(
        email="jean.bailleur@test.cm",
        hashed_password=hash_password("test1234"),
        full_name="Jean Bailleur Vérifié",
        phone="+237 699 000 001",
        role=UserRole.BAILLEUR,
        plan=PlanType.PREMIUM,
        is_active=True,
        is_email_verified=True,
        code_locataire="BAI00001",
    )

    locataire_user = User(
        email="paul.mballa@test.cm",
        hashed_password=hash_password("test1234"),
        full_name="Paul Mballa",
        phone="+237 677 000 002",
        role=UserRole.LOCATAIRE,
        plan=PlanType.FREEMIUM,
        is_active=True,
        is_email_verified=True,
        code_locataire="LOC00002",
        date_naissance=date(1995, 3, 15),
        adresse="Bastos, Yaoundé",
    )

    locataire_user2 = User(
        email="marie.nguemo@test.cm",
        hashed_password=hash_password("test1234"),
        full_name="Marie Nguemo",
        phone="+237 655 000 003",
        role=UserRole.LOCATAIRE,
        plan=PlanType.FREEMIUM,
        is_active=True,
        is_email_verified=True,
        code_locataire="LOC00003",
    )

    db.add_all([admin, bailleur, locataire_user, locataire_user2])
    db.flush()
    print(f"✓ Utilisateurs créés (ids: {admin.id}, {bailleur.id}, {locataire_user.id}, {locataire_user2.id})")

    # ── 2. Propriétés (Immeubles) ─────────────────────────────────────
    immeuble1 = Immeuble(
        bailleur_id=bailleur.id,
        nom="Résidence Bonapriso",
        adresse="Rue Castelnau",
        ville="Douala",
        type_bien="APPARTEMENT",
        superficie_totale=450,
        annee_construction=2018,
        declaration_acceptee=True,
        verification_level=2,
    )

    immeuble2 = Immeuble(
        bailleur_id=bailleur.id,
        nom="Villa Bastos",
        adresse="Avenue de l'Indépendance",
        ville="Yaoundé",
        type_bien="MAISON",
        superficie_totale=300,
        annee_construction=2015,
        declaration_acceptee=True,
        verification_level=1,
    )

    db.add_all([immeuble1, immeuble2])
    db.flush()
    print(f"✓ Propriétés créées (ids: {immeuble1.id}, {immeuble2.id})")

    # ── 3. Logements ──────────────────────────────────────────────────
    appt_a1 = Logement(
        immeuble_id=immeuble1.id,
        nom="Appt A1",
        type=TypeLogement.APPARTEMENT,
        loyer_mensuel=150000,
        statut=StatutLogement.OCCUPE,
        superficie=75,
        etage=1,
        nb_chambres=2,
        nb_salles_de_bain=1,
        meuble=False,
    )

    appt_a2 = Logement(
        immeuble_id=immeuble1.id,
        nom="Appt A2",
        type=TypeLogement.STUDIO,
        loyer_mensuel=80000,
        statut=StatutLogement.OCCUPE,
        superficie=35,
        etage=1,
        nb_chambres=1,
        nb_salles_de_bain=1,
        meuble=True,
    )

    appt_b1 = Logement(
        immeuble_id=immeuble1.id,
        nom="Appt B1",
        type=TypeLogement.APPARTEMENT,
        loyer_mensuel=120000,
        statut=StatutLogement.VACANT,
        superficie=60,
        etage=2,
        nb_chambres=2,
        nb_salles_de_bain=1,
        meuble=False,
    )

    villa = Logement(
        immeuble_id=immeuble2.id,
        nom="Villa principale",
        type=TypeLogement.VILLA,
        loyer_mensuel=350000,
        statut=StatutLogement.VACANT,
        superficie=250,
        etage=0,
        nb_chambres=4,
        nb_salles_de_bain=3,
        meuble=False,
    )

    db.add_all([appt_a1, appt_a2, appt_b1, villa])
    db.flush()
    print(f"✓ Logements créés (ids: {appt_a1.id}, {appt_a2.id}, {appt_b1.id}, {villa.id})")

    # ── 4. Locataires (profils) ───────────────────────────────────────
    locataire1 = Locataire(
        bailleur_id=bailleur.id,
        utilisateur_id=locataire_user.id,
        logement_id=appt_a1.id,
        nom="Mballa",
        prenom="Paul",
        email="paul.mballa@test.cm",
        telephone="+237 677 000 002",
        profession="Ingénieur",
        employeur="MTN Cameroun",
        cni_numero="123456789",
        date_naissance=date(1995, 3, 15),
        lieu_naissance="Yaoundé",
        nationalite="Camerounaise",
    )

    locataire2 = Locataire(
        bailleur_id=bailleur.id,
        utilisateur_id=locataire_user2.id,
        logement_id=appt_a2.id,
        nom="Nguemo",
        prenom="Marie",
        email="marie.nguemo@test.cm",
        telephone="+237 655 000 003",
        profession="Comptable",
        employeur="Afriland First Bank",
    )

    db.add_all([locataire1, locataire2])
    db.flush()
    print(f"✓ Profils locataires créés (ids: {locataire1.id}, {locataire2.id})")

    # ── 5. Contrats ───────────────────────────────────────────────────
    contrat1 = Contrat(
        bailleur_id=bailleur.id,
        logement_id=appt_a1.id,
        locataire_id=locataire1.id,
        date_debut=date(2026, 1, 1),
        date_fin=None,
        loyer_mensuel=150000,
        jour_paiement=5,
        depot_garantie=300000,
        statut=StatutContrat.ACTIF,
        lieu_signature="Douala",
        juridiction="Tribunal de Douala",
        points_cumules=250,
        points_disponibles=250,
    )

    contrat2 = Contrat(
        bailleur_id=bailleur.id,
        logement_id=appt_a2.id,
        locataire_id=locataire2.id,
        date_debut=date(2026, 3, 1),
        date_fin=None,
        loyer_mensuel=80000,
        jour_paiement=1,
        depot_garantie=160000,
        statut=StatutContrat.ACTIF,
        lieu_signature="Douala",
        points_cumules=0,
        points_disponibles=0,
    )

    db.add_all([contrat1, contrat2])
    db.flush()
    print(f"✓ Contrats créés (ids: {contrat1.id}, {contrat2.id})")

    db.commit()
    print("\n✅ Seed terminé avec succès !")
    print("\n── Comptes de test ──────────────────────────────────")
    print("  Admin      : admin@mykasa.cm          / test1234")
    print("  Bailleur   : jean.bailleur@test.cm    / test1234")
    print("  Locataire 1: paul.mballa@test.cm      / test1234  (250 pts, Appt A1 · 150 000 FCFA)")
    print("  Locataire 2: marie.nguemo@test.cm     / test1234  (0 pts,   Appt A2 · 80 000 FCFA)")
    print("─────────────────────────────────────────────────────")

except Exception as e:
    db.rollback()
    print(f"\n❌ Erreur : {e}")
    raise
finally:
    db.close()

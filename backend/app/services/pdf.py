import os

from fpdf import FPDF

STORAGE_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")
CONTRATS_DIR = os.path.join(STORAGE_ROOT, "contrats")
QUITTANCES_DIR = os.path.join(STORAGE_ROOT, "quittances")
os.makedirs(CONTRATS_DIR, exist_ok=True)
os.makedirs(QUITTANCES_DIR, exist_ok=True)


class LocalTrackPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(15, 118, 110)
        self.cell(0, 12, "LocalTrack", ln=True, align="L")
        self.set_draw_color(15, 118, 110)
        self.set_line_width(0.6)
        self.line(10, 22, 200, 22)
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, "Document genere automatiquement par LocalTrack", align="C")


def _row(pdf: LocalTrackPDF, label: str, value: str):
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(55, 8, label)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 8, value, new_x="LMARGIN", new_y="NEXT")


def generate_contrat_pdf(contrat, logement, locataire, bailleur) -> str:
    pdf = LocalTrackPDF(format="A4")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, f"Contrat de location n°{contrat.id}", ln=True)
    pdf.ln(4)

    _row(pdf, "Bailleur :", bailleur.full_name)
    _row(pdf, "Locataire :", f"{locataire.prenom} {locataire.nom}")
    _row(pdf, "Logement :", logement.nom)
    _row(pdf, "Date de debut :", contrat.date_debut.isoformat())
    _row(pdf, "Date de fin :", contrat.date_fin.isoformat() if contrat.date_fin else "Indeterminee")
    _row(pdf, "Loyer mensuel :", f"{contrat.loyer_mensuel:,.0f} FCFA")
    _row(pdf, "Jour de paiement :", f"Le {contrat.jour_paiement} de chaque mois")
    if contrat.depot_garantie:
        _row(pdf, "Depot de garantie :", f"{contrat.depot_garantie:,.0f} FCFA")
    pdf.ln(10)

    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(
        0,
        6,
        "Le present contrat engage le bailleur et le locataire nommes ci-dessus pour la location du "
        "logement designe, aux conditions de loyer et de duree indiquees. Toute modification devra "
        "faire l'objet d'un avenant signe par les deux parties.",
    )

    path = os.path.join(CONTRATS_DIR, f"contrat_{contrat.id}.pdf")
    pdf.output(path)
    return os.path.relpath(path, STORAGE_ROOT).replace("\\", "/")


def generate_quittance_pdf(quittance_numero: str, paiement, contrat, logement, locataire, bailleur) -> str:
    pdf = LocalTrackPDF(format="A4")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, f"Quittance de loyer n°{quittance_numero}", ln=True)
    pdf.ln(4)

    _row(pdf, "Bailleur :", bailleur.full_name)
    _row(pdf, "Locataire :", f"{locataire.prenom} {locataire.nom}")
    _row(pdf, "Logement :", logement.nom)
    _row(pdf, "Periode :", paiement.periode)
    _row(pdf, "Montant paye :", f"{paiement.montant:,.0f} FCFA")
    _row(pdf, "Date de paiement :", paiement.date_paiement.isoformat())
    _row(pdf, "Mode de paiement :", paiement.mode_paiement.value)
    pdf.ln(10)

    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(
        0,
        6,
        f"Je soussigne(e) {bailleur.full_name}, bailleur du logement {logement.nom}, reconnais avoir "
        f"recu de {locataire.prenom} {locataire.nom} la somme de {paiement.montant:,.0f} FCFA au titre "
        f"du loyer de la periode {paiement.periode}, et lui en donne quittance.",
    )

    path = os.path.join(QUITTANCES_DIR, f"quittance_{quittance_numero}.pdf")
    pdf.output(path)
    return os.path.relpath(path, STORAGE_ROOT).replace("\\", "/")

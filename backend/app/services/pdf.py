import os
from datetime import date

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.utils import ImageReader

STORAGE_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")
CONTRATS_DIR = os.path.join(STORAGE_ROOT, "contrats")
QUITTANCES_DIR = os.path.join(STORAGE_ROOT, "quittances")
os.makedirs(CONTRATS_DIR, exist_ok=True)
os.makedirs(QUITTANCES_DIR, exist_ok=True)

W, H = A4  # 595.28 x 841.89 pt
M = 20 * mm  # left/right margin
TW = W - 2 * M  # text width

FONT_NORMAL = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"


def _blank(value) -> str:
    """Return value as string, or a placeholder if empty."""
    if value is None or str(value).strip() == "":
        return "................................"
    return str(value)


def _fmt_date(d) -> str:
    if isinstance(d, date):
        return d.strftime("%d/%m/%Y")
    if d:
        return str(d)
    return "................................"


def _line(c: rl_canvas.Canvas, y: float, x1: float = None, x2: float = None):
    """Draw a horizontal rule."""
    c.line(x1 or M, y, x2 or (W - M), y)


def _field(c: rl_canvas.Canvas, label: str, value: str, x: float, y: float, label_w: float = 0) -> float:
    """Write 'label value' on one line; returns new y (same, one line consumed)."""
    c.setFont(FONT_BOLD, 10)
    c.drawString(x, y, label)
    c.setFont(FONT_NORMAL, 10)
    c.drawString(x + label_w if label_w else x + c.stringWidth(label, FONT_BOLD, 10) + 2, y, value)
    return y


def _paragraph(c: rl_canvas.Canvas, text: str, x: float, y: float, max_w: float, size: int = 9.5, leading: float = 13) -> float:
    """Wrap text into lines; returns updated y after last line."""
    words = text.split()
    line = ""
    c.setFont(FONT_NORMAL, size)
    for word in words:
        test = f"{line} {word}".strip()
        if c.stringWidth(test, FONT_NORMAL, size) <= max_w:
            line = test
        else:
            c.drawString(x, y, line)
            y -= leading
            line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def _section_title(c: rl_canvas.Canvas, text: str, x: float, y: float) -> float:
    c.setFont(FONT_BOLD, 10)
    c.drawString(x, y, text)
    return y - 14


def _embed_signature(c: rl_canvas.Canvas, url: str | None, x: float, y: float, w: float = 60 * mm, h: float = 20 * mm):
    """Embed a signature image if the URL points to an existing file."""
    if not url:
        return
    path = os.path.join(STORAGE_ROOT, "images", url.lstrip("/static/images/").lstrip("/"))
    if not os.path.exists(path):
        # try direct path relative to STORAGE_ROOT
        full = os.path.join(STORAGE_ROOT, url.removeprefix("/static/images/"))
        if os.path.exists(full):
            path = full
        else:
            return
    try:
        img = ImageReader(path)
        c.drawImage(img, x, y - h, width=w, height=h, preserveAspectRatio=True, mask="auto")
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────────────────────
# CONTRAT DE BAIL
# ──────────────────────────────────────────────────────────────────────────────

def generate_contrat_pdf(contrat, logement, locataire, bailleur) -> str:
    path = os.path.join(CONTRATS_DIR, f"contrat_{contrat.id}.pdf")
    c = rl_canvas.Canvas(path, pagesize=A4)

    # ── PAGE 1 ──────────────────────────────────────────────────────────────
    _page_contrat_1(c, contrat, logement, locataire, bailleur)
    c.showPage()

    # ── PAGE 2 ──────────────────────────────────────────────────────────────
    _page_contrat_2(c, contrat, logement, locataire, bailleur)
    c.showPage()

    c.save()
    return os.path.relpath(path, STORAGE_ROOT).replace("\\", "/")


def _page_contrat_1(c, contrat, logement, locataire, bailleur):
    y = H - 25 * mm

    # ── Titre ──
    c.setFont(FONT_BOLD, 16)
    c.drawCentredString(W / 2, y, "CONTRAT DE BAIL")
    y -= 6 * mm
    _line(c, y)
    y -= 8 * mm

    # ── Intro ──
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, "Entre les soussignés,")
    y -= 8 * mm

    # ── Bailleur ──
    bailleur_name = _blank(bailleur.full_name)
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, f"M./Mme. {bailleur_name}")
    y -= 7 * mm

    cni_b = _blank(bailleur.cni_numero)
    date_b = _fmt_date(getattr(bailleur, "cni_date_delivrance", None))
    lieu_b = _blank(getattr(bailleur, "cni_lieu_delivrance", None))
    c.drawString(M, y, f"CNI N° {cni_b}  du {date_b}  à {lieu_b}")
    y -= 7 * mm

    tel_b = _blank(bailleur.phone)
    c.drawString(M, y, f"Tél : {tel_b}")
    y -= 7 * mm

    c.setFont(FONT_BOLD, 10)
    c.drawRightString(W - M, y, "Le Bailleur : D'une part")
    y -= 10 * mm

    # ── Locataire ──
    loc_name = f"{_blank(locataire.prenom)} {_blank(locataire.nom)}"
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, f"Et M./Mme. {loc_name}")
    y -= 7 * mm

    dob = _fmt_date(locataire.date_naissance)
    lieu_naiss = _blank(getattr(locataire, "lieu_naissance", None))
    c.drawString(M, y, f"Né(e) le {dob}  à {lieu_naiss}")
    y -= 7 * mm

    adresse_loc = _blank(locataire.adresse)
    c.drawString(M, y, f"Domicilié à {adresse_loc}")
    y -= 7 * mm

    natl = _blank(getattr(locataire, "nationalite", None))
    mat = _blank(getattr(locataire, "statut_matrimonial", None))
    c.drawString(M, y, f"De nationalité {natl},  statut matrimonial {mat}")
    y -= 7 * mm

    nb_enf = locataire.nb_enfants if getattr(locataire, "nb_enfants", None) is not None else "..."
    c.drawString(M, y, f"Père/Mère de {nb_enf} enfant(s)")
    y -= 7 * mm

    cni_l = _blank(locataire.cni_numero)
    c.drawString(M, y, f"CNI/Passeport N° {cni_l}")
    y -= 7 * mm

    tel_l = _blank(locataire.telephone)
    c.drawString(M, y, f"Tél. {tel_l}")
    y -= 10 * mm

    # ── Convention ──
    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "I. IL A ÉTÉ ARRÊTÉ ET CONVENU CE QUI SUIT :")
    y -= 10 * mm

    # ── Désignation ──
    _line(c, y + 3 * mm)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(W / 2, y, "DÉSIGNATION")
    y -= 8 * mm
    _line(c, y + 5 * mm)

    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, "Le bailleur loue par les présentes au preneur qui accepte un local dont la teneur suit :")
    y -= 7 * mm

    # Logement description
    imm = logement.immeuble if hasattr(logement, "immeuble") else None
    adresse_bien = f"{logement.nom}"
    if imm:
        adresse_bien += f" — {imm.nom}, {imm.adresse}, {imm.ville}"
    y = _paragraph(c, adresse_bien, M, y, TW)
    y -= 6 * mm

    # ── Durée ──
    _line(c, y + 3 * mm)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(W / 2, y, "DURÉE")
    y -= 8 * mm
    _line(c, y + 5 * mm)

    duree = f"{contrat.duree_mois} mois" if getattr(contrat, "duree_mois", None) else "................................"
    date_deb = _fmt_date(contrat.date_debut)
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, f"Le présent bail est conclu pour une durée de {duree} et prend effet à compter")
    y -= 7 * mm
    c.drawString(M, y, f"du {date_deb}.")
    y -= 7 * mm
    c.drawString(M, y, "Il est renouvelable par tacite reconduction sauf dénonciation expresse de l'une des parties")
    y -= 7 * mm
    c.drawString(M, y, "notifiée trois mois à l'avance.")
    y -= 10 * mm

    # ── Clauses ──
    _line(c, y + 3 * mm)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(W / 2, y, "CLAUSES ET CONDITIONS")
    y -= 10 * mm
    _line(c, y + 5 * mm)

    clauses_p1 = [
        ("1 - USAGE",
         "Le preneur ne pourra donner à l'immeuble loué d'autre usage que celui d'habitation."),
        ("2 - ÉTAT DES LIEUX",
         "Le preneur occupera les lieux dans l'état où ils se trouvent au moment de son entrée en jouissance."),
        ("3 - TRANSFORMATION",
         "Aucune transformation sans accord du bailleur."),
    ]
    for title, body in clauses_p1:
        c.setFont(FONT_BOLD, 10)
        c.drawString(M, y, title)
        y -= 6 * mm
        c.setFont(FONT_NORMAL, 9.5)
        y = _paragraph(c, body, M + 4 * mm, y, TW - 4 * mm)
        y -= 4 * mm


def _page_contrat_2(c, contrat, logement, locataire, bailleur):
    y = H - 25 * mm

    clauses_p2 = [
        ("4 - RÈGLEMENT URBAIN",
         "Le preneur satisfera à toutes les prescriptions de police et d'hygiène."),
        ("5 - CESSION DE BAIL",
         "La sous-location ou cession est interdite."),
        ("6 - EAU - ÉLECTRICITÉ",
         "Les modalités de règlement seront précisées par les parties."),
        ("7 - REMISE DES CLÉS",
         "Les clés seront remises au bailleur à la fin du bail."),
    ]

    for title, body in clauses_p2:
        c.setFont(FONT_BOLD, 10)
        c.drawString(M, y, title)
        y -= 6 * mm
        c.setFont(FONT_NORMAL, 9.5)
        y = _paragraph(c, body, M + 4 * mm, y, TW - 4 * mm)
        y -= 4 * mm

    # Loyer
    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "8 - LOYER")
    y -= 6 * mm
    loyer = f"{int(contrat.loyer_mensuel):,}".replace(",", " ")
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M + 4 * mm, y, f"Le présent bail est consenti moyennant un loyer mensuel de {loyer} FCFA.")
    y -= 8 * mm

    depot = getattr(contrat, "depot_garantie", None)
    if depot:
        dep_fmt = f"{int(depot):,}".replace(",", " ")
        c.drawString(M + 4 * mm, y, f"Dépôt de garantie : {dep_fmt} FCFA.")
        y -= 8 * mm

    remaining_clauses = [
        ("9 - IMPÔT - DROIT D'ENREGISTREMENT",
         "Conformément à la réglementation applicable."),
        ("10 - RÉSILIATION",
         "Le présent contrat peut être résilié dans les conditions prévues par la loi et le présent contrat."),
    ]
    for title, body in remaining_clauses:
        c.setFont(FONT_BOLD, 10)
        c.drawString(M, y, title)
        y -= 6 * mm
        c.setFont(FONT_NORMAL, 9.5)
        y = _paragraph(c, body, M + 4 * mm, y, TW - 4 * mm)
        y -= 4 * mm

    # Élection de domicile
    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "11 - ÉLECTION DE DOMICILE")
    y -= 6 * mm
    juridiction = _blank(getattr(contrat, "juridiction", None))
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M + 4 * mm, y, f"Les parties élisent domicile dans le ressort de {juridiction}.")
    y -= 14 * mm

    _line(c, y + 4 * mm)
    y -= 2 * mm

    # Fait à / le
    lieu_sig = _blank(getattr(contrat, "lieu_signature", None))
    date_sig = _fmt_date(date.today())
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, f"Fait à {lieu_sig},  le {date_sig}")
    y -= 16 * mm

    # Signatures
    mid = W / 2
    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "LE PRENEUR")
    c.drawString(mid + 10 * mm, y, "LE BAILLEUR")
    y -= 6 * mm

    # Signature images or blank lines
    sig_loc_url = getattr(contrat, "signature_locataire_url", None)
    sig_bail_url = getattr(contrat, "signature_bailleur_url", None)

    if sig_loc_url:
        _embed_signature(c, sig_loc_url, M, y)
    else:
        c.setFont(FONT_NORMAL, 9)
        c.drawString(M, y - 8 * mm, "_" * 30)

    if sig_bail_url:
        _embed_signature(c, sig_bail_url, mid + 10 * mm, y)
    else:
        c.setFont(FONT_NORMAL, 9)
        c.drawString(mid + 10 * mm, y - 8 * mm, "_" * 30)

    # Noms sous les signatures
    y -= 22 * mm
    c.setFont(FONT_ITALIC, 9)
    loc_full = f"{locataire.prenom} {locataire.nom}"
    c.drawString(M, y, loc_full)
    c.drawString(mid + 10 * mm, y, bailleur.full_name)


# ──────────────────────────────────────────────────────────────────────────────
# QUITTANCE DE LOYER
# ──────────────────────────────────────────────────────────────────────────────

def generate_quittance_pdf(quittance_numero: str, paiement, contrat, logement, locataire, bailleur) -> str:
    path = os.path.join(QUITTANCES_DIR, f"quittance_{quittance_numero}.pdf")
    c = rl_canvas.Canvas(path, pagesize=A4)
    _page_quittance(c, quittance_numero, paiement, contrat, logement, locataire, bailleur)
    c.save()
    return os.path.relpath(path, STORAGE_ROOT).replace("\\", "/")


def _page_quittance(c, numero, paiement, contrat, logement, locataire, bailleur):
    y = H - 25 * mm

    # ── Titre ──
    c.setFont(FONT_BOLD, 16)
    c.drawCentredString(W / 2, y, "Quittance de loyer")
    y -= 6 * mm
    _line(c, y)
    y -= 10 * mm

    # ── Bailleur ──
    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "Bailleur")
    y -= 6 * mm
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, _blank(bailleur.full_name))
    y -= 10 * mm

    # ── Locataire + entête quittance ──
    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "Locataire Destinataire")
    # Numéro quittance à droite
    periode = paiement.periode  # e.g. "2024-01"
    c.drawRightString(W - M, y, f"Quittance de loyer du {periode}")
    y -= 6 * mm
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, f"{locataire.prenom} {locataire.nom}")
    y -= 12 * mm

    _line(c, y + 4 * mm)
    y -= 2 * mm

    # ── Corps ──
    loc_full = f"{locataire.prenom} {locataire.nom}"
    montant = int(paiement.montant)
    montant_fmt = f"{montant:,}".replace(",", " ")
    date_paiement = _fmt_date(paiement.date_paiement)

    imm = logement.immeuble if hasattr(logement, "immeuble") else None
    adresse_bien = logement.nom
    if imm:
        adresse_bien += f", {imm.adresse}, {imm.ville}"

    rows = [
        ("Reçu de :", loc_full),
        ("La somme de :", f"{montant_fmt} FCFA"),
        ("Le :", date_paiement),
    ]
    for label, val in rows:
        c.setFont(FONT_BOLD, 10)
        c.drawString(M, y, label)
        c.setFont(FONT_NORMAL, 10)
        c.drawString(M + 42 * mm, y, val)
        y -= 7 * mm

    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "Pour loyer et accessoires des locaux sis :")
    y -= 7 * mm
    c.setFont(FONT_NORMAL, 10)
    y = _paragraph(c, adresse_bien, M + 4 * mm, y, TW - 4 * mm)
    y -= 4 * mm

    # Période
    from calendar import monthrange
    import calendar
    try:
        year, month = map(int, paiement.periode.split("-"))
        first = date(year, month, 1)
        last = date(year, month, monthrange(year, month)[1])
        periode_label = f"du {_fmt_date(first)} au {_fmt_date(last)}"
    except Exception:
        periode_label = paiement.periode

    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, f"En paiement du terme {periode_label}")
    y -= 12 * mm

    # ── Détail ──
    _line(c, y + 4 * mm)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(W / 2, y, "Détail")
    y -= 8 * mm
    _line(c, y + 4 * mm)

    charges = float(getattr(paiement, "charges", None) or 0)
    loyer_nu = montant - charges
    solde = max(0, montant - montant)  # paiement reçu = montant → solde = 0

    detail_rows = [
        ("Loyer nu :", f"{int(loyer_nu):,} FCFA".replace(",", " ")),
        ("Charges :", f"{int(charges):,} FCFA".replace(",", " ")),
        ("Montant total :", f"{montant_fmt} FCFA"),
        ("Paiement reçu :", f"{montant_fmt} FCFA"),
        ("Solde à payer :", f"0 FCFA"),
    ]
    label_w = 45 * mm
    for label, val in detail_rows:
        c.setFont(FONT_BOLD, 10)
        c.drawString(M, y, label)
        c.setFont(FONT_NORMAL, 10)
        c.drawString(M + label_w, y, val)
        y -= 7 * mm

    y -= 8 * mm
    _line(c, y + 4 * mm)
    y -= 4 * mm

    # ── Fait à / signature ──
    lieu_q = _blank(getattr(contrat, "lieu_signature", None))
    c.setFont(FONT_NORMAL, 10)
    c.drawString(M, y, f"Fait à {lieu_q}  le {_fmt_date(date.today())}")
    y -= 10 * mm

    c.setFont(FONT_BOLD, 10)
    c.drawString(M, y, "Signature du Bailleur :")
    c.setFont(FONT_NORMAL, 10)
    # Quittance: just the name, no drawing
    c.drawString(M + 48 * mm, y, bailleur.full_name)
    y -= 6 * mm
    c.setFont(FONT_ITALIC, 9)
    c.drawString(M + 48 * mm, y, "(Bailleur)")

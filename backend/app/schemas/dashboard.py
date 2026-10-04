from pydantic import BaseModel


class DashboardStats(BaseModel):
    loyers_encaisses_mois: float
    montant_en_attente: float
    taux_impayes: float
    contrats_en_retard: int
    taux_occupation: float
    logements_occupes: int
    logements_vacants: int
    revenu_previsionnel: float
    nb_locataires: int
    revenus_par_mois: list[dict]
    revenus_par_logement: list[dict]
    # legacy
    loyers_en_retard_montant: float


class AdminStats(BaseModel):
    nb_bailleurs: int
    nb_locataires: int
    nb_immeubles: int
    nb_logements: int
    nb_contrats_actifs: int
    volume_paiements_mois: float
    repartition_plans: dict[str, int]

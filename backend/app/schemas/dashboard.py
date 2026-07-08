from pydantic import BaseModel


class DashboardStats(BaseModel):
    loyers_encaisses_mois: float
    loyers_en_retard_montant: float
    contrats_en_retard: int
    logements_occupes: int
    logements_vacants: int
    nb_locataires: int
    revenus_par_mois: list[dict]


class AdminStats(BaseModel):
    nb_bailleurs: int
    nb_locataires: int
    nb_immeubles: int
    nb_logements: int
    nb_contrats_actifs: int
    volume_paiements_mois: float
    repartition_plans: dict[str, int]

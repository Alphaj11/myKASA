export type UserRole = "ADMIN" | "BAILLEUR" | "LOCATAIRE" | "GESTIONNAIRE";
export type PlanType = "FREEMIUM" | "PREMIUM" | "AGENCE";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  plan: PlanType;
  is_active: boolean;
  created_at: string;
}

export interface Immeuble {
  id: number;
  bailleur_id: number;
  nom: string;
  adresse: string;
  ville: string;
  created_at: string;
  nb_logements: number;
}

export type TypeLogement = "STUDIO" | "APPARTEMENT" | "MAISON" | "CHAMBRE";
export type StatutLogement = "VACANT" | "OCCUPE";

export interface Logement {
  id: number;
  immeuble_id: number;
  nom: string;
  type: TypeLogement;
  loyer_mensuel: number;
  statut: StatutLogement;
  created_at: string;
}

export interface Locataire {
  id: number;
  bailleur_id: number;
  logement_id: number | null;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  piece_identite: string | null;
  created_at: string;
}

export type StatutContrat = "ACTIF" | "ARCHIVE" | "RESILIE";

export interface Contrat {
  id: number;
  bailleur_id: number;
  logement_id: number;
  locataire_id: number;
  date_debut: string;
  date_fin: string | null;
  loyer_mensuel: number;
  jour_paiement: number;
  depot_garantie: number | null;
  statut: StatutContrat;
  pdf_path: string | null;
  created_at: string;
}

export type ModePaiement = "ESPECES" | "VIREMENT" | "MOBILE_MONEY" | "AUTRE";

export interface Paiement {
  id: number;
  contrat_id: number;
  montant: number;
  periode: string;
  date_paiement: string;
  mode_paiement: ModePaiement;
  commentaire: string | null;
  created_at: string;
  quittance_id: number | null;
}

export interface Quittance {
  id: number;
  paiement_id: number;
  numero: string;
  pdf_path: string;
  genere_le: string;
}

export interface DashboardStats {
  loyers_encaisses_mois: number;
  loyers_en_retard_montant: number;
  contrats_en_retard: number;
  logements_occupes: number;
  logements_vacants: number;
  nb_locataires: number;
  revenus_par_mois: { mois: string; montant: number }[];
}

export interface AdminStats {
  nb_bailleurs: number;
  nb_locataires: number;
  nb_immeubles: number;
  nb_logements: number;
  nb_contrats_actifs: number;
  volume_paiements_mois: number;
  repartition_plans: Record<string, number>;
}

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
  is_email_verified: boolean;
  created_at: string;
  avatar_url: string | null;
  date_naissance: string | null;
  adresse: string | null;
  cni_numero: string | null;
  cni_url: string | null;
  cni_date_delivrance: string | null;
  cni_lieu_delivrance: string | null;
}

export interface Immeuble {
  id: number;
  bailleur_id: number;
  nom: string;
  adresse: string;
  ville: string;
  description: string | null;
  type_bien: string | null;
  superficie_totale: number | null;
  annee_construction: number | null;
  photo_principale_url: string | null;
  verification_level: number;
  declaration_acceptee: boolean;
  created_at: string;
  nb_logements: number;
}

export type TypeLogement = "STUDIO" | "APPARTEMENT" | "MAISON" | "CHAMBRE" | "VILLA" | "BUREAU";
export type StatutLogement = "VACANT" | "OCCUPE";

export interface Logement {
  id: number;
  immeuble_id: number;
  nom: string;
  type: TypeLogement;
  loyer_mensuel: number;
  statut: StatutLogement;
  description: string | null;
  superficie: number | null;
  etage: number | null;
  nb_chambres: number | null;
  nb_salles_de_bain: number | null;
  meuble: boolean;
  photo_principale_url: string | null;
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
  date_naissance: string | null;
  adresse: string | null;
  cni_numero: string | null;
  photo_url: string | null;
  profession: string | null;
  employeur: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  statut_matrimonial: string | null;
  nb_enfants: number | null;
  created_at: string;
}

export type StatutContrat = "EN_ATTENTE_SIGNATURE" | "ACTIF" | "ARCHIVE" | "RESILIE";

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
  duree_mois: number | null;
  lieu_signature: string | null;
  juridiction: string | null;
  statut: StatutContrat;
  pdf_path: string | null;
  signature_bailleur_url: string | null;
  signature_locataire_url: string | null;
  created_at: string;
  en_retard: boolean;
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

export interface MaFicheLocataire {
  id: number;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  logement_nom: string | null;
  immeuble_nom: string | null;
  bailleur_nom: string;
  bailleur_email: string;
  bailleur_telephone: string | null;
}

export interface MonContrat {
  id: number;
  logement_nom: string;
  immeuble_nom: string;
  bailleur_nom: string;
  date_debut: string;
  date_fin: string | null;
  loyer_mensuel: number;
  jour_paiement: number;
  depot_garantie: number | null;
  statut: StatutContrat;
  pdf_path: string | null;
  signature_locataire_url: string | null;
  created_at: string;
  en_retard: boolean;
}

export interface MonPaiement {
  id: number;
  contrat_id: number;
  logement_nom: string;
  montant: number;
  periode: string;
  date_paiement: string;
  mode_paiement: ModePaiement;
  quittance_id: number | null;
}

export interface MaQuittance {
  id: number;
  paiement_id: number;
  numero: string;
  periode: string;
  genere_le: string;
}

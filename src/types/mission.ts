// ─────────────────────────────────────────
// TYPES DE BASE
// ─────────────────────────────────────────

export type TypeHeure =
  | 'jour_semaine'
  | 'nuit_semaine'
  | 'jour_dimanche'
  | 'nuit_dimanche'
  | 'jour_ferie'
  | 'nuit_ferie'
  | 'manuel';

export interface Majoration {
  nuitSemaine: number;
  jourDimanche: number;
  nuitDimanche: number;
  jourFerie: number;
  nuitFerie: number;
}

/** Statut / catégorie d'agent avec son propre taux horaire de base */
export interface StatutAgent {
  id: string;
  nom: string;       // ex: "Agent de Sécurité (ADS)"
  tauxBase: number;  // €/h HT
}

/** Plage horaire définissant le début et la fin des heures de nuit */
export interface PlageNuit {
  debut: string;  // "HH:MM"
  fin: string;    // "HH:MM"
}

export interface TarifMission {
  statuts: StatutAgent[];
  majorations: Majoration;
  plageNuit: PlageNuit;
}

export interface JourFerie {
  id: string;
  date: string;  // YYYY-MM-DD
  nom: string;
}

// ─────────────────────────────────────────
// CLIENT & MISSION
// ─────────────────────────────────────────

export interface MissionClient {
  nom: string;
  adresse: string;
  email: string;
  siret: string;
}

export interface MissionInfo {
  numero_devis: string;
  date_emission: string;  // YYYY-MM-DD
  titre_evenement: string;
  lieu_evenement: string;
  validite: number;        // jours
}

// ─────────────────────────────────────────
// PRESTATIONS & LIGNES
// ─────────────────────────────────────────

export interface LigneFacturation {
  id: string;
  designation: string;
  statutId: string | null;  // null = taux manuel
  typeHeure: TypeHeure;
  quantite: number;
  pu_ht: number;
}

export interface Prestation {
  id: string;
  titre_bloc: string;
  description_texte: string;
  lignes_facturation: LigneFacturation[];
}

// ─────────────────────────────────────────
// DEVIS COMPLET
// ─────────────────────────────────────────

export interface DevisMission {
  id: string;
  client: MissionClient;
  mission: MissionInfo;
  prestations: Prestation[];
  tva: number;
  tarif: TarifMission;
  joursFeries: JourFerie[];
}

export interface TotauxMission {
  totalHT: number;
  montantTVA: number;
  totalTTC: number;
}

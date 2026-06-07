/**
 * @file Types TypeScript centralisés pour l'application Devis Sécurité
 * Aucun `any` TypeScript — tous les types sont définis ici
 */

// ─────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────

/** Type de jour déterminant la majoration applicable */
export type TypeJour = 'ferie' | 'dimanche' | 'semaine';

/** Nom des jours de la semaine (clés de JoursActifs) */
export type JourSemaineCle =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche';

// ─────────────────────────────────────────
// INFORMATIONS CLIENT
// ─────────────────────────────────────────

export interface ClientInfo {
  nom: string;
  adresse: string;
  /** Référence au format DEV-AAAA-XXXX */
  reference: string;
  /** Date ISO YYYY-MM-DD */
  dateCreation: string;
  /** Durée de validité en jours (défaut 30) */
  validite: number;
  commercial: string;
}

// ─────────────────────────────────────────
// POSTES DE TRAVAIL
// ─────────────────────────────────────────

/** Sélection des jours de la semaine actifs pour un poste */
export interface JoursActifs {
  lundi: boolean;
  mardi: boolean;
  mercredi: boolean;
  jeudi: boolean;
  vendredi: boolean;
  samedi: boolean;
  dimanche: boolean;
}

/** Poste de travail avec horaires jour et/ou nuit */
export interface Poste {
  id: string;
  libelle: string;
  /** Date ISO YYYY-MM-DD */
  dateDebut: string;
  /** Date ISO YYYY-MM-DD */
  dateFin: string;
  agents: number;

  /** Si true, les heures de jour sont actives */
  jourActif: boolean;
  /** Format HH:MM */
  heureJourDebut: string;
  /** Format HH:MM */
  heureJourFin: string;

  /** Si true, les heures de nuit sont actives */
  nuitActif: boolean;
  /** Format HH:MM */
  heureNuitDebut: string;
  /** Format HH:MM */
  heureNuitFin: string;

  joursActifs: JoursActifs;
}

// ─────────────────────────────────────────
// TARIFICATION
// ─────────────────────────────────────────

/** Majorations en pourcentage par type d'heure */
export interface Majorations {
  /** Heure de nuit en semaine (lun–sam) : défaut 10% */
  nuitSemaine: number;
  /** Heure de jour le dimanche : défaut 10% */
  jourDimanche: number;
  /** Heure de nuit le dimanche : défaut 20% */
  nuitDimanche: number;
  /** Heure de jour jour férié : défaut 100% */
  jourFerie: number;
  /** Heure de nuit jour férié : défaut 100% */
  nuitFerie: number;
}

/** Configuration tarifaire complète */
export interface Tarification {
  /** Taux horaire de base en $ (défaut 23) */
  tauxBase: number;
  majorations: Majorations;
  /** TVA en pourcentage (défaut 0) */
  tva: number;
}

// ─────────────────────────────────────────
// JOURS FÉRIÉS
// ─────────────────────────────────────────

export interface JourFerie {
  id: string;
  /** Date ISO YYYY-MM-DD */
  date: string;
  nom: string;
  /** true = calculé automatiquement, false = saisi manuellement */
  officiel: boolean;
}

// ─────────────────────────────────────────
// TABLEAU DE DÉCOMPOSITION
// ─────────────────────────────────────────

/** Une ligne du tableau de décomposition journalier */
export interface LigneDevis {
  /** Date ISO YYYY-MM-DD */
  date: string;
  libellePoste: string;
  jourSemaine: string;
  typeJour: TypeJour;
  heuresJourParAgent: number;
  heuresNuitParAgent: number;
  nbAgents: number;
  tauxJourEffectif: number;
  tauxNuitEffectif: number;
  totalJourHT: number;
  totalNuitHT: number;
  totalLigneHT: number;
}

// ─────────────────────────────────────────
// RÉCAPITULATIF
// ─────────────────────────────────────────

export interface Recapitulatif {
  totalHeuresJourSemaine: number;
  totalHeuresNuitSemaine: number;
  totalHeuresJourDimanche: number;
  totalHeuresNuitDimanche: number;
  totalHeuresJourFerie: number;
  totalHeuresNuitFerie: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  /** Coût total divisé par le nombre total d'agents sur la période */
  coutMoyenParAgent: number;
  /** Total des heures × agents travaillés */
  nbTotalAgentsHeures: number;
}

// ─────────────────────────────────────────
// DEVIS COMPLET
// ─────────────────────────────────────────

export interface Devis {
  id: string;
  clientInfo: ClientInfo;
  postes: Poste[];
  tarification: Tarification;
  joursFeries: JourFerie[];
  conditionsGenerales: string;
  /** Date ISO YYYY-MM-DD */
  dateCreation: string;
  /** Timestamp de la dernière modification */
  dateModification: string;
}

// ─────────────────────────────────────────
// HISTORIQUE
// ─────────────────────────────────────────

export interface HistoriqueEntry {
  id: string;
  reference: string;
  client: string;
  dateCreation: string;
  montantHT: number;
  /** Snapshot JSON du devis complet */
  snapshot: string;
}

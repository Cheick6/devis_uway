/**
 * @file Constantes par défaut : taux, majorations, textes légaux
 */

import type { Majorations, Tarification, JoursActifs } from '@/types/devis';

// ─────────────────────────────────────────
// PALETTE COULEURS
// ─────────────────────────────────────────

export const COLORS = {
  /** Bleu marine principal */
  primary: '#0A1628',
  /** Gris acier */
  secondary: '#4A5568',
  /** Blanc cassé fond */
  background: '#F7F8FA',
  /** Orange accent */
  accent: '#E85D04',
  /** Blanc pur */
  white: '#FFFFFF',
  /** Bordure légère */
  border: '#E2E8F0',
  /** Texte foncé */
  textDark: '#2D3748',
  /** Texte moyen */
  textMid: '#4A5568',
  /** Texte clair */
  textLight: '#718096',
  /** Rouge erreur */
  danger: '#E53E3E',
  /** Vert succès */
  success: '#38A169',
  /** Bleu info */
  info: '#3182CE',
  /** Fond carte */
  cardBg: '#FFFFFF',
  /** Fond section */
  sectionBg: '#F7F8FA',
  /** Overlay modal */
  overlay: 'rgba(10,22,40,0.5)',
} as const;

// ─────────────────────────────────────────
// MAJORATIONS PAR DÉFAUT
// ─────────────────────────────────────────

export const MAJORATIONS_DEFAUT: Majorations = {
  nuitSemaine: 10,
  jourDimanche: 10,
  nuitDimanche: 20,
  jourFerie: 100,
  nuitFerie: 100,
};

// ─────────────────────────────────────────
// TARIFICATION PAR DÉFAUT
// ─────────────────────────────────────────

export const TARIFICATION_DEFAUT: Tarification = {
  tauxBase: 23,
  majorations: MAJORATIONS_DEFAUT,
  tva: 0,
};

// ─────────────────────────────────────────
// JOURS ACTIFS PAR DÉFAUT (tous activés)
// ─────────────────────────────────────────

export const JOURS_ACTIFS_DEFAUT: JoursActifs = {
  lundi: true,
  mardi: true,
  mercredi: true,
  jeudi: true,
  vendredi: true,
  samedi: true,
  dimanche: true,
};

// ─────────────────────────────────────────
// ÉTIQUETTES JOURS
// ─────────────────────────────────────────

/** Étiquette courte pour chaque jour (pour les chips) */
export const JOURS_LABELS: Record<string, string> = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim',
};

/** Noms complets des jours de la semaine */
export const JOURS_SEMAINE_NOMS: string[] = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

// ─────────────────────────────────────────
// VALIDITÉ DEVIS PAR DÉFAUT
// ─────────────────────────────────────────

export const VALIDITE_DEFAUT_JOURS = 30;

// ─────────────────────────────────────────
// CONDITIONS GÉNÉRALES PAR DÉFAUT
// ─────────────────────────────────────────

export const CONDITIONS_GENERALES_DEFAUT = `CONDITIONS GÉNÉRALES DE VENTE

1. VALIDITÉ DU DEVIS
Le présent devis est valable pour la durée indiquée en première page à compter de sa date d'émission.

2. PRESTATIONS
Les prestations de sécurité sont assurées par du personnel qualifié et habilité conformément à la réglementation en vigueur. Tout changement de périmètre fera l'objet d'un avenant.

3. FACTURATION
La facturation est mensuelle, établie sur la base des heures effectivement réalisées selon les taux convenus. Les majorations (nuit, dimanche, jours fériés) sont appliquées conformément à la convention collective.

4. PAIEMENT
Paiement à 30 jours date de facture. Tout retard de paiement entraîne des pénalités au taux légal en vigueur.

5. RÉSILIATION
Résiliation possible avec un préavis de 30 jours par lettre recommandée avec accusé de réception.

6. RESPONSABILITÉ
Notre responsabilité est limitée aux dommages directs résultant d'une faute prouvée de notre personnel dans l'exercice de ses fonctions.`;

// ─────────────────────────────────────────
// INFORMATIONS SOCIÉTÉ
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// INFORMATIONS SOCIÉTÉ (mettre à jour avec vos vraies coordonnées)
// ─────────────────────────────────────────

export const SOCIETE_INFO = {
  initiales: 'UWS',
  nom: 'UWAYS Sécurité Privée',
  adresse: "6 rue d'Armaillé, 75017 Paris",
  telephone: '06 63 33 13 90',
  email: 'uways.sasu@gmail.com',
  siret: '— SIRET à compléter —',
  tvaIntracommunautaire: '— N° TVA à compléter —',
  autorisationExercice: 'AUT-075-2124-04-10-20250976481',
} as const;

// Conservé pour rétrocompatibilité PDF (exemple de référence)
export const NFS_INFO = {
  nom: 'NATIONAL FRANCE SECURITE',
  adresse: '28 Avenue Kléber, 77330 Ozoir-la-Ferrière FRANCE',
  siret: '853 679 132 00011',
  autorisationExercice: 'AUT-077-2119-01-17-20190713247',
  telephone: '07.72.21.37.52',
  email: 'national.france.securite@gmail.com',
} as const;

// ─────────────────────────────────────────
// LIMITES MÉTIER
// ─────────────────────────────────────────

/** Taux horaire minimum acceptable */
export const TAUX_MIN = 22;
/** Taux horaire maximum acceptable */
export const TAUX_MAX = 24;
/** Nombre max de devis conservés en historique */
export const HISTORIQUE_MAX = 5;

/**
 * @file Fonctions pures de calcul des majorations et du décompte horaire.
 * Aucun effet de bord — toutes les fonctions sont testables unitairement.
 */

import type {
  Poste,
  Tarification,
  JourFerie,
  LigneDevis,
  Recapitulatif,
  TypeJour,
  JourSemaineCle,
} from '@/types/devis';
import { buildJoursFeriesSet, estJourFerieDansSet } from '@/utils/feries';
import { JOURS_SEMAINE_NOMS } from '@/constants/taux';

// ─────────────────────────────────────────
// UTILITAIRES DATE
// ─────────────────────────────────────────

/**
 * Parse une chaîne ISO YYYY-MM-DD en objet Date (minuit UTC).
 * Évite les décalages de fuseau horaire liés à new Date(string).
 *
 * @param iso - Chaîne de date YYYY-MM-DD
 * @returns Objet Date à minuit heure locale
 */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formate une date en chaîne ISO YYYY-MM-DD.
 *
 * @param date - Objet Date
 * @returns Chaîne YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retourne le nom du jour de la semaine en français.
 *
 * @param dateISO - Date au format YYYY-MM-DD
 * @returns Nom du jour (ex: "Lundi")
 */
export function getJourSemaine(dateISO: string): string {
  const date = parseDate(dateISO);
  return JOURS_SEMAINE_NOMS[date.getDay()];
}

/**
 * Retourne la clé JourSemaineCle d'une date.
 * 0=dimanche, 1=lundi, …, 6=samedi
 *
 * @param dateISO - Date YYYY-MM-DD
 * @returns Clé correspondant à JoursActifs
 */
export function getJourSemaineCle(dateISO: string): JourSemaineCle {
  const map: JourSemaineCle[] = [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
  ];
  return map[parseDate(dateISO).getDay()];
}

/**
 * Génère toutes les dates entre deux dates (incluses).
 *
 * @param dateDebutISO - Date de début YYYY-MM-DD
 * @param dateFinISO   - Date de fin YYYY-MM-DD
 * @returns Tableau de chaînes YYYY-MM-DD
 */
export function genererDates(dateDebutISO: string, dateFinISO: string): string[] {
  const dates: string[] = [];
  const debut = parseDate(dateDebutISO);
  const fin = parseDate(dateFinISO);
  const courant = new Date(debut);

  while (courant <= fin) {
    dates.push(formatDateISO(courant));
    courant.setDate(courant.getDate() + 1);
  }
  return dates;
}

// ─────────────────────────────────────────
// DÉTECTION TYPE DE JOUR
// ─────────────────────────────────────────

/**
 * Détermine si une date est un dimanche.
 *
 * @param dateISO - Date YYYY-MM-DD
 * @returns true si dimanche
 */
export function estDimanche(dateISO: string): boolean {
  return parseDate(dateISO).getDay() === 0;
}

/**
 * Détermine le type de jour (férié > dimanche > semaine).
 * La priorité de détection est strictement appliquée :
 *   1. Jour férié (prime sur tout)
 *   2. Dimanche
 *   3. Semaine (lun-sam hors férié)
 *
 * @param dateISO   - Date YYYY-MM-DD
 * @param feriesSet - Set des dates fériées (pour O(1))
 * @returns TypeJour
 */
export function getTypeJour(dateISO: string, feriesSet: Set<string>): TypeJour {
  if (estJourFerieDansSet(dateISO, feriesSet)) return 'ferie';
  if (estDimanche(dateISO)) return 'dimanche';
  return 'semaine';
}

// ─────────────────────────────────────────
// CALCUL DES HEURES
// ─────────────────────────────────────────

/**
 * Calcule la durée en heures entre deux horaires HH:MM.
 * Gère le passage minuit (ex : 22:00 → 06:00 = 8h).
 *
 * @param debut - Horaire début "HH:MM"
 * @param fin   - Horaire fin "HH:MM"
 * @returns Durée en heures (arrondie à 2 décimales)
 */
export function calculerDureeHeures(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const [dH, dM] = debut.split(':').map(Number);
  const [fH, fM] = fin.split(':').map(Number);
  let dureeMinutes = (fH * 60 + fM) - (dH * 60 + dM);
  if (dureeMinutes < 0) dureeMinutes += 24 * 60; // passage minuit
  return Math.round((dureeMinutes / 60) * 100) / 100;
}

// ─────────────────────────────────────────
// CALCUL DES TAUX
// ─────────────────────────────────────────

/**
 * Retourne le pourcentage de majoration applicable selon le type de jour
 * et le type d'heure (jour ou nuit).
 *
 * Table de référence :
 *   Semaine jour   →  0%
 *   Semaine nuit   → +10%
 *   Dimanche jour  → +10%
 *   Dimanche nuit  → +20%
 *   Férié jour     → +100%
 *   Férié nuit     → +100%
 *
 * @param typeJour    - Type du jour
 * @param estNuit     - true pour heure de nuit
 * @param majorations - Objet des majorations configurées
 * @returns Pourcentage de majoration (ex: 10 pour +10%)
 */
export function getMajoration(
  typeJour: TypeJour,
  estNuit: boolean,
  majorations: Tarification['majorations'],
): number {
  if (typeJour === 'ferie') {
    return estNuit ? majorations.nuitFerie : majorations.jourFerie;
  }
  if (typeJour === 'dimanche') {
    return estNuit ? majorations.nuitDimanche : majorations.jourDimanche;
  }
  // semaine
  return estNuit ? majorations.nuitSemaine : 0;
}

/**
 * Calcule le taux horaire effectif après application de la majoration.
 *
 * @param tauxBase   - Taux de base en $/h
 * @param majoration - Pourcentage de majoration (ex: 10 pour +10%)
 * @returns Taux effectif arrondi à 2 décimales
 */
export function calculerTauxEffectif(tauxBase: number, majoration: number): number {
  return Math.round(tauxBase * (1 + majoration / 100) * 100) / 100;
}

// ─────────────────────────────────────────
// CALCUL LIGNE DEVIS
// ─────────────────────────────────────────

/**
 * Calcule une ligne de décomposition pour une date et un poste donnés.
 *
 * @param dateISO      - Date YYYY-MM-DD
 * @param poste        - Poste de travail
 * @param tarification - Configuration tarifaire
 * @param feriesSet    - Set des dates fériées
 * @returns LigneDevis calculée, ou null si le jour n'est pas actif
 */
export function calculerLigneDevis(
  dateISO: string,
  poste: Poste,
  tarification: Tarification,
  feriesSet: Set<string>,
): LigneDevis | null {
  // Vérifier si ce jour de la semaine est actif pour ce poste
  const cle = getJourSemaineCle(dateISO);
  if (!poste.joursActifs[cle]) return null;

  const typeJour = getTypeJour(dateISO, feriesSet);
  const jourSemaine = getJourSemaine(dateISO);

  // Heures par agent
  const heuresJourParAgent =
    poste.jourActif ? calculerDureeHeures(poste.heureJourDebut, poste.heureJourFin) : 0;
  const heuresNuitParAgent =
    poste.nuitActif ? calculerDureeHeures(poste.heureNuitDebut, poste.heureNuitFin) : 0;

  // Si aucune heure ce jour, pas de ligne
  if (heuresJourParAgent === 0 && heuresNuitParAgent === 0) return null;

  const { tauxBase, majorations } = tarification;

  const majorationJour = getMajoration(typeJour, false, majorations);
  const majorationNuit = getMajoration(typeJour, true, majorations);

  const tauxJourEffectif = calculerTauxEffectif(tauxBase, majorationJour);
  const tauxNuitEffectif = calculerTauxEffectif(tauxBase, majorationNuit);

  const totalJourHT =
    Math.round(tauxJourEffectif * heuresJourParAgent * poste.agents * 100) / 100;
  const totalNuitHT =
    Math.round(tauxNuitEffectif * heuresNuitParAgent * poste.agents * 100) / 100;
  const totalLigneHT = Math.round((totalJourHT + totalNuitHT) * 100) / 100;

  return {
    date: dateISO,
    libellePoste: poste.libelle,
    jourSemaine,
    typeJour,
    heuresJourParAgent,
    heuresNuitParAgent,
    nbAgents: poste.agents,
    tauxJourEffectif,
    tauxNuitEffectif,
    totalJourHT,
    totalNuitHT,
    totalLigneHT,
  };
}

/**
 * Calcule toutes les lignes de décomposition pour tous les postes.
 * Les lignes sont triées par date puis par libellé de poste.
 *
 * @param postes        - Liste des postes de travail
 * @param tarification  - Configuration tarifaire
 * @param joursFeries   - Liste des jours fériés
 * @returns Tableau de LigneDevis trié par date
 */
export function calculerLignesDevis(
  postes: Poste[],
  tarification: Tarification,
  joursFeries: JourFerie[],
): LigneDevis[] {
  const feriesSet = buildJoursFeriesSet(joursFeries);
  const lignes: LigneDevis[] = [];

  for (const poste of postes) {
    if (!poste.dateDebut || !poste.dateFin) continue;
    const dates = genererDates(poste.dateDebut, poste.dateFin);
    for (const date of dates) {
      const ligne = calculerLigneDevis(date, poste, tarification, feriesSet);
      if (ligne) lignes.push(ligne);
    }
  }

  // Tri par date puis libellé
  lignes.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.libellePoste.localeCompare(b.libellePoste);
  });

  return lignes;
}

// ─────────────────────────────────────────
// CALCUL RÉCAPITULATIF
// ─────────────────────────────────────────

/**
 * Calcule le récapitulatif global à partir des lignes de décomposition.
 *
 * @param lignes       - Tableau des lignes calculées
 * @param tarification - Configuration tarifaire (pour TVA)
 * @returns Récapitulatif complet avec totaux HT/TVA/TTC
 */
export function calculerRecapitulatif(
  lignes: LigneDevis[],
  tarification: Tarification,
): Recapitulatif {
  let totalHeuresJourSemaine = 0;
  let totalHeuresNuitSemaine = 0;
  let totalHeuresJourDimanche = 0;
  let totalHeuresNuitDimanche = 0;
  let totalHeuresJourFerie = 0;
  let totalHeuresNuitFerie = 0;
  let montantHT = 0;
  let nbTotalAgentsHeures = 0;

  for (const ligne of lignes) {
    const heuresJourTotal = ligne.heuresJourParAgent * ligne.nbAgents;
    const heuresNuitTotal = ligne.heuresNuitParAgent * ligne.nbAgents;

    switch (ligne.typeJour) {
      case 'semaine':
        totalHeuresJourSemaine += heuresJourTotal;
        totalHeuresNuitSemaine += heuresNuitTotal;
        break;
      case 'dimanche':
        totalHeuresJourDimanche += heuresJourTotal;
        totalHeuresNuitDimanche += heuresNuitTotal;
        break;
      case 'ferie':
        totalHeuresJourFerie += heuresJourTotal;
        totalHeuresNuitFerie += heuresNuitTotal;
        break;
    }

    montantHT += ligne.totalLigneHT;
    nbTotalAgentsHeures += heuresJourTotal + heuresNuitTotal;
  }

  montantHT = Math.round(montantHT * 100) / 100;
  const montantTVA = Math.round(montantHT * (tarification.tva / 100) * 100) / 100;
  const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;

  // Nombre total d'agents uniques (approximation : total agents-heures / durée moyenne)
  const nbAgentsUniques = lignes.length > 0
    ? Math.max(...lignes.map((l) => l.nbAgents))
    : 1;
  const coutMoyenParAgent =
    nbAgentsUniques > 0 ? Math.round((montantHT / nbAgentsUniques) * 100) / 100 : 0;

  return {
    totalHeuresJourSemaine: Math.round(totalHeuresJourSemaine * 100) / 100,
    totalHeuresNuitSemaine: Math.round(totalHeuresNuitSemaine * 100) / 100,
    totalHeuresJourDimanche: Math.round(totalHeuresJourDimanche * 100) / 100,
    totalHeuresNuitDimanche: Math.round(totalHeuresNuitDimanche * 100) / 100,
    totalHeuresJourFerie: Math.round(totalHeuresJourFerie * 100) / 100,
    totalHeuresNuitFerie: Math.round(totalHeuresNuitFerie * 100) / 100,
    montantHT,
    montantTVA,
    montantTTC,
    coutMoyenParAgent,
    nbTotalAgentsHeures: Math.round(nbTotalAgentsHeures * 100) / 100,
  };
}

// ─────────────────────────────────────────
// FORMATAGE
// ─────────────────────────────────────────

/**
 * Formate un nombre en montant monétaire lisible.
 *
 * @param montant - Nombre à formater
 * @param symbole - Symbole monétaire (défaut "€")
 * @returns Chaîne formatée (ex: "1 234,56 €")
 */
export function formatMontant(montant: number, symbole: string = '€'): string {
  return (
    montant
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
    ' ' +
    symbole
  );
}

/**
 * Formate une durée en heures de manière lisible.
 *
 * @param heures - Nombre d'heures (peut être décimal)
 * @returns Chaîne formatée (ex: "12h30")
 */
export function formatHeures(heures: number): string {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/**
 * Génère une référence de devis unique.
 *
 * @returns Référence au format DEV-AAAA-XXXX
 */
export function genererReference(): string {
  const annee = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `DEV-${annee}-${suffix}`;
}

/**
 * Retourne la date du jour au format YYYY-MM-DD.
 *
 * @returns Date ISO d'aujourd'hui
 */
export function getAujourdhuiISO(): string {
  return formatDateISO(new Date());
}

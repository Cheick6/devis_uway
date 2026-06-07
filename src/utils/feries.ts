/**
 * @file Calcul automatique des jours fériés français
 * Algorithme de Gauss pour la date de Pâques
 */

import type { JourFerie } from '@/types/devis';

// ─────────────────────────────────────────
// ALGORITHME DE PÂQUES (Gauss)
// ─────────────────────────────────────────

/**
 * Calcule la date de Pâques pour une année donnée
 * selon l'algorithme de Gauss.
 *
 * @param annee - Année civile (ex: 2026)
 * @returns Date de Pâques
 */
export function calculerPaques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

/**
 * Ajoute un nombre de jours à une date.
 *
 * @param date - Date de référence
 * @param jours - Nombre de jours à ajouter
 * @returns Nouvelle date
 */
function ajouterJours(date: Date, jours: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + jours);
  return result;
}

/**
 * Formate une date en chaîne ISO YYYY-MM-DD.
 *
 * @param date - Date à formater
 * @returns Chaîne YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─────────────────────────────────────────
// GÉNÉRATION DES JOURS FÉRIÉS
// ─────────────────────────────────────────

/**
 * Génère la liste complète des jours fériés français officiels
 * pour une année donnée.
 *
 * Inclut : 1er jan, Lundi de Pâques, 1er mai, 8 mai,
 * Ascension, Lundi de Pentecôte, 14 juillet, 15 août,
 * 1er novembre, 11 novembre, 25 décembre.
 *
 * @param annee - Année pour laquelle calculer les fériés
 * @returns Tableau de JourFerie (officiel: true)
 */
export function calculerJoursFeriesOfficielsFrance(annee: number): JourFerie[] {
  const paques = calculerPaques(annee);

  const feriesBase: Array<{ date: Date; nom: string }> = [
    { date: new Date(annee, 0, 1), nom: "Jour de l'An" },
    { date: ajouterJours(paques, 1), nom: 'Lundi de Pâques' },
    { date: new Date(annee, 4, 1), nom: 'Fête du Travail' },
    { date: new Date(annee, 4, 8), nom: 'Victoire 1945' },
    { date: ajouterJours(paques, 39), nom: 'Ascension' },
    { date: ajouterJours(paques, 50), nom: 'Lundi de Pentecôte' },
    { date: new Date(annee, 6, 14), nom: 'Fête Nationale' },
    { date: new Date(annee, 7, 15), nom: 'Assomption' },
    { date: new Date(annee, 10, 1), nom: 'Toussaint' },
    { date: new Date(annee, 10, 11), nom: 'Armistice 1918' },
    { date: new Date(annee, 11, 25), nom: 'Noël' },
  ];

  return feriesBase.map((f, index) => ({
    id: `officiel-${annee}-${index}`,
    date: formatDateISO(f.date),
    nom: f.nom,
    officiel: true,
  }));
}

/**
 * Retourne le Set des dates fériées (format YYYY-MM-DD)
 * pour une recherche rapide O(1).
 *
 * @param joursFeries - Tableau de jours fériés (officiels + custom)
 * @returns Set de chaînes de dates
 */
export function buildJoursFeriesSet(joursFeries: JourFerie[]): Set<string> {
  return new Set(joursFeries.map((f) => f.date));
}

/**
 * Vérifie si une date est un jour férié.
 *
 * @param dateISO - Date au format YYYY-MM-DD
 * @param feriesSet - Set des dates fériées (pré-calculé)
 * @returns true si jour férié
 */
export function estJourFerieDansSet(dateISO: string, feriesSet: Set<string>): boolean {
  return feriesSet.has(dateISO);
}

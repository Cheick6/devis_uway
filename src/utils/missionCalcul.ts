import type {
  Prestation,
  TotauxMission,
  TypeHeure,
  Majoration,
  TarifMission,
  StatutAgent,
  PlageNuit,
  JourFerie,
} from '@/types/mission';

// ─────────────────────────────────────────
// LABELS
// ─────────────────────────────────────────

export const LABELS_TYPE_HEURE: Record<TypeHeure, string> = {
  jour_semaine:  'Jour semaine',
  nuit_semaine:  'Nuit semaine',
  jour_dimanche: 'Jour dimanche',
  nuit_dimanche: 'Nuit dimanche',
  jour_ferie:    'Jour férié',
  nuit_ferie:    'Nuit férié',
  manuel:        'Manuel',
};

export const SHORT_LABELS_TYPE_HEURE: Record<TypeHeure, string> = {
  jour_semaine:  'J.Sem',
  nuit_semaine:  'N.Sem',
  jour_dimanche: 'J.Dim',
  nuit_dimanche: 'N.Dim',
  jour_ferie:    'J.Fér',
  nuit_ferie:    'N.Fér',
  manuel:        'Manuel',
};

export const ORDRE_TYPE_HEURE: TypeHeure[] = [
  'jour_semaine',
  'nuit_semaine',
  'jour_dimanche',
  'nuit_dimanche',
  'jour_ferie',
  'nuit_ferie',
  'manuel',
];

// ─────────────────────────────────────────
// CALCUL TAUX EFFECTIF
// ─────────────────────────────────────────

/** Retourne le pourcentage de majoration pour un type d'heure (0 pour jour_semaine). */
export function getPctMajoration(
  typeHeure: Exclude<TypeHeure, 'manuel'>,
  majorations: Majoration,
): number {
  const map: Record<Exclude<TypeHeure, 'manuel'>, number> = {
    jour_semaine:  0,
    nuit_semaine:  majorations.nuitSemaine,
    jour_dimanche: majorations.jourDimanche,
    nuit_dimanche: majorations.nuitDimanche,
    jour_ferie:    majorations.jourFerie,
    nuit_ferie:    majorations.nuitFerie,
  };
  return map[typeHeure];
}

/**
 * Calcule le PU HT à partir d'un taux de base et d'un type d'heure.
 * Retourne null pour 'manuel' (l'utilisateur saisit manuellement).
 */
export function calculerPUHT(
  typeHeure: TypeHeure,
  tauxBase: number,
  majorations: Majoration,
): number | null {
  if (typeHeure === 'manuel') return null;
  const pct = getPctMajoration(typeHeure, majorations);
  return Math.round(tauxBase * (1 + pct / 100) * 100) / 100;
}

/**
 * Calcule le PU HT en combinant un StatutAgent et un TypeHeure.
 * - Si typeHeure = 'manuel' et statut présent → retourne statut.tauxBase (taux brut, sans majo)
 * - Si typeHeure ≠ 'manuel' et statut présent → taux de base du statut × (1 + majo%)
 * - Si statut absent → null (saisie manuelle forcée)
 */
export function calculerPUHTStatut(
  typeHeure: TypeHeure,
  statut: StatutAgent | null,
  majorations: Majoration,
): number | null {
  if (!statut) return null;
  if (typeHeure === 'manuel') return Math.round(statut.tauxBase * 100) / 100;
  return calculerPUHT(typeHeure, statut.tauxBase, majorations);
}

// ─────────────────────────────────────────
// TOTAUX
// ─────────────────────────────────────────

export function calculerTotauxMission(
  prestations: Prestation[],
  tva: number,
): TotauxMission {
  let totalHT = 0;
  for (const p of prestations) {
    for (const l of p.lignes_facturation) {
      totalHT += l.quantite * l.pu_ht;
    }
  }
  totalHT = Math.round(totalHT * 100) / 100;
  const montantTVA = Math.round(totalHT * (tva / 100) * 100) / 100;
  const totalTTC = Math.round((totalHT + montantTVA) * 100) / 100;
  return { totalHT, montantTVA, totalTTC };
}

// ─────────────────────────────────────────
// FORMATAGE
// ─────────────────────────────────────────

export function formatDateFR(dateISO: string): string {
  if (!dateISO || dateISO.length < 10) return dateISO ?? '';
  const [y, m, d] = dateISO.split('-');
  return `${d}/${m}/${y}`;
}

// ─────────────────────────────────────────
// DÉCOMPOSITION DE PÉRIODE EN TYPES D'HEURES
// ─────────────────────────────────────────

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isoDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function isNuitMinutes(minutes: number, plageNuit: PlageNuit): boolean {
  const debut = parseHHMM(plageNuit.debut);
  const fin   = parseHHMM(plageNuit.fin);
  // Nuit couvre minuit (cas normal ex: 21:00–06:00) → debut >= fin
  return debut >= fin
    ? minutes >= debut || minutes < fin
    : minutes >= debut && minutes < fin;
}

function detectTypeHeure(
  date: Date,
  minutesMid: number,
  plageNuit: PlageNuit,
  joursFeries: JourFerie[],
): Exclude<TypeHeure, 'manuel'> {
  const iso      = isoDateStr(date);
  const ferie    = joursFeries.some((f) => f.date === iso);
  const dimanche = date.getDay() === 0;
  const nuit     = isNuitMinutes(minutesMid, plageNuit);
  if (ferie)    return nuit ? 'nuit_ferie'    : 'jour_ferie';
  if (dimanche) return nuit ? 'nuit_dimanche' : 'jour_dimanche';
  return nuit ? 'nuit_semaine' : 'jour_semaine';
}

/**
 * Décompose une période date/heure en sous-totaux par TypeHeure.
 * Utilise la plage nuit et les jours fériés configurés dans la mission.
 * Retourne un tableau vide si la période est invalide ou de durée nulle.
 */
export function decomposerPeriode(
  dateDebutStr: string,  // YYYY-MM-DD
  heureDebutStr: string, // HH:MM
  dateFinStr: string,    // YYYY-MM-DD
  heureFinStr: string,   // HH:MM
  plageNuit: PlageNuit,
  joursFeries: JourFerie[],
): { typeHeure: Exclude<TypeHeure, 'manuel'>; heures: number }[] {
  const debut = new Date(`${dateDebutStr}T${heureDebutStr}:00`);
  const fin   = new Date(`${dateFinStr}T${heureFinStr}:00`);
  if (isNaN(debut.getTime()) || isNaN(fin.getTime()) || fin <= debut) return [];

  const nuitDebutMin = parseHHMM(plageNuit.debut);
  const nuitFinMin   = parseHHMM(plageNuit.fin);

  // Points de transition : début, fin + minuits + transitions plage nuit de chaque journée
  const pts = new Set<number>([debut.getTime(), fin.getTime()]);

  const cursor = new Date(debut);
  cursor.setHours(0, 0, 0, 0); // minuit du jour de début

  while (cursor.getTime() <= fin.getTime()) {
    const t = cursor.getTime();
    if (t > debut.getTime() && t < fin.getTime()) pts.add(t);

    const nd = new Date(cursor);
    nd.setHours(Math.floor(nuitDebutMin / 60), nuitDebutMin % 60, 0, 0);
    const tnd = nd.getTime();
    if (tnd > debut.getTime() && tnd < fin.getTime()) pts.add(tnd);

    const nf = new Date(cursor);
    nf.setHours(Math.floor(nuitFinMin / 60), nuitFinMin % 60, 0, 0);
    const tnf = nf.getTime();
    if (tnf > debut.getTime() && tnf < fin.getTime()) pts.add(tnf);

    cursor.setDate(cursor.getDate() + 1);
  }

  const sorted = Array.from(pts).sort((a, b) => a - b);
  const acc: Partial<Record<Exclude<TypeHeure, 'manuel'>, number>> = {};

  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = sorted[i];
    const t2 = sorted[i + 1];
    const heures = (t2 - t1) / 3_600_000;
    if (heures < 0.0001) continue;
    const mid  = new Date((t1 + t2) / 2);
    const type = detectTypeHeure(mid, mid.getHours() * 60 + mid.getMinutes(), plageNuit, joursFeries);
    acc[type] = (acc[type] ?? 0) + heures;
  }

  return (Object.entries(acc) as [Exclude<TypeHeure, 'manuel'>, number][])
    .filter(([, h]) => h > 0.0001)
    .map(([typeHeure, heures]) => ({ typeHeure, heures: Math.round(heures * 100) / 100 }));
}

// ─────────────────────────────────────────
// FORMATAGE
// ─────────────────────────────────────────

export function formatMontantFR(montant: number): string {
  return (
    montant
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
    ' €'
  );
}

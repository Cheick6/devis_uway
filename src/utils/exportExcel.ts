/**
 * @file Génération Excel (.xlsx) via SheetJS + react-native-blob-util
 * Produit 3 feuilles pour l'ancien format et 1 feuille pour le format mission.
 */

import * as XLSX from 'xlsx';
import type { Devis, LigneDevis, Recapitulatif } from '@/types/devis';
import type { DevisMission } from '@/types/mission';
import { formatHeures } from '@/utils/calcul';
import { calculerTotauxMission } from '@/utils/missionCalcul';
import { SOCIETE_INFO } from '@/constants/taux';

// ─────────────────────────────────────────
// STYLE CELLULE HEADER
// ─────────────────────────────────────────

/** Largeur de colonne en nombre de caractères */
type ColWidth = { wch: number };

// ─────────────────────────────────────────
// FEUILLE 1 : DÉTAIL
// ─────────────────────────────────────────

/**
 * Construit la feuille "Détail" avec toutes les lignes jour par jour.
 *
 * @param lignes - Tableau des lignes calculées
 * @param devis  - Devis complet (pour les métadonnées)
 * @returns Feuille XLSX
 */
export function buildFeuilleDetail(lignes: LigneDevis[], devis: Devis): XLSX.WorkSheet {
  const headers = [
    'Date',
    'Libellé poste',
    'Jour semaine',
    'Type (férié/dim/semaine)',
    'H. Jour/Agent',
    'H. Nuit/Agent',
    'Nb Agents',
    'Taux Jour effectif (€)',
    'Taux Nuit effectif (€)',
    'Total Jour HT (€)',
    'Total Nuit HT (€)',
    'Total ligne HT (€)',
  ];

  const dataRows = lignes.map((ligne) => [
    ligne.date,
    ligne.libellePoste,
    ligne.jourSemaine,
    ligne.typeJour === 'ferie' ? 'Férié' : ligne.typeJour === 'dimanche' ? 'Dimanche' : 'Semaine',
    ligne.heuresJourParAgent,
    ligne.heuresNuitParAgent,
    ligne.nbAgents,
    ligne.tauxJourEffectif,
    ligne.tauxNuitEffectif,
    ligne.totalJourHT,
    ligne.totalNuitHT,
    ligne.totalLigneHT,
  ]);

  const wsData = [
    [`DEVIS ${devis.clientInfo.reference} — ${devis.clientInfo.nom}`],
    [`Exporté le ${new Date().toLocaleDateString('fr-FR')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largeurs de colonnes
  const colWidths: ColWidth[] = [
    { wch: 12 }, // Date
    { wch: 28 }, // Libellé
    { wch: 12 }, // Jour semaine
    { wch: 18 }, // Type
    { wch: 12 }, // H. Jour
    { wch: 12 }, // H. Nuit
    { wch: 10 }, // Agents
    { wch: 20 }, // Taux Jour
    { wch: 20 }, // Taux Nuit
    { wch: 18 }, // Total Jour
    { wch: 18 }, // Total Nuit
    { wch: 18 }, // Total ligne
  ];
  ws['!cols'] = colWidths;

  return ws;
}

// ─────────────────────────────────────────
// FEUILLE 2 : RÉCAPITULATIF
// ─────────────────────────────────────────

/**
 * Construit la feuille "Récapitulatif" avec les totaux par catégorie.
 *
 * @param recap - Récapitulatif calculé
 * @param devis - Devis complet
 * @returns Feuille XLSX
 */
export function buildFeuilleRecap(recap: Recapitulatif, devis: Devis): XLSX.WorkSheet {
  const wsData = [
    ['RÉCAPITULATIF DU DEVIS'],
    [`Réf. : ${devis.clientInfo.reference}`],
    [`Client : ${devis.clientInfo.nom}`],
    [],
    ['Type d\'heure', 'Total heures (agents)', 'Majoration'],
    ['Heures jour — semaine', recap.totalHeuresJourSemaine, '0 %'],
    ['Heures nuit — semaine', recap.totalHeuresNuitSemaine, `+${devis.tarification.majorations.nuitSemaine} %`],
    ['Heures jour — dimanche', recap.totalHeuresJourDimanche, `+${devis.tarification.majorations.jourDimanche} %`],
    ['Heures nuit — dimanche', recap.totalHeuresNuitDimanche, `+${devis.tarification.majorations.nuitDimanche} %`],
    ['Heures jour — férié', recap.totalHeuresJourFerie, `+${devis.tarification.majorations.jourFerie} %`],
    ['Heures nuit — férié', recap.totalHeuresNuitFerie, `+${devis.tarification.majorations.nuitFerie} %`],
    [],
    ['TOTAL heures (agents)', recap.nbTotalAgentsHeures, ''],
    [],
    ['Montant HT (€)', recap.montantHT, ''],
    [`TVA (${devis.tarification.tva} %) (€)`, recap.montantTVA, ''],
    ['TOTAL TTC (€)', recap.montantTTC, ''],
    [],
    ['Coût moyen / agent (€)', recap.coutMoyenParAgent, ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 16 }];
  return ws;
}

// ─────────────────────────────────────────
// FEUILLE 3 : PARAMÈTRES
// ─────────────────────────────────────────

/**
 * Construit la feuille "Paramètres" avec la configuration complète.
 *
 * @param devis - Devis complet
 * @returns Feuille XLSX
 */
export function buildFeuilleParametres(devis: Devis): XLSX.WorkSheet {
  const { clientInfo, tarification, joursFeries, postes } = devis;

  const wsData = [
    ['PARAMÈTRES DU DEVIS'],
    [],
    ['— INFORMATIONS CLIENT —'],
    ['Référence', clientInfo.reference],
    ['Nom client', clientInfo.nom],
    ['Adresse', clientInfo.adresse],
    ['Date de création', clientInfo.dateCreation],
    ['Validité (jours)', clientInfo.validite],
    ['Commercial', clientInfo.commercial],
    [],
    ['— TARIFICATION —'],
    ['Taux de base (€/h)', tarification.tauxBase],
    ['TVA (%)', tarification.tva],
    ['Majoration nuit semaine (%)', tarification.majorations.nuitSemaine],
    ['Majoration jour dimanche (%)', tarification.majorations.jourDimanche],
    ['Majoration nuit dimanche (%)', tarification.majorations.nuitDimanche],
    ['Majoration jour férié (%)', tarification.majorations.jourFerie],
    ['Majoration nuit férié (%)', tarification.majorations.nuitFerie],
    [],
    ['— POSTES DE TRAVAIL —'],
    ['Libellé', 'Date début', 'Date fin', 'Agents', 'H. Jour début', 'H. Jour fin', 'H. Nuit début', 'H. Nuit fin'],
    ...postes.map((p) => [
      p.libelle,
      p.dateDebut,
      p.dateFin,
      p.agents,
      p.jourActif ? p.heureJourDebut : '—',
      p.jourActif ? p.heureJourFin : '—',
      p.nuitActif ? p.heureNuitDebut : '—',
      p.nuitActif ? p.heureNuitFin : '—',
    ]),
    [],
    ['— JOURS FÉRIÉS —'],
    ['Date', 'Nom', 'Officiel'],
    ...joursFeries.map((f) => [f.date, f.nom, f.officiel ? 'Oui' : 'Non']),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  return ws;
}

// ─────────────────────────────────────────
// FEUILLE MISSION (nouveau format)
// ─────────────────────────────────────────

export function buildFeuillesMission(mission: DevisMission): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const totaux = calculerTotauxMission(mission.prestations, mission.tva);

  const headers = [
    "Type d'Agent / Prestation",
    "Catégorie d'heure",
    'Quantité',
    'Taux Unitaire (€)',
    'Total HT (€)',
  ];

  const dataRows: (string | number)[][] = [];
  for (const p of mission.prestations) {
    for (const l of p.lignes_facturation) {
      const montant = Math.round(l.quantite * l.pu_ht * 100) / 100;
      dataRows.push([p.titre_bloc, l.designation, l.quantite, l.pu_ht, montant]);
    }
  }

  const totalRow: (string | number)[] = ['', 'TOTAL HT', '', '', totaux.totalHT];
  const tvaRow: (string | number)[] = ['', `TVA ${mission.tva}%`, '', '', totaux.montantTVA];
  const ttcRow: (string | number)[] = ['', 'TOTAL TTC', '', '', totaux.totalTTC];

  const wsData = [
    [`Bon de commande N° ${mission.mission.numero_devis} — ${mission.client.nom}`],
    [`Date d'émission : ${mission.mission.date_emission}`],
    [],
    headers,
    ...dataRows,
    [],
    totalRow,
    tvaRow,
    ttcRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 48 },
    { wch: 34 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Tableau Heures');
  return wb;
}

// ─────────────────────────────────────────
// EXPORT PRINCIPAL — NATIF (iOS / Android)
// Sur web, Metro charge exportExcel.web.ts à la place.
// ─────────────────────────────────────────

export async function exporterExcel(
  devis: Devis,
  lignes: LigneDevis[],
  recap: Recapitulatif,
): Promise<void> {
  try {
    const RNBlobUtil = (await import('react-native-blob-util')).default;
    const Share = (await import('react-native-share')).default;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildFeuilleDetail(lignes, devis), 'Détail');
    XLSX.utils.book_append_sheet(wb, buildFeuilleRecap(recap, devis), 'Récapitulatif');
    XLSX.utils.book_append_sheet(wb, buildFeuilleParametres(devis), 'Paramètres');

    const fileName = `Devis_${devis.clientInfo.reference}_${devis.clientInfo.dateCreation}.xlsx`;
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const filePath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;

    await RNBlobUtil.fs.writeFile(filePath, wbout, 'base64');
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: `Devis ${devis.clientInfo.reference}`,
      filename: fileName,
      failOnCancel: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Échec de l'export Excel : ${message}`);
  }
}

export async function exporterMissionExcel(mission: DevisMission): Promise<void> {
  try {
    const RNBlobUtil = (await import('react-native-blob-util')).default;
    const Share = (await import('react-native-share')).default;

    const wb = buildFeuillesMission(mission);
    const fileName = `BDC_${mission.mission.numero_devis}.xlsx`;
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const filePath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;

    await RNBlobUtil.fs.writeFile(filePath, wbout, 'base64');
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: `Bon de commande ${mission.mission.numero_devis}`,
      filename: fileName,
      failOnCancel: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Échec de l'export Excel mission : ${message}`);
  }
}

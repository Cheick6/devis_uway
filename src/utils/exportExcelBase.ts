/**
 * @file Fonctions de construction des feuilles Excel — partagées entre native et web.
 * Ce fichier ne contient aucun import natif et peut être importé sur toutes les plateformes.
 */

import * as XLSX from 'xlsx';
import type { Devis, LigneDevis, Recapitulatif } from '@/types/devis';
import type { DevisMission } from '@/types/mission';
import { formatHeures } from '@/utils/calcul';
import { calculerTotauxMission } from '@/utils/missionCalcul';
import { SOCIETE_INFO } from '@/constants/taux';

type ColWidth = { wch: number };

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
  const colWidths: ColWidth[] = [
    { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  ];
  ws['!cols'] = colWidths;
  return ws;
}

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
      p.libelle, p.dateDebut, p.dateFin, p.agents,
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
      dataRows.push([p.titre_bloc, l.designation, l.quantite, l.pu_ht, Math.round(l.quantite * l.pu_ht * 100) / 100]);
    }
  }

  const wsData = [
    [`Bon de commande N° ${mission.mission.numero_devis} — ${mission.client.nom}`],
    [`Date d'émission : ${mission.mission.date_emission}`],
    [],
    headers,
    ...dataRows,
    [],
    ['', 'TOTAL HT', '', '', totaux.totalHT],
    ['', `TVA ${mission.tva}%`, '', '', totaux.montantTVA],
    ['', 'TOTAL TTC', '', '', totaux.totalTTC],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 48 }, { wch: 34 }, { wch: 12 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Tableau Heures');
  return wb;
}

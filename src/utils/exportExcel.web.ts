/**
 * @file Export Excel — version WEB
 * Metro charge ce fichier à la place de exportExcel.ts quand la cible est web.
 * Stratégie : Blob + lien <a> pour déclencher le téléchargement directement.
 */

import * as XLSX from 'xlsx';
import type { Devis, LigneDevis, Recapitulatif } from '@/types/devis';
import type { DevisMission } from '@/types/mission';
import {
  buildFeuilleDetail,
  buildFeuilleRecap,
  buildFeuilleParametres,
  buildFeuillesMission,
} from './exportExcelBase';

function downloadWorkbook(wb: XLSX.WorkBook, fileName: string): void {
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exporterExcel(
  devis: Devis,
  lignes: LigneDevis[],
  recap: Recapitulatif,
): Promise<void> {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildFeuilleDetail(lignes, devis), 'Détail');
  XLSX.utils.book_append_sheet(wb, buildFeuilleRecap(recap, devis), 'Récapitulatif');
  XLSX.utils.book_append_sheet(wb, buildFeuilleParametres(devis), 'Paramètres');
  downloadWorkbook(wb, `Devis_${devis.clientInfo.reference}_${devis.clientInfo.dateCreation}.xlsx`);
}

export async function exporterMissionExcel(mission: DevisMission): Promise<void> {
  downloadWorkbook(
    buildFeuillesMission(mission),
    `BDC_${mission.mission.numero_devis}.xlsx`,
  );
}

/**
 * @file Export PDF — version WEB
 * Metro charge ce fichier à la place de exportPDF.ts quand la cible est web.
 * Stratégie : injection dans un iframe caché + window.print()
 */

import type { Devis, LigneDevis, Recapitulatif } from '@/types/devis';
import type { DevisMission } from '@/types/mission';
import { genererHTMLDevis } from './exportPDF';
import { buildMissionHTML } from './missionPDFTemplate';

function printHTML(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("Impossible d'accéder au document iframe");
  doc.write(html);
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => document.body.removeChild(iframe), 3000);
}

export async function exporterPDF(
  devis: Devis,
  lignes: LigneDevis[],
  recap: Recapitulatif,
): Promise<void> {
  printHTML(genererHTMLDevis(devis, lignes, recap));
}

export async function exporterMissionPDF(mission: DevisMission): Promise<void> {
  printHTML(buildMissionHTML(mission));
}

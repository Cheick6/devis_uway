/**
 * @file Contenu HTML du devis — partagé entre les versions native et web.
 * Ce fichier ne contient aucun import natif (expo-print, expo-sharing, etc.)
 * et peut être importé sans risque sur toutes les plateformes.
 */

import type { Devis, LigneDevis, Recapitulatif } from '@/types/devis';
import { formatMontant, formatHeures } from '@/utils/calcul';
import { SOCIETE_INFO, COLORS } from '@/constants/taux';

// ─────────────────────────────────────────
// COULEURS PDF
// ─────────────────────────────────────────

const PDF_COLORS = {
  primary: COLORS.primary,
  accent: COLORS.accent,
  secondary: COLORS.secondary,
  bg: '#F7F8FA',
  white: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#E53E3E',
};

// ─────────────────────────────────────────
// TEMPLATES HTML PARTIELS
// ─────────────────────────────────────────

function buildHeader(devis: Devis): string {
  const expiration = new Date(devis.clientInfo.dateCreation);
  expiration.setDate(expiration.getDate() + devis.clientInfo.validite);
  const dateExp = expiration.toLocaleDateString('fr-FR');

  return `
    <div class="header">
      <div class="header-left">
        <div class="logo-placeholder">LOGO</div>
        <div class="societe-info">
          <h1>${SOCIETE_INFO.nom}</h1>
          <p>${SOCIETE_INFO.adresse}</p>
          <p>${SOCIETE_INFO.telephone} | ${SOCIETE_INFO.email}</p>
          <p>SIRET : ${SOCIETE_INFO.siret}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="devis-ref">
          <h2>DEVIS</h2>
          <p><strong>Réf :</strong> ${devis.clientInfo.reference}</p>
          <p><strong>Date :</strong> ${new Date(devis.clientInfo.dateCreation).toLocaleDateString('fr-FR')}</p>
          <p><strong>Validité :</strong> ${devis.clientInfo.validite} jours (jusqu'au ${dateExp})</p>
          <p><strong>Commercial :</strong> ${devis.clientInfo.commercial || '—'}</p>
        </div>
      </div>
    </div>
    <div class="client-block">
      <h3>Client / Donneur d'ordre</h3>
      <p><strong>${devis.clientInfo.nom || '—'}</strong></p>
      <p>${devis.clientInfo.adresse || '—'}</p>
    </div>
  `;
}

function getTypeBadge(type: 'ferie' | 'dimanche' | 'semaine'): string {
  switch (type) {
    case 'ferie': return 'Férié';
    case 'dimanche': return 'Dimanche';
    default: return 'Semaine';
  }
}

function buildTableauDecomposition(lignes: LigneDevis[]): string {
  if (lignes.length === 0) {
    return '<p class="empty">Aucune prestation saisie.</p>';
  }

  const rows = lignes
    .map(
      (ligne) => `
      <tr class="row-${ligne.typeJour}">
        <td>${new Date(ligne.date).toLocaleDateString('fr-FR')}</td>
        <td>${ligne.libellePoste}</td>
        <td>${ligne.jourSemaine}</td>
        <td class="badge-${ligne.typeJour}">${getTypeBadge(ligne.typeJour)}</td>
        <td class="num">${ligne.heuresJourParAgent > 0 ? formatHeures(ligne.heuresJourParAgent) : '—'}</td>
        <td class="num">${ligne.heuresNuitParAgent > 0 ? formatHeures(ligne.heuresNuitParAgent) : '—'}</td>
        <td class="num">${ligne.nbAgents}</td>
        <td class="num">${ligne.tauxJourEffectif > 0 ? formatMontant(ligne.tauxJourEffectif) : '—'}</td>
        <td class="num">${ligne.tauxNuitEffectif > 0 ? formatMontant(ligne.tauxNuitEffectif) : '—'}</td>
        <td class="num">${ligne.totalJourHT > 0 ? formatMontant(ligne.totalJourHT) : '—'}</td>
        <td class="num">${ligne.totalNuitHT > 0 ? formatMontant(ligne.totalNuitHT) : '—'}</td>
        <td class="num total">${formatMontant(ligne.totalLigneHT)}</td>
      </tr>
    `,
    )
    .join('');

  return `
    <h3>Décomposition détaillée des prestations</h3>
    <div class="table-wrapper">
      <table class="detail-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Poste</th>
            <th>Jour</th>
            <th>Type</th>
            <th>H. Jour/Agent</th>
            <th>H. Nuit/Agent</th>
            <th>Agents</th>
            <th>Taux Jour</th>
            <th>Taux Nuit</th>
            <th>Total Jour HT</th>
            <th>Total Nuit HT</th>
            <th>Total HT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildRecap(recap: Recapitulatif, devis: Devis): string {
  const maj = devis.tarification.majorations;
  return `
    <div class="recap-section">
      <div class="recap-grid">
        <div class="recap-block">
          <h3>Récapitulatif par type d'heure</h3>
          <table class="recap-table">
            <tr><td>Heures jour — semaine</td><td class="num">${formatHeures(recap.totalHeuresJourSemaine)}</td><td>Majoration : 0 %</td></tr>
            <tr><td>Heures nuit — semaine</td><td class="num">${formatHeures(recap.totalHeuresNuitSemaine)}</td><td>Majoration : +${maj.nuitSemaine} %</td></tr>
            <tr><td>Heures jour — dimanche</td><td class="num">${formatHeures(recap.totalHeuresJourDimanche)}</td><td>Majoration : +${maj.jourDimanche} %</td></tr>
            <tr><td>Heures nuit — dimanche</td><td class="num">${formatHeures(recap.totalHeuresNuitDimanche)}</td><td>Majoration : +${maj.nuitDimanche} %</td></tr>
            <tr><td>Heures jour — férié</td><td class="num">${formatHeures(recap.totalHeuresJourFerie)}</td><td>Majoration : +${maj.jourFerie} %</td></tr>
            <tr><td>Heures nuit — férié</td><td class="num">${formatHeures(recap.totalHeuresNuitFerie)}</td><td>Majoration : +${maj.nuitFerie} %</td></tr>
          </table>
        </div>
        <div class="recap-block totals">
          <h3>Totaux</h3>
          <div class="total-row"><span>Taux horaire de base</span><span>${formatMontant(devis.tarification.tauxBase)}/h</span></div>
          <div class="total-row"><span>Total heures (agents)</span><span>${formatHeures(recap.nbTotalAgentsHeures)}</span></div>
          <div class="total-row"><span>Coût moyen / agent</span><span>${formatMontant(recap.coutMoyenParAgent)}</span></div>
          <hr/>
          <div class="total-row"><span>Sous-total HT</span><span>${formatMontant(recap.montantHT)}</span></div>
          <div class="total-row"><span>TVA (${devis.tarification.tva} %)</span><span>${formatMontant(recap.montantTVA)}</span></div>
          <div class="total-row grand"><span>TOTAL TTC</span><span>${formatMontant(recap.montantTTC)}</span></div>
        </div>
      </div>
    </div>
  `;
}

function buildCSS(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Source+Sans+3:wght@400;600&display=swap');

      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Source Sans 3', 'Source Sans Pro', Arial, sans-serif;
        font-size: 10px;
        color: ${PDF_COLORS.primary};
        background: ${PDF_COLORS.white};
        padding: 20px;
      }

      h1, h2, h3 {
        font-family: 'Oswald', Arial, sans-serif;
        color: ${PDF_COLORS.primary};
      }

      h1 { font-size: 18px; }
      h2 { font-size: 16px; color: ${PDF_COLORS.accent}; }
      h3 { font-size: 12px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid ${PDF_COLORS.accent}; }

      /* EN-TÊTE */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;
        background: ${PDF_COLORS.primary};
        color: ${PDF_COLORS.white};
        margin-bottom: 16px;
        border-radius: 4px;
      }
      .header h1, .header h2, .header h3, .header p { color: ${PDF_COLORS.white}; }
      .header-left { display: flex; align-items: center; gap: 12px; }
      .logo-placeholder {
        width: 60px; height: 60px;
        background: ${PDF_COLORS.accent};
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 14px; border-radius: 4px;
      }
      .societe-info p { font-size: 9px; margin-top: 2px; opacity: 0.85; }
      .devis-ref { text-align: right; }
      .devis-ref p { font-size: 9px; margin-top: 2px; }

      /* CLIENT */
      .client-block {
        background: ${PDF_COLORS.bg};
        padding: 12px 16px;
        margin-bottom: 16px;
        border-left: 4px solid ${PDF_COLORS.accent};
        border-radius: 0 4px 4px 0;
      }
      .client-block h3 { border-bottom: none; font-size: 10px; color: ${PDF_COLORS.secondary}; margin-bottom: 4px; }
      .client-block p { font-size: 10px; }

      /* TABLEAU DETAIL */
      .table-wrapper { overflow-x: auto; margin-bottom: 16px; }
      .detail-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5px;
      }
      .detail-table th {
        background: ${PDF_COLORS.primary};
        color: ${PDF_COLORS.white};
        padding: 6px 4px;
        text-align: left;
        font-family: 'Oswald', Arial, sans-serif;
        font-size: 8px;
      }
      .detail-table td {
        padding: 5px 4px;
        border-bottom: 1px solid ${PDF_COLORS.border};
        vertical-align: middle;
      }
      .detail-table tr:nth-child(even) td { background: ${PDF_COLORS.bg}; }
      .num { text-align: right; }
      .total { font-weight: 600; color: ${PDF_COLORS.primary}; }

      /* BADGES TYPE */
      .badge-ferie { color: ${PDF_COLORS.danger}; font-weight: 600; }
      .badge-dimanche { color: ${PDF_COLORS.accent}; font-weight: 600; }
      .badge-semaine { color: ${PDF_COLORS.secondary}; }
      .row-ferie td { background: rgba(229, 62, 62, 0.05) !important; }
      .row-dimanche td { background: rgba(232, 93, 4, 0.05) !important; }

      /* RÉCAPITULATIF */
      .recap-section { margin-bottom: 16px; }
      .recap-grid { display: flex; gap: 16px; }
      .recap-block { flex: 1; }
      .recap-table { width: 100%; border-collapse: collapse; font-size: 9px; }
      .recap-table td { padding: 4px 6px; border-bottom: 1px solid ${PDF_COLORS.border}; }
      .recap-table tr:nth-child(even) td { background: ${PDF_COLORS.bg}; }

      .totals { background: ${PDF_COLORS.primary}; color: ${PDF_COLORS.white}; padding: 12px; border-radius: 4px; }
      .totals h3 { color: ${PDF_COLORS.white}; border-bottom-color: ${PDF_COLORS.accent}; }
      .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9px; }
      .total-row.grand {
        font-size: 13px; font-weight: 700; padding-top: 8px; margin-top: 4px;
        border-top: 2px solid ${PDF_COLORS.accent}; color: ${PDF_COLORS.accent};
        font-family: 'Oswald', Arial, sans-serif;
      }
      hr { border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 6px 0; }

      /* CONDITIONS */
      .conditions {
        margin-top: 16px;
        padding: 12px;
        background: ${PDF_COLORS.bg};
        border-radius: 4px;
        font-size: 8px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .conditions h3 { font-size: 10px; }

      /* FOOTER */
      .footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid ${PDF_COLORS.border};
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        color: ${PDF_COLORS.secondary};
      }

      .empty { color: ${PDF_COLORS.secondary}; font-style: italic; padding: 16px; text-align: center; }
    </style>
  `;
}

// ─────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────

/**
 * Génère le contenu HTML complet du devis PDF.
 */
export function genererHTMLDevis(
  devis: Devis,
  lignes: LigneDevis[],
  recap: Recapitulatif,
): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Devis ${devis.clientInfo.reference}</title>
      ${buildCSS()}
    </head>
    <body>
      ${buildHeader(devis)}
      ${buildTableauDecomposition(lignes)}
      ${buildRecap(recap, devis)}
      <div class="conditions">
        <h3>Conditions générales</h3>
        <p>${devis.conditionsGenerales}</p>
      </div>
      <div class="footer">
        <span>${SOCIETE_INFO.nom} — ${SOCIETE_INFO.siret}</span>
        <span>Réf. ${devis.clientInfo.reference}</span>
        <span>Généré le ${new Date().toLocaleDateString('fr-FR')}</span>
      </div>
    </body>
    </html>
  `;
}

import type { DevisMission } from '@/types/mission';
import { calculerTotauxMission, formatDateFR, formatMontantFR } from '@/utils/missionCalcul';
import { SOCIETE_INFO } from '@/constants/taux';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

export function buildMissionHTML(mission: DevisMission): string {
  const { client, mission: info, prestations, tva } = mission;
  const totaux = calculerTotauxMission(prestations, tva);

  const prestationRows = prestations
    .map(
      (p, i) => `
      <tr>
        <td colspan="4" class="prest-title">${i + 1}) ${esc(p.titre_bloc)}</td>
      </tr>
      <tr>
        <td colspan="4" class="prest-desc">${esc(p.description_texte)}</td>
      </tr>`,
    )
    .join('');

  const billingRows = prestations
    .flatMap((p) => p.lignes_facturation)
    .map((l) => {
      const montant = Math.round(l.quantite * l.pu_ht * 100) / 100;
      return `
      <tr>
        <td class="desig">${esc(l.designation)}</td>
        <td class="num">${l.quantite.toFixed(2)}</td>
        <td class="num">${formatMontantFR(l.pu_ht)}</td>
        <td class="num">${formatMontantFR(montant)}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; font-size:9.5pt; color:#111; background:#fff; }
  .page { padding:12mm 10mm 10mm; max-width:210mm; margin:0 auto; }

  .header { display:flex; justify-content:space-between; align-items:flex-start;
            border-bottom:2px solid #003060; padding-bottom:10px; margin-bottom:10px; }
  .header-left { display:flex; align-items:flex-start; gap:10px; }
  .logo { width:56px; height:56px; border-radius:50%; border:2.5px solid #003060;
          display:flex; align-items:center; justify-content:center;
          font-size:11pt; font-weight:900; color:#003060; flex-shrink:0; }
  .societe-nom { font-size:11pt; font-weight:700; color:#003060; margin-bottom:3px; }
  .societe-detail { font-size:7.5pt; color:#333; line-height:1.45; }
  .client-box { text-align:right; max-width:42%; }
  .client-nom { font-size:10pt; font-weight:700; color:#111; margin-bottom:3px; }
  .client-detail { font-size:8pt; color:#333; line-height:1.5; }

  .doc-title-section { text-align:center; margin:12px 0 8px; }
  .doc-title { font-size:13pt; font-weight:700; color:#003060; text-transform:uppercase;
               display:inline-block; border:2px solid #003060; padding:5px 18px; }
  .doc-meta { margin-top:5px; font-size:9pt; color:#444; }
  .doc-meta span { margin:0 14px; }

  table { width:100%; border-collapse:collapse; margin-top:10px; font-size:8.5pt; }
  thead tr th { background:#003060; color:#fff; padding:5px 7px; font-size:9pt;
                font-weight:700; border:1px solid #003060; }
  thead tr th:first-child { text-align:left; width:52%; }
  thead tr th:not(:first-child) { text-align:center; }
  tbody td { border:1px solid #ccc; padding:3.5px 7px; vertical-align:top; }
  .prest-title { font-weight:700; background:#eef2f7; color:#003060; font-size:9pt;
                 padding:5px 8px; border-top:2px solid #003060 !important; }
  .prest-desc { font-size:8pt; color:#333; line-height:1.55; background:#fafafa; padding:4px 8px; }
  .desig { width:52%; }
  .num { text-align:right; white-space:nowrap; }
  .sep td { background:#e8ecf0; height:4px; border:none; }
  .total-row td { font-weight:700; background:#f0f4f8; }
  .tva-row td { color:#555; }
  .ttc-row td { font-weight:700; font-size:10.5pt; background:#003060; color:#fff; border-color:#003060 !important; }

  .conditions { margin-top:14px; border-top:1px solid #bbb; padding-top:10px; }
  .cond-intro { font-size:8pt; color:#222; line-height:1.55; margin-bottom:6px; }
  .cond-accord { font-size:8pt; font-style:italic; color:#003060; margin-bottom:6px; }
  .cond-docs-title { font-size:8pt; font-weight:700; color:#111; margin-bottom:3px; }
  .cond-list { font-size:7.5pt; color:#333; line-height:1.5; padding-left:14px; margin-bottom:6px; }
  .cond-bullets { font-size:7.5pt; color:#333; line-height:1.6; }
  .cond-bullets p { margin-bottom:2px; padding-left:10px; text-indent:-10px; }
  .cond-bullets p::before { content:"• "; font-weight:700; }

  .sig-block { margin-top:16px; }
  .sig-label { font-size:9pt; font-weight:700; }
  .sig-sub { font-size:8pt; color:#555; font-style:italic; margin-top:2px; }
  .sig-box { border:1px solid #bbb; height:55px; margin-top:6px; width:45%; }

  .page-footer { margin-top:16px; border-top:2px solid #003060; padding-top:7px; text-align:center; }
  .footer-nom { font-size:9.5pt; font-weight:700; color:#003060; }
  .footer-addr { font-size:7.5pt; color:#444; margin-top:2px; }
  .footer-cnaps { font-size:7.5pt; color:#444; margin-top:1px; }
  .footer-siret { font-size:7.5pt; color:#444; margin-top:1px; }
  .footer-legal { font-size:7pt; color:#888; margin-top:3px; font-style:italic; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="logo">${SOCIETE_INFO.initiales}</div>
      <div>
        <div class="societe-nom">${SOCIETE_INFO.nom}</div>
        <div class="societe-detail">
          ${SOCIETE_INFO.adresse}<br/>
          Autorisation CNAPS&nbsp;: ${SOCIETE_INFO.autorisationExercice}<br/>
          Tél&nbsp;: ${SOCIETE_INFO.telephone}<br/>
          @&nbsp;: ${SOCIETE_INFO.email}
        </div>
      </div>
    </div>
    <div class="client-box">
      <div class="client-nom">${esc(client.nom)}</div>
      <div class="client-detail">
        ${esc(client.adresse).replace(/, /g, '<br/>')}
        ${client.siret ? '<br/>' + esc(client.siret) : ''}
        ${client.email ? '<br/>' + esc(client.email) : ''}
      </div>
    </div>
  </div>

  <div class="doc-title-section">
    <div class="doc-title">Bon de commande N° ${esc(info.numero_devis)}</div>
    <div class="doc-meta">
      <span>Date d'émission&nbsp;: ${formatDateFR(info.date_emission)}</span>
      <span>Validité&nbsp;: ${info.validite} jours</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th style="width:11%">Quantité</th>
        <th style="width:13%">PU HT</th>
        <th style="width:14%">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${prestationRows}
      <tr class="sep"><td colspan="4"></td></tr>
      ${billingRows}
      <tr class="sep"><td colspan="4"></td></tr>
      <tr class="total-row">
        <td colspan="3" style="text-align:right">TOTAL HT</td>
        <td class="num">${formatMontantFR(totaux.totalHT)}</td>
      </tr>
      <tr class="tva-row">
        <td colspan="3" style="text-align:right">TVA ${tva}&nbsp;%</td>
        <td class="num">${formatMontantFR(totaux.montantTVA)}</td>
      </tr>
      <tr class="ttc-row">
        <td colspan="3" style="text-align:right">TOTAL TTC</td>
        <td class="num">${formatMontantFR(totaux.totalTTC)}</td>
      </tr>
    </tbody>
  </table>

  <div class="conditions">
    <p class="cond-intro">
      <strong>Conditions de règlement&nbsp;:</strong> virement bancaire à 45 jours fin du mois,
      dossier de la société et des agents ainsi que le contrat de sous-traitance signé.
      L'acceptation du bon de commande confirme la disposition des effectifs. Le paiement des
      factures émises au titre du présent bon de commande interviendra après encaissement effectif
      des sommes correspondantes auprès du client final.
    </p>
    <p class="cond-accord">
      &laquo;&nbsp;Accord du sous-traitant (Cachet et signature précédé de la mention &laquo;&nbsp;Bon pour accord&nbsp;&raquo;)
    </p>
    <div class="cond-docs-title">Les documents suivants devront être retournés par mail avant le début de la prestation&nbsp;:</div>
    <ul class="cond-list">
      <li>Présent bon de commande et Contrat de sous-traitance signé et validé</li>
      <li>Dossier de la société (Kbis, Attestations URSSAF et régularité fiscale de moins de 3&nbsp;mois,
          Autorisation d'exercice et Agrément dirigeant valide délivrés par le CNAPS,
          Attestation de lutte contre le travail dissimulé…)</li>
      <li>Dossiers complets des agents intervenants (DUE, Carte professionnelle, CNI ou titre de séjour valide)
          et Planning avec nom/prénom de chaque intervenant.</li>
    </ul>
    <div class="cond-bullets">
      <p>Le remplacement d'un agent ne pourra être fait sans validation du dossier par la société ${SOCIETE_INFO.nom}</p>
      <p>Aucun paiement de facture ne pourra intervenir avant la réception complète des éléments demandés</p>
      <p>Aucune sous-traitance en cascade n'est autorisée, comme stipulé dans le contrat de sous-traitance</p>
      <p>Tout dépassement devra avoir fait l'objet d'un accord préalable par la société ${SOCIETE_INFO.nom},
         aucune facturation supplémentaire ne sera accordée sans en avoir été avisé.</p>
      <p>La réglementation sur le temps de travail et le respect du Code du Travail doit être scrupuleusement respectée</p>
      <p>Le présent bon de commande pourra être annulé ou modifié à tout moment par simple envoi de mail.</p>
    </div>
  </div>

  <div class="sig-block">
    <div class="sig-label">Signature</div>
    <div class="sig-sub">Précédée de la mention &laquo;&nbsp;Bon pour accord&nbsp;&raquo;</div>
    <div class="sig-box"></div>
  </div>

  <div class="page-footer">
    <div class="footer-nom">${SOCIETE_INFO.nom}</div>
    <div class="footer-addr">${SOCIETE_INFO.adresse}</div>
    <div class="footer-cnaps">Numéro d'autorisation CNAPS&nbsp;: ${SOCIETE_INFO.autorisationExercice}</div>

    <div class="footer-legal">Art. L612-14 du CSI&nbsp;: L'autorisation d'exercice ne confère aucune
      prérogative de puissance publique à l'entreprise ou aux personnes qui en bénéficient.</div>
  </div>

</div>
</body>
</html>`;
}

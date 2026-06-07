/**
 * @file Section 5 — Tableau de décomposition et récapitulatif financier.
 * Mis à jour en temps réel via le store Zustand.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useDevisCalculation } from '@/hooks/useDevisCalculation';
import { useDevisStore } from '@/store/devisStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { COLORS } from '@/constants/taux';
import { formatMontant, formatHeures } from '@/utils/calcul';
import type { LigneDevis } from '@/types/devis';

// ─────────────────────────────────────────
// COULEURS PAR TYPE DE JOUR
// ─────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  ferie: { bg: '#FFF5F5', text: COLORS.danger, badge: 'Férié' },
  dimanche: { bg: '#FFFAF0', text: COLORS.accent, badge: 'Dim.' },
  semaine: { bg: COLORS.white, text: COLORS.textMid, badge: 'Sem.' },
};

// ─────────────────────────────────────────
// EN-TÊTE DU TABLEAU
// ─────────────────────────────────────────

/**
 * En-tête fixe des colonnes du tableau de décomposition.
 */
function TableHeader(): React.ReactElement {
  return (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerCell, styles.colDate]}>Date</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colPoste]}>Poste</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colJour]}>Jour</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colType]}>Type</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colHeure]}>H.Jour/Ag</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colHeure]}>H.Nuit/Ag</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colAgents]}>Agents</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colTaux]}>T.Jour</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colTaux]}>T.Nuit</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colTotal]}>Tot.Jour</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colTotal]}>Tot.Nuit</Text>
      <Text style={[styles.cell, styles.headerCell, styles.colGrand]}>TOTAL HT</Text>
    </View>
  );
}

// ─────────────────────────────────────────
// LIGNE DU TABLEAU
// ─────────────────────────────────────────

interface LigneRowProps {
  ligne: LigneDevis;
  isEven: boolean;
}

function LigneRow({ ligne, isEven }: LigneRowProps): React.ReactElement {
  const typeColor = TYPE_COLORS[ligne.typeJour];
  const dateFormatee = new Date(ligne.date + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <View style={[styles.row, { backgroundColor: isEven ? typeColor.bg : COLORS.white }]}>
      <Text style={[styles.cell, styles.colDate, styles.cellMono]}>{dateFormatee}</Text>
      <Text style={[styles.cell, styles.colPoste]} numberOfLines={2}>{ligne.libellePoste}</Text>
      <Text style={[styles.cell, styles.colJour, styles.cellSmall]}>{ligne.jourSemaine.slice(0, 3)}</Text>
      <View style={[styles.cell, styles.colType]}>
        <Text style={[styles.typeBadge, { color: typeColor.text }]}>{typeColor.badge}</Text>
      </View>
      <Text style={[styles.cell, styles.colHeure, styles.cellNum]}>
        {ligne.heuresJourParAgent > 0 ? formatHeures(ligne.heuresJourParAgent) : '—'}
      </Text>
      <Text style={[styles.cell, styles.colHeure, styles.cellNum]}>
        {ligne.heuresNuitParAgent > 0 ? formatHeures(ligne.heuresNuitParAgent) : '—'}
      </Text>
      <Text style={[styles.cell, styles.colAgents, styles.cellNum]}>{ligne.nbAgents}</Text>
      <Text style={[styles.cell, styles.colTaux, styles.cellNum]}>
        {ligne.heuresJourParAgent > 0 ? ligne.tauxJourEffectif.toFixed(2) : '—'}
      </Text>
      <Text style={[styles.cell, styles.colTaux, styles.cellNum]}>
        {ligne.heuresNuitParAgent > 0 ? ligne.tauxNuitEffectif.toFixed(2) : '—'}
      </Text>
      <Text style={[styles.cell, styles.colTotal, styles.cellNum]}>
        {ligne.totalJourHT > 0 ? ligne.totalJourHT.toFixed(2) : '—'}
      </Text>
      <Text style={[styles.cell, styles.colTotal, styles.cellNum]}>
        {ligne.totalNuitHT > 0 ? ligne.totalNuitHT.toFixed(2) : '—'}
      </Text>
      <Text style={[styles.cell, styles.colGrand, styles.cellNum, styles.cellBold]}>
        {formatMontant(ligne.totalLigneHT)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────
// RÉCAPITULATIF
// ─────────────────────────────────────────

/**
 * Bloc récapitulatif avec totaux par catégorie et montants HT/TVA/TTC.
 */
function RecapBlock(): React.ReactElement {
  const { recapitulatif } = useDevisCalculation();
  const tva = useDevisStore((state) => state.devis.tarification.tva);
  const majorations = useDevisStore((state) => state.devis.tarification.majorations);

  const categories = [
    { label: 'Heures jour — semaine', heures: recapitulatif.totalHeuresJourSemaine, maj: 0 },
    { label: 'Heures nuit — semaine', heures: recapitulatif.totalHeuresNuitSemaine, maj: majorations.nuitSemaine },
    { label: 'Heures jour — dimanche', heures: recapitulatif.totalHeuresJourDimanche, maj: majorations.jourDimanche },
    { label: 'Heures nuit — dimanche', heures: recapitulatif.totalHeuresNuitDimanche, maj: majorations.nuitDimanche },
    { label: 'Heures jour — férié', heures: recapitulatif.totalHeuresJourFerie, maj: majorations.jourFerie },
    { label: 'Heures nuit — férié', heures: recapitulatif.totalHeuresNuitFerie, maj: majorations.nuitFerie },
  ];

  return (
    <View style={styles.recap}>
      <Text style={styles.recapTitle}>Récapitulatif</Text>

      {/* Catégories */}
      <View style={styles.recapCategories}>
        {categories.map(({ label, heures, maj }) => (
          <View key={label} style={styles.recapCatRow}>
            <Text style={styles.recapCatLabel}>{label}</Text>
            <Text style={styles.recapCatVal}>{formatHeures(heures)}</Text>
            <Text style={styles.recapCatMaj}>+{maj}%</Text>
          </View>
        ))}
        <View style={[styles.recapCatRow, styles.recapTotalRow]}>
          <Text style={styles.recapTotalLabel}>Total heures (agents)</Text>
          <Text style={styles.recapTotalVal}>{formatHeures(recapitulatif.nbTotalAgentsHeures)}</Text>
          <Text style={styles.recapCatMaj}> </Text>
        </View>
      </View>

      {/* Montants */}
      <View style={styles.recapMontants}>
        <View style={styles.montantRow}>
          <Text style={styles.montantLabel}>Coût moyen / agent</Text>
          <Text style={styles.montantVal}>{formatMontant(recapitulatif.coutMoyenParAgent)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.montantRow}>
          <Text style={styles.montantLabel}>Sous-total HT</Text>
          <Text style={styles.montantVal}>{formatMontant(recapitulatif.montantHT)}</Text>
        </View>
        <View style={styles.montantRow}>
          <Text style={styles.montantLabel}>TVA ({tva} %)</Text>
          <Text style={styles.montantVal}>{formatMontant(recapitulatif.montantTVA)}</Text>
        </View>
        <View style={[styles.montantRow, styles.montantTTC]}>
          <Text style={styles.montantTTCLabel}>TOTAL TTC</Text>
          <Text style={styles.montantTTCVal}>{formatMontant(recapitulatif.montantTTC)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────

/**
 * Section 5 — Tableau de décomposition journalière + récapitulatif.
 */
export function DevisTable(): React.ReactElement {
  const { lignes, hasData } = useDevisCalculation();
  const [showTable, setShowTable] = useState(true);

  return (
    <SectionCard
      title="Tableau de décomposition"
      step="5"
      action={
        <TouchableOpacity onPress={() => setShowTable((v) => !v)}>
          <Text style={styles.toggleBtn}>{showTable ? 'Masquer ▲' : 'Afficher ▼'}</Text>
        </TouchableOpacity>
      }
    >
      {!hasData ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Ajoutez des postes de travail pour voir le tableau de décomposition.
          </Text>
        </View>
      ) : (
        <>
          {showTable && (
            <View style={styles.tableContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <TableHeader />
                  {lignes.map((ligne, idx) => (
                    <LigneRow
                      key={`${ligne.date}-${ligne.libellePoste}-${idx}`}
                      ligne={ligne}
                      isEven={idx % 2 === 0}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          <RecapBlock />
        </>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  toggleBtn: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 13,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },

  // Tableau
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    backgroundColor: COLORS.primary,
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 11,
    color: COLORS.textDark,
    justifyContent: 'center',
  },
  headerCell: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 10,
  },
  cellMono: {
    fontVariant: ['tabular-nums'],
  },
  cellNum: {
    textAlign: 'right',
  },
  cellSmall: {
    fontSize: 10,
  },
  cellBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Largeurs colonnes
  colDate: { width: 46 },
  colPoste: { width: 90, flexShrink: 1 },
  colJour: { width: 34 },
  colType: { width: 38 },
  colHeure: { width: 54 },
  colAgents: { width: 44 },
  colTaux: { width: 50 },
  colTotal: { width: 60 },
  colGrand: { width: 74 },

  // Récapitulatif
  recap: {
    marginTop: 8,
  },
  recapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  recapCategories: {
    marginBottom: 12,
    backgroundColor: COLORS.sectionBg,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recapCatRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recapCatLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMid,
  },
  recapCatVal: {
    width: 60,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  recapCatMaj: {
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    color: COLORS.textLight,
  },
  recapTotalRow: {
    backgroundColor: COLORS.border,
  },
  recapTotalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recapTotalVal: {
    width: 60,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Montants
  recapMontants: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
  },
  montantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  montantLabel: {
    fontSize: 13,
    color: 'rgba(247,248,250,0.8)',
  },
  montantVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
  montantTTC: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.accent,
  },
  montantTTCLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.accent,
  },
  montantTTCVal: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.accent,
  },
});

/**
 * @file Section 3 — Configuration des taux horaires et majorations.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useDevisStore } from '@/store/devisStore';
import { InputField } from '@/components/ui/InputField';
import { SectionCard } from '@/components/ui/SectionCard';
import { COLORS } from '@/constants/taux';
import type { Majorations } from '@/types/devis';

// ─────────────────────────────────────────
// LIGNE DE MAJORATION
// ─────────────────────────────────────────

interface MajorationRowProps {
  label: string;
  description: string;
  value: number;
  onChangeValue: (val: number) => void;
  highlight?: boolean;
}

/**
 * Ligne de configuration d'une majoration avec label et input inline.
 * Utilise un TextInput direct pour éviter tout débordement de layout.
 */
function MajorationRow({
  label,
  description,
  value,
  onChangeValue,
  highlight = false,
}: MajorationRowProps): React.ReactElement {
  return (
    <View style={[styles.majoRow, highlight && styles.majoRowHighlight]}>
      <View style={styles.majoLeft}>
        <Text style={styles.majoLabel}>{label}</Text>
        <Text style={styles.majoDesc}>{description}</Text>
      </View>
      <View style={styles.majoRight}>
        <TextInput
          style={styles.majoTextInput}
          value={value.toString()}
          onChangeText={(text) => onChangeValue(parseFloat(text) || 0)}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.majoSuffix}>%</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────

/**
 * Section de configuration tarifaire : taux de base, majorations et TVA.
 */
export function TarifConfig(): React.ReactElement {
  const tarification = useDevisStore((state) => state.devis.tarification);
  const updateTarification = useDevisStore((state) => state.updateTarification);
  const updateMajorations = useDevisStore((state) => state.updateMajorations);

  const { tauxBase, majorations, tva } = tarification;

  const handleMajoration =
    (key: keyof Majorations) =>
    (val: number) =>
      updateMajorations({ [key]: val });

  return (
    <SectionCard title="Tarification" step="3">
      {/* ── Taux de base ── */}
      <View style={styles.tauxBlock}>
        <Text style={styles.sousSection}>Taux horaire de base</Text>
        <InputField
          value={tauxBase.toString()}
          onChangeText={(text) =>
            updateTarification({ tauxBase: parseFloat(text) || 0 })
          }
          keyboardType="numeric"
          suffix="€/h"
        />
      </View>

      {/* ── Majorations ── */}
      <Text style={styles.sousSection}>Majorations (modifiables)</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.flex]}>Type d'heure</Text>
        <Text style={styles.tableHeaderCell}>Taux</Text>
      </View>

      <View style={styles.fixedRow}>
        <Text style={styles.fixedLabel}>Jour — semaine (Lun–Sam)</Text>
        <View style={styles.fixedBadge}>
          <Text style={styles.fixedBadgeText}>0 % (fixe)</Text>
        </View>
      </View>

      <MajorationRow
        label="Nuit — semaine"
        description="Nuit Lun–Sam, hors férié"
        value={majorations.nuitSemaine}
        onChangeValue={handleMajoration('nuitSemaine')}
      />
      <MajorationRow
        label="Jour — dimanche"
        description="Dimanche hors férié"
        value={majorations.jourDimanche}
        onChangeValue={handleMajoration('jourDimanche')}
      />
      <MajorationRow
        label="Nuit — dimanche"
        description="Nuit du dimanche hors férié"
        value={majorations.nuitDimanche}
        onChangeValue={handleMajoration('nuitDimanche')}
      />
      <MajorationRow
        label="Jour — férié"
        description="Jour de jour (jour férié)"
        value={majorations.jourFerie}
        onChangeValue={handleMajoration('jourFerie')}
        highlight
      />
      <MajorationRow
        label="Nuit — férié"
        description="Nuit (jour férié)"
        value={majorations.nuitFerie}
        onChangeValue={handleMajoration('nuitFerie')}
        highlight
      />

      {/* ── TVA ── */}
      <View style={styles.tvaBlock}>
        <Text style={styles.sousSection}>TVA</Text>
        <InputField
          value={tva.toString()}
          onChangeText={(text) =>
            updateTarification({ tva: parseFloat(text) || 0 })
          }
          keyboardType="numeric"
          suffix="%"
          hint="0 % par défaut (exonéré). Saisir 20 pour TVA à 20 %"
        />
      </View>

      {/* ── Aperçu taux ── */}
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Aperçu des taux effectifs ({tauxBase} €/h)</Text>
        {[
          { label: 'Jour semaine', maj: 0 },
          { label: 'Nuit semaine', maj: majorations.nuitSemaine },
          { label: 'Jour dimanche', maj: majorations.jourDimanche },
          { label: 'Nuit dimanche', maj: majorations.nuitDimanche },
          { label: 'Jour férié', maj: majorations.jourFerie },
          { label: 'Nuit férié', maj: majorations.nuitFerie },
        ].map(({ label, maj }) => {
          const effectif = Math.round(tauxBase * (1 + maj / 100) * 100) / 100;
          return (
            <View key={label} style={styles.previewRow}>
              <Text style={styles.previewLabel}>{label}</Text>
              <Text style={styles.previewValue}>
                {effectif.toFixed(2)} €/h
                {maj > 0 && <Text style={styles.previewMaj}> (+{maj}%)</Text>}
              </Text>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  sousSection: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 10,
    marginTop: 4,
  },
  tauxBlock: {
    marginBottom: 16,
  },
  tvaBlock: {
    marginTop: 8,
    marginBottom: 8,
  },

  // Table header
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },

  // Ligne fixe (jour semaine à 0%)
  fixedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fixedLabel: {
    fontSize: 13,
    color: COLORS.textMid,
    flex: 1,
  },
  fixedBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fixedBadgeText: {
    fontSize: 11,
    color: COLORS.textMid,
  },

  // Ligne majoration
  majoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  majoRowHighlight: {
    backgroundColor: '#FFF5F0',
  },
  majoLeft: {
    flex: 1,
    paddingRight: 8,
  },
  majoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  majoDesc: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  // Conteneur droit : largeur fixe, ne déborde jamais
  majoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  majoTextInput: {
    width: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.white,
    textAlign: 'right',
  },
  majoSuffix: {
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.textMid,
    width: 14,
  },

  // Aperçu
  preview: {
    marginTop: 16,
    backgroundColor: COLORS.sectionBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  previewLabel: {
    fontSize: 12,
    color: COLORS.textMid,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  previewMaj: {
    color: COLORS.accent,
    fontWeight: '400',
  },
});

/**
 * @file Chip sélectionnable pour les jours de la semaine.
 * Utilisé dans le formulaire de poste pour activer/désactiver des jours.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { COLORS, JOURS_LABELS } from '@/constants/taux';
import type { JourSemaineCle } from '@/types/devis';

// ─────────────────────────────────────────
// COMPOSANT CHIP UNIQUE
// ─────────────────────────────────────────

interface ShiftChipProps {
  jour: JourSemaineCle;
  actif: boolean;
  onToggle: (jour: JourSemaineCle) => void;
}

/**
 * Chip représentant un jour de la semaine, activable/désactivable.
 */
export function ShiftChip({ jour, actif, onToggle }: ShiftChipProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.chip, actif ? styles.chipActif : styles.chipInactif]}
      onPress={() => onToggle(jour)}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, actif ? styles.labelActif : styles.labelInactif]}>
        {JOURS_LABELS[jour]}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────
// GROUPE DE CHIPS (7 jours)
// ─────────────────────────────────────────

interface ShiftChipGroupProps {
  joursActifs: Record<JourSemaineCle, boolean>;
  onToggle: (jour: JourSemaineCle) => void;
  style?: ViewStyle;
}

const ORDRE_JOURS: JourSemaineCle[] = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];

/**
 * Groupe de 7 chips pour la sélection des jours de la semaine.
 */
export function ShiftChipGroup({
  joursActifs,
  onToggle,
  style,
}: ShiftChipGroupProps): React.ReactElement {
  return (
    <View style={[styles.group, style]}>
      {ORDRE_JOURS.map((jour) => (
        <ShiftChip
          key={jour}
          jour={jour}
          actif={joursActifs[jour]}
          onToggle={onToggle}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 40,
    alignItems: 'center',
  },
  chipActif: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipInactif: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  labelActif: {
    color: COLORS.white,
  },
  labelInactif: {
    color: COLORS.textLight,
  },
});

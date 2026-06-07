/**
 * @file Carte de section avec titre, indicateur et action optionnelle.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/taux';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface SectionCardProps {
  title: string;
  /** Numéro ou icône affiché à gauche du titre */
  step?: string;
  /** Nœud React placé à droite du titre (ex: bouton) */
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

/**
 * Conteneur de section avec accent coloré et header structuré.
 */
export function SectionCard({
  title,
  step,
  action,
  children,
  style,
}: SectionCardProps): React.ReactElement {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {step ? (
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    // Ombre iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    // Ombre Android
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
  },
  action: {
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
});

/**
 * @file Bouton réutilisable avec variantes visuelles.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS } from '@/constants/taux';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

/**
 * Bouton avec état de chargement et variantes de style.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  small = false,
  style,
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        small && styles.small,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text
          style={[
            styles.label,
            styles[`label_${variant}` as keyof typeof styles] as TextStyle,
            small && styles.labelSmall,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  small: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.5,
  },

  // Variantes fond
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  accent: {
    backgroundColor: COLORS.accent,
  },

  // Labels
  label: {
    fontWeight: '600',
    fontSize: 15,
    color: COLORS.white,
  },
  labelSmall: {
    fontSize: 12,
  },
  label_primary: {
    color: COLORS.white,
  },
  label_secondary: {
    color: COLORS.secondary,
  },
  label_danger: {
    color: COLORS.white,
  },
  label_ghost: {
    color: COLORS.primary,
  },
  label_accent: {
    color: COLORS.white,
  },
});

/**
 * @file Champ de saisie réutilisable avec label et gestion d'erreur.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type KeyboardTypeOptions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/taux';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  editable?: boolean;
  maxLength?: number;
  hint?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  suffix?: string;
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

/**
 * Champ de saisie avec label, hint, erreur et suffixe optionnels.
 */
export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  editable = true,
  maxLength,
  hint,
  style,
  inputStyle,
  suffix,
}: InputFieldProps): React.ReactElement {
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            !editable && styles.inputDisabled,
            error ? styles.inputError : null,
            suffix ? styles.inputWithSuffix : null,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={editable}
          maxLength={maxLength}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 10,
  },
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textMid,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputWithSuffix: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  suffix: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: COLORS.border,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: 14,
    color: COLORS.textMid,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  error: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
  },
});

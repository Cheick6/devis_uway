/**
 * @file Section 1 — Informations client du devis.
 * Aucune logique métier ici, uniquement la présentation.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useDevisStore } from '@/store/devisStore';
import { InputField } from '@/components/ui/InputField';
import { SectionCard } from '@/components/ui/SectionCard';
import { COLORS } from '@/constants/taux';

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

/**
 * Formulaire des informations client (nom, adresse, référence, dates, commercial).
 */
export function ClientForm(): React.ReactElement {
  const clientInfo = useDevisStore((state) => state.devis.clientInfo);
  const updateClientInfo = useDevisStore((state) => state.updateClientInfo);

  return (
    <SectionCard title="Informations client" step="1">
      <InputField
        label="Nom du client / société"
        value={clientInfo.nom}
        onChangeText={(text) => updateClientInfo({ nom: text })}
        placeholder="Ex : Entreprise Martin SA"
      />

      <InputField
        label="Adresse du chantier / site à protéger"
        value={clientInfo.adresse}
        onChangeText={(text) => updateClientInfo({ adresse: text })}
        placeholder="12 rue de la Paix, 75001 Paris"
        multiline
        numberOfLines={2}
      />

      <InputField
        label="Référence devis"
        value={clientInfo.reference}
        onChangeText={(text) => updateClientInfo({ reference: text })}
        placeholder="DEV-2026-XXXX"
        hint="Auto-générée, modifiable"
      />

      {/* Validité — champ compact aligné à gauche, pas de row */}
      <View style={styles.validiteBlock}>
        <Text style={styles.validiteLabel}>Validité</Text>
        <View style={styles.validiteInputRow}>
          <TextInput
            style={styles.validiteInput}
            value={clientInfo.validite.toString()}
            onChangeText={(text) =>
              updateClientInfo({ validite: parseInt(text, 10) || 30 })
            }
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={styles.validiteSuffix}>jours</Text>
        </View>
      </View>

      <InputField
        label="Date de création"
        value={clientInfo.dateCreation}
        onChangeText={(text) => updateClientInfo({ dateCreation: text })}
        placeholder="AAAA-MM-JJ"
        hint="Format : AAAA-MM-JJ"
      />

      <InputField
        label="Nom du commercial / responsable"
        value={clientInfo.commercial}
        onChangeText={(text) => updateClientInfo({ commercial: text })}
        placeholder="Jean Dupont"
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  // Bloc validité — largeur intrinsèque, aligné à gauche
  validiteBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  validiteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginRight: 10,
  },
  validiteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validiteInput: {
    width: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },
  validiteSuffix: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textMid,
  },
});

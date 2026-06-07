/**
 * @file Formulaire d'édition d'un poste de travail.
 * Gère horaires jour/nuit, dates et sélection des jours.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useDevisStore } from '@/store/devisStore';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import { ShiftChipGroup } from '@/components/ui/ShiftChip';
import { COLORS } from '@/constants/taux';
import type { Poste, JourSemaineCle } from '@/types/devis';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface PosteFormProps {
  poste: Poste;
  onClose: () => void;
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

/**
 * Formulaire complet d'un poste : libellé, dates, agents, horaires, jours.
 */
export function PosteForm({ poste, onClose }: PosteFormProps): React.ReactElement {
  const updatePoste = useDevisStore((state) => state.updatePoste);
  const deletePoste = useDevisStore((state) => state.deletePoste);

  // État local pour ne déclencher le recalcul qu'à la fermeture
  const [local, setLocal] = useState<Poste>({ ...poste });

  const update = (updates: Partial<Poste>) =>
    setLocal((prev) => ({ ...prev, ...updates }));

  const handleToggleJour = (jour: JourSemaineCle) => {
    update({
      joursActifs: { ...local.joursActifs, [jour]: !local.joursActifs[jour] },
    });
  };

  const handleSave = () => {
    if (!local.libelle.trim()) {
      Alert.alert('Champ requis', 'Le libellé du poste est obligatoire.');
      return;
    }
    if (!local.dateDebut || !local.dateFin) {
      Alert.alert('Champ requis', 'Les dates de début et fin sont obligatoires.');
      return;
    }
    if (local.dateDebut > local.dateFin) {
      Alert.alert('Dates invalides', 'La date de fin doit être >= à la date de début.');
      return;
    }
    if (local.agents < 1) {
      Alert.alert('Agents invalides', 'Le nombre d\'agents doit être au minimum 1.');
      return;
    }
    if (!local.jourActif && !local.nuitActif) {
      Alert.alert('Horaires requis', 'Activez au moins les horaires de jour ou de nuit.');
      return;
    }
    updatePoste(poste.id, local);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le poste',
      `Êtes-vous sûr de vouloir supprimer "${local.libelle || 'ce poste'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deletePoste(poste.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Libellé ── */}
      <InputField
        label="Libellé du poste *"
        value={local.libelle}
        onChangeText={(text) => update({ libelle: text })}
        placeholder="Ex : Surveillance hall A"
      />

      {/* ── Dates ── */}
      <View style={styles.row}>
        <InputField
          label="Date début *"
          value={local.dateDebut}
          onChangeText={(text) => update({ dateDebut: text })}
          placeholder="AAAA-MM-JJ"
          hint="AAAA-MM-JJ"
          style={styles.halfField}
        />
        <View style={styles.spacer} />
        <InputField
          label="Date fin *"
          value={local.dateFin}
          onChangeText={(text) => update({ dateFin: text })}
          placeholder="AAAA-MM-JJ"
          hint="AAAA-MM-JJ"
          style={styles.halfField}
        />
      </View>

      {/* ── Nombre d'agents ── */}
      <InputField
        label="Nombre d'agents affectés"
        value={local.agents.toString()}
        onChangeText={(text) => update({ agents: parseInt(text, 10) || 1 })}
        keyboardType="numeric"
        suffix="agent(s)"
      />

      {/* ── Horaires JOUR ── */}
      <View style={styles.shiftBlock}>
        <View style={styles.shiftHeader}>
          <View style={styles.shiftTitleRow}>
            <View style={[styles.shiftDot, styles.dotJour]} />
            <Text style={styles.shiftTitle}>Heures de JOUR</Text>
          </View>
          <Switch
            value={local.jourActif}
            onValueChange={(val) => update({ jourActif: val })}
            trackColor={{ false: COLORS.border, true: COLORS.info }}
            thumbColor={COLORS.white}
          />
        </View>
        {local.jourActif && (
          <View style={styles.row}>
            <InputField
              label="Début"
              value={local.heureJourDebut}
              onChangeText={(text) => update({ heureJourDebut: text })}
              placeholder="08:00"
              hint="HH:MM"
              style={styles.halfField}
            />
            <View style={styles.spacer} />
            <InputField
              label="Fin"
              value={local.heureJourFin}
              onChangeText={(text) => update({ heureJourFin: text })}
              placeholder="20:00"
              hint="HH:MM"
              style={styles.halfField}
            />
          </View>
        )}
      </View>

      {/* ── Horaires NUIT ── */}
      <View style={styles.shiftBlock}>
        <View style={styles.shiftHeader}>
          <View style={styles.shiftTitleRow}>
            <View style={[styles.shiftDot, styles.dotNuit]} />
            <Text style={styles.shiftTitle}>Heures de NUIT</Text>
          </View>
          <Switch
            value={local.nuitActif}
            onValueChange={(val) => update({ nuitActif: val })}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
        {local.nuitActif && (
          <View style={styles.row}>
            <InputField
              label="Début"
              value={local.heureNuitDebut}
              onChangeText={(text) => update({ heureNuitDebut: text })}
              placeholder="22:00"
              hint="HH:MM"
              style={styles.halfField}
            />
            <View style={styles.spacer} />
            <InputField
              label="Fin"
              value={local.heureNuitFin}
              onChangeText={(text) => update({ heureNuitFin: text })}
              placeholder="06:00"
              hint="HH:MM (peut dépasser minuit)"
              style={styles.halfField}
            />
          </View>
        )}
      </View>

      {/* ── Jours de la semaine ── */}
      <View style={styles.jourSection}>
        <Text style={styles.jourLabel}>Jours travaillés</Text>
        <ShiftChipGroup
          joursActifs={local.joursActifs}
          onToggle={handleToggleJour}
          style={styles.chips}
        />
      </View>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <Button label="Enregistrer" onPress={handleSave} variant="accent" style={styles.btnSave} />
        <Button label="Annuler" onPress={onClose} variant="ghost" style={styles.btnCancel} />
        <Button label="Supprimer" onPress={handleDelete} variant="danger" small />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
  },
  halfField: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  shiftBlock: {
    backgroundColor: COLORS.sectionBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotJour: {
    backgroundColor: '#F6AD55',
  },
  dotNuit: {
    backgroundColor: COLORS.primary,
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jourSection: {
    marginBottom: 16,
  },
  jourLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  chips: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  btnSave: {
    flex: 1,
  },
  btnCancel: {
    flex: 1,
  },
});

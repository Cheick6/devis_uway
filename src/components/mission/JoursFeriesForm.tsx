import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useMissionStore } from '@/store/missionStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/taux';
import { formatDateFR } from '@/utils/missionCalcul';
import type { JourFerie } from '@/types/mission';

// ─────────────────────────────────────────
// LIGNE JOUR FÉRIÉ
// ─────────────────────────────────────────

function FerieRow({ ferie }: { ferie: JourFerie }): React.ReactElement {
  const updateFerie = useMissionStore((s) => s.updateFerie);
  const deleteFerie = useMissionStore((s) => s.deleteFerie);

  const [date, setDate] = useState(ferie.date);
  const [nom, setNom] = useState(ferie.nom);

  const flush = () => {
    updateFerie(ferie.id, { date, nom });
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.dateInput}
        value={date}
        onChangeText={setDate}
        onBlur={flush}
        placeholder="AAAA-MM-JJ"
        placeholderTextColor={COLORS.textLight}
        maxLength={10}
      />
      <Text style={styles.dateFR}>{formatDateFR(date)}</Text>
      <TextInput
        style={styles.nomInput}
        value={nom}
        onChangeText={setNom}
        onBlur={flush}
        placeholder="Nom du jour férié"
        placeholderTextColor={COLORS.textLight}
      />
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert('Supprimer', `Supprimer "${nom}" ?`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => deleteFerie(ferie.id) },
          ])
        }
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────
// FORMULAIRE AJOUT
// ─────────────────────────────────────────

function AddFerieForm({ onCancel }: { onCancel: () => void }): React.ReactElement {
  const addFerie = useMissionStore((s) => s.addFerie);
  const [date, setDate] = useState('');
  const [nom, setNom] = useState('');

  const handleAdd = () => {
    if (!date || !nom.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir une date (AAAA-MM-JJ) et un nom.');
      return;
    }
    addFerie({ date, nom: nom.trim() });
    onCancel();
  };

  return (
    <View style={styles.addForm}>
      <Text style={styles.addFormTitle}>Nouveau jour férié</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.dateInput, { flex: 0, width: 110 }]}
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-JJ"
          placeholderTextColor={COLORS.textLight}
          maxLength={10}
          autoFocus
        />
        <TextInput
          style={[styles.nomInput, { flex: 1 }]}
          value={nom}
          onChangeText={setNom}
          placeholder="Nom (ex : Noël)"
          placeholderTextColor={COLORS.textLight}
        />
      </View>
      <View style={styles.addActions}>
        <Button label="Ajouter" onPress={handleAdd} variant="accent" small />
        <Button label="Annuler" onPress={onCancel} variant="ghost" small />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────

export function JoursFeriesForm(): React.ReactElement {
  const joursFeries = useMissionStore((s) => s.mission.joursFeries);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <SectionCard title="Jours fériés" step="4">
      {/* En-tête colonnes */}
      <View style={styles.header}>
        <Text style={[styles.headerCell, { width: 100 }]}>ISO</Text>
        <Text style={[styles.headerCell, { width: 72 }]}>Date FR</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Nom du jour</Text>
      </View>

      {joursFeries.length === 0 && (
        <Text style={styles.empty}>Aucun jour férié configuré.</Text>
      )}

      {joursFeries.map((f) => (
        <FerieRow key={f.id} ferie={f} />
      ))}

      {showAdd ? (
        <AddFerieForm onCancel={() => setShowAdd(false)} />
      ) : (
        <Button
          label="+ Ajouter un jour férié"
          onPress={() => setShowAdd(true)}
          variant="secondary"
          fullWidth
          style={{ marginTop: 8 }}
        />
      )}

      <View style={styles.info}>
        <Text style={styles.infoText}>
          {joursFeries.length} jour{joursFeries.length > 1 ? 's' : ''} férié
          {joursFeries.length > 1 ? 's' : ''} configuré{joursFeries.length > 1 ? 's' : ''}.
          Ces dates servent de référence pour les lignes de type «&nbsp;Jour&nbsp;/ Nuit férié&nbsp;».
        </Text>
      </View>
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    marginBottom: 5,
  },
  dateInput: {
    width: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 12,
    color: COLORS.textDark,
    backgroundColor: COLORS.sectionBg,
    textAlign: 'center',
  },
  dateFR: {
    width: 72,
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  nomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    color: COLORS.textDark,
    backgroundColor: COLORS.sectionBg,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    backgroundColor: '#FFF5F5',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: 12,
  },

  addForm: {
    marginTop: 8,
    backgroundColor: '#FFFAF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEEBC8',
    padding: 10,
  },
  addFormTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addActions: {
    flexDirection: 'row',
    gap: 8,
  },

  info: {
    marginTop: 10,
    backgroundColor: COLORS.sectionBg,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 16,
  },
});

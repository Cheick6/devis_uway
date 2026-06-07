/**
 * @file Section 4 — Gestion des jours fériés (officiels + personnalisés).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { useDevisStore } from '@/store/devisStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/taux';
import type { JourFerie } from '@/types/devis';

// ─────────────────────────────────────────
// ITEM FÉRIÉ
// ─────────────────────────────────────────

interface FerieItemProps {
  ferie: JourFerie;
  onDelete: () => void;
}

/**
 * Ligne représentant un jour férié dans la liste.
 */
function FerieItem({ ferie, onDelete }: FerieItemProps): React.ReactElement {
  const date = new Date(ferie.date + 'T00:00:00');
  const dateFormatee = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={[styles.ferieItem, ferie.officiel ? styles.ferieOfficiel : styles.ferieCustom]}>
      <View style={styles.ferieLeft}>
        <Text style={styles.ferieNom}>{ferie.nom}</Text>
        <Text style={styles.ferieDate}>{dateFormatee}</Text>
        {ferie.officiel ? (
          <View style={styles.officiellBadge}>
            <Text style={styles.officiellBadgeText}>Officiel</Text>
          </View>
        ) : (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Personnalisé</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────

/**
 * Gestionnaire des jours fériés : liste, ajout et suppression.
 */
export function FeriesManager(): React.ReactElement {
  const joursFeries = useDevisStore((state) => state.devis.joursFeries);
  const addJourFerie = useDevisStore((state) => state.addJourFerie);
  const deleteJourFerie = useDevisStore((state) => state.deleteJourFerie);

  const [nouvelleDate, setNouvelleDate] = useState('');
  const [nouveauNom, setNouveauNom] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!nouvelleDate.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir une date (AAAA-MM-JJ).');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nouvelleDate)) {
      Alert.alert('Format invalide', 'La date doit être au format AAAA-MM-JJ.');
      return;
    }
    if (!nouveauNom.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un nom pour ce jour férié.');
      return;
    }
    addJourFerie(nouvelleDate.trim(), nouveauNom.trim());
    setNouvelleDate('');
    setNouveauNom('');
    setShowForm(false);
  };

  const handleDelete = (ferie: JourFerie) => {
    Alert.alert(
      'Supprimer le jour férié',
      `Supprimer "${ferie.nom}" (${ferie.date}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteJourFerie(ferie.id),
        },
      ],
    );
  };

  const nbOfficiels = joursFeries.filter((f) => f.officiel).length;
  const nbCustom = joursFeries.filter((f) => !f.officiel).length;

  return (
    <SectionCard
      title="Jours fériés"
      step="4"
      action={
        <Button
          label={showForm ? 'Fermer' : '+ Ajouter'}
          onPress={() => setShowForm((v) => !v)}
          variant={showForm ? 'ghost' : 'accent'}
          small
        />
      }
    >
      {/* ── Formulaire d'ajout ── */}
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Ajouter un jour férié personnalisé</Text>
          <InputField
            label="Date"
            value={nouvelleDate}
            onChangeText={setNouvelleDate}
            placeholder="AAAA-MM-JJ"
            hint="Ex : 2026-12-31"
          />
          <InputField
            label="Nom"
            value={nouveauNom}
            onChangeText={setNouveauNom}
            placeholder="Ex : Saint-Sylvestre"
          />
          <Button label="Ajouter" onPress={handleAdd} variant="accent" fullWidth />
        </View>
      )}

      {/* ── Compteurs ── */}
      <View style={styles.stats}>
        <Text style={styles.statBadge}>{nbOfficiels} officiels</Text>
        {nbCustom > 0 && (
          <Text style={[styles.statBadge, styles.statCustom]}>{nbCustom} personnalisé{nbCustom > 1 ? 's' : ''}</Text>
        )}
      </View>

      {/* ── Liste ── */}
      {joursFeries.length === 0 ? (
        <Text style={styles.empty}>Aucun jour férié défini.</Text>
      ) : (
        joursFeries.map((ferie) => (
          <FerieItem
            key={ferie.id}
            ferie={ferie}
            onDelete={() => handleDelete(ferie)}
          />
        ))
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  form: {
    backgroundColor: COLORS.sectionBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statCustom: {
    backgroundColor: COLORS.accent,
  },
  empty: {
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Item
  ferieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  ferieOfficiel: {
    backgroundColor: '#EBF4FF',
    borderColor: '#BEE3F8',
  },
  ferieCustom: {
    backgroundColor: '#FFFAF0',
    borderColor: '#FEEBC8',
  },
  ferieLeft: {
    flex: 1,
  },
  ferieNom: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ferieDate: {
    fontSize: 11,
    color: COLORS.textMid,
    marginTop: 2,
    marginBottom: 4,
  },
  officiellBadge: {
    backgroundColor: '#3182CE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  officiellBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
  },
  customBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  customBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

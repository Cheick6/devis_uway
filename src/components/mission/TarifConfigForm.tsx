import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useMissionStore } from '@/store/missionStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { COLORS } from '@/constants/taux';
import type { Majoration, StatutAgent } from '@/types/mission';

// ─────────────────────────────────────────
// CHAMP NUMÉRIQUE
// ─────────────────────────────────────────

function NumField({
  label,
  value,
  onCommit,
  suffix = '€/h',
  min = 0,
  hint,
  width,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  suffix?: string;
  min?: number;
  hint?: string;
  width?: number;
}): React.ReactElement {
  const [text, setText] = useState(value.toString());

  return (
    <View style={[styles.numField, width ? { width } : { flex: 1 }]}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numRow}>
        <TextInput
          style={styles.numInput}
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const n = parseFloat(text.replace(',', '.'));
            if (!isNaN(n) && n >= min) {
              onCommit(n);
            } else {
              setText(value.toString());
            }
          }}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.numSuffix}>{suffix}</Text>
      </View>
      {!!hint && <Text style={styles.numHint}>{hint}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────
// CHAMP HEURE HH:MM
// ─────────────────────────────────────────

function TimeField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}): React.ReactElement {
  const [text, setText] = useState(value);

  const isValid = (s: string) => /^\d{2}:\d{2}$/.test(s);

  return (
    <View style={styles.timeField}>
      <Text style={styles.numLabel}>{label}</Text>
      <TextInput
        style={styles.timeInput}
        value={text}
        onChangeText={setText}
        onBlur={() => {
          if (isValid(text)) {
            onCommit(text);
          } else {
            setText(value);
          }
        }}
        placeholder="HH:MM"
        placeholderTextColor={COLORS.textLight}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        selectTextOnFocus
      />
    </View>
  );
}

// ─────────────────────────────────────────
// PLAGE NUIT
// ─────────────────────────────────────────

function PlageNuitSection(): React.ReactElement {
  const plageNuit = useMissionStore((s) => s.mission.tarif.plageNuit);
  const updatePlageNuit = useMissionStore((s) => s.updatePlageNuit);

  return (
    <View style={styles.plageNuitRow}>
      <TimeField
        label="Début heures de nuit"
        value={plageNuit.debut}
        onCommit={(v) => updatePlageNuit({ debut: v })}
      />
      <View style={styles.plageNuitArrow}>
        <Text style={styles.plageNuitArrowText}>→</Text>
      </View>
      <TimeField
        label="Fin heures de nuit"
        value={plageNuit.fin}
        onCommit={(v) => updatePlageNuit({ fin: v })}
      />
    </View>
  );
}

// ─────────────────────────────────────────
// TABLE DES STATUTS AGENTS
// ─────────────────────────────────────────

function StatutRow({ statut }: { statut: StatutAgent }): React.ReactElement {
  const updateStatut = useMissionStore((s) => s.updateStatut);
  const deleteStatut = useMissionStore((s) => s.deleteStatut);

  const [nom, setNom] = useState(statut.nom);
  const [taux, setTaux] = useState(statut.tauxBase.toString());

  const flushNom = () => {
    const trimmed = nom.trim();
    if (trimmed) updateStatut(statut.id, { nom: trimmed });
    else setNom(statut.nom);
  };

  const flushTaux = () => {
    const n = parseFloat(taux.replace(',', '.'));
    if (!isNaN(n) && n > 0) updateStatut(statut.id, { tauxBase: n });
    else setTaux(statut.tauxBase.toString());
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le statut',
      `Supprimer "${statut.nom}" ? Les lignes liées passeront en saisie manuelle.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteStatut(statut.id) },
      ],
    );
  };

  return (
    <View style={styles.statutRow}>
      <TextInput
        style={[styles.input, styles.inputStatutNom]}
        value={nom}
        onChangeText={setNom}
        onBlur={flushNom}
        placeholder="Nom du statut"
        placeholderTextColor={COLORS.textLight}
      />
      <View style={styles.statutTauxRow}>
        <TextInput
          style={[styles.input, styles.inputStatutTaux]}
          value={taux}
          onChangeText={setTaux}
          onBlur={flushTaux}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.statutTauxSuffix}>€/h</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatutsSection(): React.ReactElement {
  const statuts = useMissionStore((s) => s.mission.tarif.statuts);
  const addStatut = useMissionStore((s) => s.addStatut);

  return (
    <View style={styles.statutsSection}>
      <Text style={styles.sectionTitle}>Statuts & taux horaires agents</Text>
      <View style={styles.statutsHeader}>
        <Text style={[styles.statutsHeaderCell, { flex: 1 }]}>Statut / Catégorie</Text>
        <Text style={[styles.statutsHeaderCell, { width: 80, textAlign: 'right' }]}>Taux base</Text>
        <View style={{ width: 32 }} />
      </View>
      {statuts.map((s) => (
        <StatutRow key={s.id} statut={s} />
      ))}
      <TouchableOpacity
        style={styles.addStatutBtn}
        onPress={() => addStatut({ nom: 'Nouveau statut', tauxBase: 23 })}
      >
        <Text style={styles.addStatutBtnText}>+ Ajouter un statut</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────
// GRILLE DES MAJORATIONS
// ─────────────────────────────────────────

const MAJORATION_ITEMS: {
  key: keyof Majoration;
  label: string;
  color: string;
}[] = [
  { key: 'nuitSemaine',  label: 'Nuit semaine',  color: '#3182CE' },
  { key: 'jourDimanche', label: 'Jour dimanche',  color: '#805AD5' },
  { key: 'nuitDimanche', label: 'Nuit dimanche',  color: '#6B46C1' },
  { key: 'jourFerie',    label: 'Jour férié',     color: '#C05621' },
  { key: 'nuitFerie',    label: 'Nuit férié',     color: '#9C4221' },
];

function MajorationRow({
  item,
}: {
  item: (typeof MAJORATION_ITEMS)[0];
}): React.ReactElement {
  const valeur = useMissionStore((s) => s.mission.tarif.majorations[item.key]);
  const updateMajoration = useMissionStore((s) => s.updateMajoration);
  const [text, setText] = useState(valeur.toString());

  return (
    <View style={styles.majRow}>
      <View style={[styles.majBadge, { backgroundColor: item.color }]}>
        <Text style={styles.majBadgeText}>{valeur > 0 ? `+${valeur}%` : '0%'}</Text>
      </View>
      <Text style={styles.majLabel}>{item.label}</Text>
      <View style={styles.majInputWrap}>
        <TextInput
          style={styles.majInput}
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const n = parseFloat(text.replace(',', '.'));
            if (!isNaN(n) && n >= 0) {
              updateMajoration(item.key, n);
            } else {
              setText(valeur.toString());
            }
          }}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.majSuffix}>%</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────

export function TarifConfigForm(): React.ReactElement {
  const tva = useMissionStore((s) => s.mission.tva);
  const updateTVA = useMissionStore((s) => s.updateTVA);

  return (
    <SectionCard title="Tarification & Majorations" step="3">
      {/* TVA */}
      <View style={styles.tvaRow}>
        <NumField
          label="TVA applicable"
          value={tva}
          onCommit={updateTVA}
          suffix="%"
          hint="Ex : 20 pour 20 %"
          width={140}
        />
      </View>

      {/* Plage heures de nuit */}
      <Text style={styles.sectionTitle}>Plage heures de nuit</Text>
      <PlageNuitSection />

      {/* Statuts agents */}
      <StatutsSection />

      {/* Majorations */}
      <Text style={styles.sectionTitle}>Majorations par type d'heure</Text>
      <View style={styles.majHeader}>
        <Text style={[styles.majHeaderCell, { flex: 1 }]}>Type</Text>
        <Text style={[styles.majHeaderCell, { width: 72 }]}>Majo.</Text>
      </View>
      {/* Jour semaine (pas de majoration) */}
      <View style={styles.majRow}>
        <View style={[styles.majBadge, { backgroundColor: '#38A169' }]}>
          <Text style={styles.majBadgeText}>Base</Text>
        </View>
        <Text style={styles.majLabel}>Jour semaine</Text>
        <View style={styles.majInputWrap}>
          <TextInput style={[styles.majInput, styles.majInputDisabled]} value="0" editable={false} />
          <Text style={styles.majSuffix}>%</Text>
        </View>
      </View>
      {MAJORATION_ITEMS.map((item) => (
        <MajorationRow key={item.key} item={item} />
      ))}

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Les taux effectifs se calculent automatiquement selon le statut de l'agent sélectionné
          et le type d'heure : taux base × (1 + majoration%). Toute modification met à jour
          les lignes de facturation automatiques.
        </Text>
      </View>
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  tvaRow: { flexDirection: 'row', marginBottom: 16 },

  numField: {},
  numLabel: { fontSize: 12, fontWeight: '600', color: COLORS.secondary, marginBottom: 5 },
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  numInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },
  numSuffix: {
    paddingHorizontal: 8,
    paddingVertical: 9,
    backgroundColor: COLORS.background,
    fontSize: 12,
    color: COLORS.textLight,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  numHint: { fontSize: 10, color: COLORS.textLight, marginTop: 3 },

  // Plage nuit
  plageNuitRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  plageNuitArrow: { paddingBottom: 8 },
  plageNuitArrowText: { fontSize: 18, color: COLORS.textLight },
  timeField: { flex: 1 },
  timeInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },

  // Statuts
  statutsSection: { marginBottom: 16 },
  statutsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingHorizontal: 4 },
  statutsHeaderCell: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  statutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: COLORS.sectionBg,
  },
  inputStatutNom: { flex: 1 },
  statutTauxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    width: 80,
  },
  inputStatutTaux: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    borderWidth: 0,
    paddingVertical: 7,
    paddingHorizontal: 4,
    backgroundColor: COLORS.white,
  },
  statutTauxSuffix: {
    paddingHorizontal: 5,
    fontSize: 11,
    color: COLORS.textLight,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingVertical: 7,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  addStatutBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addStatutBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // Majorations
  majHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 4 },
  majHeaderCell: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  majRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  majBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  majBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  majLabel: { flex: 1, fontSize: 12, color: COLORS.textDark, fontWeight: '500' },
  majInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    width: 72,
  },
  majInput: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    backgroundColor: COLORS.white,
  },
  majInputDisabled: { backgroundColor: COLORS.background, color: COLORS.textLight },
  majSuffix: {
    paddingHorizontal: 5,
    fontSize: 11,
    color: COLORS.textLight,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingVertical: 5,
  },

  info: {
    marginTop: 10,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  infoText: { fontSize: 11, color: '#2B6CB0', lineHeight: 16 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useMissionStore } from '@/store/missionStore';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/taux';
import type {
  Prestation,
  LigneFacturation,
  TypeHeure,
  StatutAgent,
} from '@/types/mission';
import {
  formatMontantFR,
  calculerPUHTStatut,
  SHORT_LABELS_TYPE_HEURE,
  LABELS_TYPE_HEURE,
  ORDRE_TYPE_HEURE,
  decomposerPeriode,
} from '@/utils/missionCalcul';

// ─────────────────────────────────────────
// COULEURS PAR TYPE D'HEURE
// ─────────────────────────────────────────

const TYPE_COLORS: Record<TypeHeure, string> = {
  jour_semaine:  '#38A169',
  nuit_semaine:  '#3182CE',
  jour_dimanche: '#805AD5',
  nuit_dimanche: '#6B46C1',
  jour_ferie:    '#C05621',
  nuit_ferie:    '#9C4221',
  manuel:        '#718096',
};

const STATUT_PALETTE = [
  '#3182CE', '#6B46C1', '#38A169', '#C05621', '#9C4221', '#2D6A4F',
  '#B7791F', '#2C7A7B', '#822727', '#285E61',
];

// ─────────────────────────────────────────
// SÉLECTEUR DE STATUT AGENT
// ─────────────────────────────────────────

function StatutSelector({
  statutId,
  statuts,
  onChange,
}: {
  statutId: string | null;
  statuts: StatutAgent[];
  onChange: (id: string | null) => void;
}): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.selectorScroll}
      contentContainerStyle={styles.selectorContent}
    >
      <TouchableOpacity
        style={[
          styles.selectorBtn,
          statutId === null
            ? { backgroundColor: '#718096', borderColor: '#718096' }
            : { borderColor: '#718096' },
        ]}
        onPress={() => onChange(null)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorBtnLabel, statutId === null ? styles.selectorBtnLabelSel : { color: '#718096' }]}>
          Manuel
        </Text>
      </TouchableOpacity>

      {statuts.map((s, i) => {
        const color    = STATUT_PALETTE[i % STATUT_PALETTE.length];
        const selected = statutId === s.id;
        return (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.selectorBtn,
              selected ? { backgroundColor: color, borderColor: color } : { borderColor: color },
            ]}
            onPress={() => onChange(s.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectorBtnLabel, selected ? styles.selectorBtnLabelSel : { color }]}>
              {s.nom}
            </Text>
            <Text style={[styles.selectorBtnRate, selected ? styles.selectorBtnRateSel : { color }]}>
              {s.tauxBase.toFixed(2)}€/h
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────
// SÉLECTEUR DE TYPE D'HEURE (pour lignes manuelles)
// ─────────────────────────────────────────

function TypeSelector({
  value,
  statut,
  onChange,
}: {
  value: TypeHeure;
  statut: StatutAgent | null;
  onChange: (t: TypeHeure) => void;
}): React.ReactElement {
  const majorations = useMissionStore((s) => s.mission.tarif.majorations);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.selectorScroll}
      contentContainerStyle={styles.selectorContent}
    >
      {ORDRE_TYPE_HEURE.map((type) => {
        const selected = value === type;
        const taux     = calculerPUHTStatut(type, statut, majorations);
        const color    = TYPE_COLORS[type];
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.selectorBtn,
              selected ? { backgroundColor: color, borderColor: color } : { borderColor: color },
            ]}
            onPress={() => onChange(type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectorBtnLabel, selected ? styles.selectorBtnLabelSel : { color }]}>
              {SHORT_LABELS_TYPE_HEURE[type]}
            </Text>
            {taux !== null && type !== 'manuel' && (
              <Text style={[styles.selectorBtnRate, selected ? styles.selectorBtnRateSel : { color }]}>
                {taux.toFixed(2)}€
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────
// LIGNE DE FACTURATION (vue compacte)
// ─────────────────────────────────────────

function LigneRow({
  ligne,
  prestationId,
}: {
  ligne: LigneFacturation;
  prestationId: string;
}): React.ReactElement {
  const updateLigne = useMissionStore((s) => s.updateLigne);
  const deleteLigne = useMissionStore((s) => s.deleteLigne);
  const tarif       = useMissionStore((s) => s.mission.tarif);

  const [desig, setDesig]       = useState(ligne.designation);
  const [statutId, setStatutId] = useState<string | null>(ligne.statutId ?? null);
  const [typeHeure, setTypeHeure] = useState<TypeHeure>(ligne.typeHeure ?? 'manuel');
  const [qte, setQte]           = useState(ligne.quantite === 0 ? '' : String(ligne.quantite));
  const [pu, setPu]             = useState(ligne.pu_ht === 0 ? '' : String(ligne.pu_ht));

  const montant = Math.round((parseFloat(qte) || 0) * (parseFloat(pu) || 0) * 100) / 100;

  const getStatut = (id: string | null): StatutAgent | null =>
    id ? (tarif.statuts.find((s) => s.id === id) ?? null) : null;

  const applyAutoCalc = (sid: string | null, th: TypeHeure): string | null => {
    const s       = getStatut(sid);
    const computed = calculerPUHTStatut(th, s, tarif.majorations);
    if (computed !== null) { setPu(computed.toFixed(2)); return computed.toFixed(2); }
    return null;
  };

  const handleStatutChange = (newId: string | null) => {
    setStatutId(newId);
    const puStr = applyAutoCalc(newId, typeHeure);
    updateLigne(prestationId, ligne.id, {
      statutId: newId, typeHeure,
      pu_ht: puStr !== null ? parseFloat(puStr) : parseFloat(pu) || 0,
    });
  };

  const handleTypeChange = (type: TypeHeure) => {
    setTypeHeure(type);
    const puStr = applyAutoCalc(statutId, type);
    updateLigne(prestationId, ligne.id, {
      statutId, typeHeure: type,
      pu_ht: puStr !== null ? parseFloat(puStr) : parseFloat(pu) || 0,
    });
  };

  const flush = () =>
    updateLigne(prestationId, ligne.id, {
      designation: desig, statutId, typeHeure,
      quantite: parseFloat(qte) || 0,
      pu_ht:    parseFloat(pu)  || 0,
    });

  const isAutoMode = statutId !== null && typeHeure !== 'manuel';
  const color = TYPE_COLORS[typeHeure];

  return (
    <View style={styles.ligneRow}>
      {/* Badge type + statut selector + type selector sur une ligne */}
      <View style={styles.ligneTopRow}>
        <View style={[styles.typeBadge, { backgroundColor: color }]}>
          <Text style={styles.typeBadgeText}>{SHORT_LABELS_TYPE_HEURE[typeHeure]}</Text>
        </View>
        <StatutSelector statutId={statutId} statuts={tarif.statuts} onChange={handleStatutChange} />
      </View>
      <TypeSelector value={typeHeure} statut={getStatut(statutId)} onChange={handleTypeChange} />

      {/* Désignation */}
      <TextInput
        style={[styles.input, styles.inputDesig]}
        value={desig}
        onChangeText={setDesig}
        onBlur={flush}
        placeholder="Désignation (ex: Heures de jour)"
        placeholderTextColor={COLORS.textLight}
      />

      {/* Qté + PU + Montant + Delete */}
      <View style={styles.ligneNums}>
        <TextInput
          style={[styles.input, styles.inputNum]}
          value={qte}
          onChangeText={setQte}
          onBlur={flush}
          placeholder="Qté"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <TextInput
          style={[styles.input, styles.inputNum, isAutoMode && styles.inputNumAuto]}
          value={pu}
          onChangeText={(v) => {
            setPu(v);
            if (isAutoMode) {
              setTypeHeure('manuel');
              updateLigne(prestationId, ligne.id, { typeHeure: 'manuel', pu_ht: parseFloat(v) || 0 });
            }
          }}
          onBlur={flush}
          placeholder="PU HT"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <View style={styles.montantBox}>
          <Text style={styles.montantText}>{formatMontantFR(montant)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert('Supprimer', 'Supprimer cette ligne ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => deleteLigne(prestationId, ligne.id) },
            ])
          }
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// HELPER : parsing date FR / ISO
// ─────────────────────────────────────────

function parseDateInput(s: string): string | null {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // DD/MM → assume current year
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m2) return `${new Date().getFullYear()}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  return null;
}

// ─────────────────────────────────────────
// FORMULAIRE DE PÉRIODE
// ─────────────────────────────────────────

function PeriodeForm({
  prestationId,
  onClose,
}: {
  prestationId: string;
  onClose: () => void;
}): React.ReactElement {
  const tarif       = useMissionStore((s) => s.mission.tarif);
  const joursFeries = useMissionStore((s) => s.mission.joursFeries);
  const addLignes   = useMissionStore((s) => s.addLignes);

  const [designation, setDesignation] = useState('');
  const [statutId, setStatutId]       = useState<string | null>(tarif.statuts[0]?.id ?? null);
  const [dateDebut, setDateDebut]     = useState('');
  const [heureDebut, setHeureDebut]   = useState('');
  const [dateFin, setDateFin]         = useState('');
  const [heureFin, setHeureFin]       = useState('');
  const [breakdown, setBreakdown]     = useState<{ typeHeure: Exclude<TypeHeure, 'manuel'>; heures: number }[]>([]);
  const [erreur, setErreur]           = useState<string | null>(null);

  const statut = tarif.statuts.find((s) => s.id === statutId) ?? null;

  const handleCalculer = () => {
    const ddISO = parseDateInput(dateDebut);
    const dfISO = parseDateInput(dateFin);
    if (!ddISO || !dfISO) {
      setErreur('Date invalide — format attendu : JJ/MM/AAAA ou JJ/MM');
      setBreakdown([]);
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(heureDebut) || !/^\d{2}:\d{2}$/.test(heureFin)) {
      setErreur("Heure invalide — format attendu : HH:MM");
      setBreakdown([]);
      return;
    }
    const result = decomposerPeriode(ddISO, heureDebut, dfISO, heureFin, tarif.plageNuit, joursFeries);
    if (result.length === 0) {
      setErreur('Période invalide ou durée nulle — vérifiez que la date de fin est après le début.');
      setBreakdown([]);
    } else {
      setErreur(null);
      setBreakdown(result);
    }
  };

  const handleGenerate = () => {
    if (breakdown.length === 0) return;
    const nouvelles: Omit<LigneFacturation, 'id'>[] = breakdown.map(({ typeHeure, heures }) => {
      const pu = calculerPUHTStatut(typeHeure, statut, tarif.majorations) ?? 0;
      return {
        designation: designation
          ? `${designation} — ${LABELS_TYPE_HEURE[typeHeure]}`
          : LABELS_TYPE_HEURE[typeHeure],
        statutId,
        typeHeure,
        quantite: heures,
        pu_ht:    pu,
      };
    });
    addLignes(prestationId, nouvelles);
    onClose();
  };

  const totalHT = breakdown.reduce((sum, { typeHeure, heures }) => {
    const pu = calculerPUHTStatut(typeHeure, statut, tarif.majorations) ?? 0;
    return sum + heures * pu;
  }, 0);

  return (
    <View style={styles.periodeForm}>
      <Text style={styles.periodeFormTitle}>Ajouter depuis une période</Text>

      {/* Désignation */}
      <TextInput
        style={[styles.input, { marginBottom: 10 }]}
        value={designation}
        onChangeText={setDesignation}
        placeholder="Désignation (ex : Gardiennage nocturne)"
        placeholderTextColor={COLORS.textLight}
      />

      {/* Statut agent */}
      <Text style={styles.periodeLabel}>Statut agent</Text>
      <StatutSelector statutId={statutId} statuts={tarif.statuts} onChange={setStatutId} />

      {/* Dates / Heures */}
      <View style={styles.periodeDatesBlock}>
        <View style={styles.periodeDateGroup}>
          <Text style={styles.periodeLabel}>Du</Text>
          <View style={styles.periodeDateRow}>
            <TextInput
              style={[styles.input, styles.inputDatePeriode]}
              value={dateDebut}
              onChangeText={setDateDebut}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputHeurePeriode]}
              value={heureDebut}
              onChangeText={setHeureDebut}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.periodeDateGroup}>
          <Text style={styles.periodeLabel}>Au</Text>
          <View style={styles.periodeDateRow}>
            <TextInput
              style={[styles.input, styles.inputDatePeriode]}
              value={dateFin}
              onChangeText={setDateFin}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputHeurePeriode]}
              value={heureFin}
              onChangeText={setHeureFin}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.calculerBtn} onPress={handleCalculer}>
        <Text style={styles.calculerBtnText}>Calculer la décomposition</Text>
      </TouchableOpacity>

      {/* Erreur */}
      {!!erreur && <Text style={styles.periodeErreur}>{erreur}</Text>}

      {/* Aperçu */}
      {breakdown.length > 0 && (
        <View style={styles.periodePreview}>
          <Text style={styles.periodePreviewTitle}>Décomposition</Text>
          {breakdown.map(({ typeHeure, heures }) => {
            const pu    = calculerPUHTStatut(typeHeure, statut, tarif.majorations) ?? 0;
            const total = Math.round(heures * pu * 100) / 100;
            const color = TYPE_COLORS[typeHeure];
            return (
              <View key={typeHeure} style={styles.periodePreviewRow}>
                <View style={[styles.typeBadge, { backgroundColor: color }]}>
                  <Text style={styles.typeBadgeText}>{SHORT_LABELS_TYPE_HEURE[typeHeure]}</Text>
                </View>
                <Text style={styles.periodePreviewLabel}>{LABELS_TYPE_HEURE[typeHeure]}</Text>
                <Text style={styles.periodePreviewHeures}>{heures.toFixed(2)} h</Text>
                <Text style={styles.periodePreviewPU}>{pu.toFixed(2)} €/h</Text>
                <Text style={styles.periodePreviewMontant}>{formatMontantFR(total)}</Text>
              </View>
            );
          })}
          <View style={styles.periodePreviewTotalRow}>
            <Text style={styles.periodePreviewTotalLabel}>Total HT</Text>
            <Text style={styles.periodePreviewTotalValue}>
              {formatMontantFR(Math.round(totalHT * 100) / 100)}
            </Text>
          </View>
        </View>
      )}

      {/* Boutons */}
      <View style={styles.periodeActions}>
        <TouchableOpacity
          style={[styles.genBtn, breakdown.length === 0 && styles.genBtnDisabled]}
          onPress={handleGenerate}
          disabled={breakdown.length === 0}
        >
          <Text style={styles.genBtnText}>
            {breakdown.length > 0
              ? `Ajouter ${breakdown.length} ligne${breakdown.length > 1 ? 's' : ''}`
              : 'Ajouter les lignes'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// ÉDITEUR DE PRESTATION (MODAL)
// ─────────────────────────────────────────

interface Props {
  prestation: Prestation;
  visible: boolean;
  onClose: () => void;
}

export function PrestationEditor({ prestation, visible, onClose }: Props): React.ReactElement {
  const updatePrestation = useMissionStore((s) => s.updatePrestation);
  const deletePrestation = useMissionStore((s) => s.deletePrestation);
  const addLigne         = useMissionStore((s) => s.addLigne);

  const [titre, setTitre]           = useState(prestation.titre_bloc);
  const [desc, setDesc]             = useState(prestation.description_texte);
  const [showPeriode, setShowPeriode] = useState(false);

  const handleSave = () => {
    if (!titre.trim()) {
      Alert.alert('Champ requis', 'Le titre du bloc est obligatoire.');
      return;
    }
    updatePrestation(prestation.id, { titre_bloc: titre, description_texte: desc });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Supprimer la prestation', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => { deletePrestation(prestation.id); onClose(); },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Éditer la prestation</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <InputField
            label="Titre du bloc *"
            value={titre}
            onChangeText={setTitre}
            placeholder="Prestation Gardiennage & Surveillance par des Agents confirmés…"
          />

          <Text style={styles.sectionLabel}>Description texte</Text>
          <TextInput
            style={styles.textareaInput}
            value={desc}
            onChangeText={setDesc}
            placeholder={`Gardiennage nocturne assuré par 1 ADS :\nDu jeudi 11 au vendredi 12 juin de 18h00 à 08h00.\n…`}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            placeholderTextColor={COLORS.textLight}
          />

          {/* Lignes de facturation */}
          <View style={styles.lignesSection}>
            <Text style={styles.lignesSectionTitle}>Lignes de facturation</Text>
            <View style={styles.lignesHeader}>
              <Text style={[styles.lignesHeaderCell, { flex: 1 }]}>Désignation</Text>
              <Text style={[styles.lignesHeaderCell, styles.lignesHeaderNum]}>Qté</Text>
              <Text style={[styles.lignesHeaderCell, styles.lignesHeaderNum]}>PU HT</Text>
              <Text style={[styles.lignesHeaderCell, styles.lignesHeaderNum]}>Total</Text>
              <View style={{ width: 32 }} />
            </View>

            {prestation.lignes_facturation.map((l) => (
              <LigneRow key={l.id} ligne={l} prestationId={prestation.id} />
            ))}

            {/* Formulaire période */}
            {showPeriode ? (
              <PeriodeForm
                prestationId={prestation.id}
                onClose={() => setShowPeriode(false)}
              />
            ) : (
              <View style={styles.addBtns}>
                <TouchableOpacity
                  style={styles.addPeriodeBtn}
                  onPress={() => setShowPeriode(true)}
                >
                  <Text style={styles.addPeriodeBtnText}>+ Ajouter depuis une période</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addLigneBtn}
                  onPress={() => addLigne(prestation.id)}
                >
                  <Text style={styles.addLigneBtnText}>+ Ligne manuelle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button label="Enregistrer" onPress={handleSave} variant="accent" style={styles.btnSave} />
            <Button label="Annuler" onPress={onClose} variant="ghost" style={styles.btnCancel} />
            <Button label="Supprimer" onPress={handleDelete} variant="danger" small />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  closeBtn:   { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  scroll:     { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.secondary, marginBottom: 6 },
  textareaInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
    minHeight: 120,
    marginBottom: 16,
  },

  lignesSection:      { marginTop: 4 },
  lignesSectionTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.primary,
    marginBottom: 8, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  lignesHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingHorizontal: 4 },
  lignesHeaderCell: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  lignesHeaderNum: { width: 68, textAlign: 'right' },

  // ── Sélecteurs pills ──
  selectorScroll:   { marginBottom: 5 },
  selectorContent:  { gap: 4, paddingBottom: 2 },
  selectorBtn: {
    borderWidth: 1.5, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    alignItems: 'center', minWidth: 52,
  },
  selectorBtnLabel:    { fontSize: 10, fontWeight: '700' },
  selectorBtnLabelSel: { color: '#fff' },
  selectorBtnRate:     { fontSize: 9, marginTop: 1 },
  selectorBtnRateSel:  { color: 'rgba(255,255,255,0.85)' },

  // ── Type badge (read-only) ──
  typeBadge: {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center',
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // ── Ligne row ──
  ligneRow: {
    marginBottom: 8, backgroundColor: COLORS.white,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 8,
  },
  ligneTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 7,
    fontSize: 12, color: COLORS.textDark, backgroundColor: COLORS.sectionBg,
  },
  inputDesig:   { flex: 1, marginBottom: 6 },
  ligneNums:    { flexDirection: 'row', gap: 6, alignItems: 'center' },
  inputNum:     { width: 64, textAlign: 'right' },
  inputNumAuto: { backgroundColor: '#EBF8FF', borderColor: '#90CDF4', color: '#2B6CB0' },
  montantBox:   { flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 4 },
  montantText:  { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  deleteBtn: {
    width: 28, height: 28, backgroundColor: '#FFF5F5',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },

  // ── Boutons d'ajout ──
  addBtns:        { marginTop: 6, marginBottom: 16, gap: 8 },
  addPeriodeBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8,
    borderStyle: 'dashed', padding: 12, alignItems: 'center',
  },
  addPeriodeBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  addLigneBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 10, alignItems: 'center', backgroundColor: COLORS.white,
  },
  addLigneBtnText: { color: COLORS.textMid, fontSize: 12, fontWeight: '600' },

  // ── Formulaire période ──
  periodeForm: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 12,
    marginVertical: 8,
  },
  periodeFormTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 10,
  },
  periodeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.secondary, marginBottom: 4 },
  periodeDatesBlock: { gap: 8, marginBottom: 10 },
  periodeDateGroup:  {},
  periodeDateRow:    { flexDirection: 'row', gap: 6 },
  inputDatePeriode:  { flex: 1, fontSize: 13 },
  inputHeurePeriode: { width: 72, textAlign: 'center', fontSize: 13 },
  calculerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  calculerBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  periodeErreur: {
    color: COLORS.danger, fontSize: 12, marginBottom: 8,
    backgroundColor: '#FFF5F5', borderRadius: 6, padding: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },

  // ── Aperçu décomposition ──
  periodePreview: {
    backgroundColor: COLORS.sectionBg, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, padding: 10, marginBottom: 10,
  },
  periodePreviewTitle:   { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  periodePreviewRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  periodePreviewLabel:   { flex: 1, fontSize: 11, color: COLORS.textDark },
  periodePreviewHeures:  { width: 48, textAlign: 'right', fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  periodePreviewPU:      { width: 60, textAlign: 'right', fontSize: 11, color: COLORS.textMid },
  periodePreviewMontant: { width: 72, textAlign: 'right', fontSize: 12, fontWeight: '700', color: COLORS.accent },
  periodePreviewTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6, marginTop: 4,
  },
  periodePreviewTotalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  periodePreviewTotalValue: { fontSize: 13, fontWeight: '700', color: COLORS.accent },

  // ── Boutons période ──
  periodeActions: { flexDirection: 'row', gap: 8 },
  genBtn: {
    flex: 1, backgroundColor: COLORS.accent,
    borderRadius: 8, padding: 11, alignItems: 'center',
  },
  genBtnDisabled: { backgroundColor: COLORS.border },
  genBtnText:     { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 11, alignItems: 'center', backgroundColor: COLORS.white,
  },
  cancelBtnText: { color: COLORS.textMid, fontSize: 13, fontWeight: '600' },

  actions:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnSave:   { flex: 1 },
  btnCancel: { flex: 1 },
});

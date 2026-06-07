import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useMissionStore } from '@/store/missionStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/taux';
import { PrestationEditor } from './PrestationEditor';
import type { Prestation } from '@/types/mission';
import { calculerTotauxMission, formatMontantFR } from '@/utils/missionCalcul';

function PrestationCard({
  prestation,
  index,
  onEdit,
}: {
  prestation: Prestation;
  index: number;
  onEdit: () => void;
}): React.ReactElement {
  const totalH = prestation.lignes_facturation.reduce(
    (acc, l) => acc + l.quantite * l.pu_ht,
    0,
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIndex}>
          <Text style={styles.cardIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {prestation.titre_bloc || '(titre non renseigné)'}
          </Text>
          <Text style={styles.cardSub}>
            {prestation.lignes_facturation.length} ligne(s) — {formatMontantFR(totalH)} HT
          </Text>
        </View>
      </View>
      <Text style={styles.cardEdit}>Éditer ›</Text>
    </TouchableOpacity>
  );
}

export function PrestationsList(): React.ReactElement {
  const prestations = useMissionStore((s) => s.mission.prestations);
  const tva = useMissionStore((s) => s.mission.tva);
  const addPrestation = useMissionStore((s) => s.addPrestation);
  const totaux = calculerTotauxMission(prestations, tva);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = prestations.find((p) => p.id === editingId) ?? null;

  return (
    <SectionCard title="Prestations & lignes de facturation" step="5">
      {prestations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Aucune prestation. Cliquez sur «&nbsp;Ajouter une prestation&nbsp;» pour commencer.
          </Text>
        </View>
      ) : (
        <>
          {prestations.map((p, i) => (
            <PrestationCard
              key={p.id}
              prestation={p}
              index={i}
              onEdit={() => setEditingId(p.id)}
            />
          ))}

          {/* Mini récap totaux */}
          <View style={styles.recapBox}>
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Total HT</Text>
              <Text style={styles.recapValue}>{formatMontantFR(totaux.totalHT)}</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>TVA {tva}%</Text>
              <Text style={styles.recapValue}>{formatMontantFR(totaux.montantTVA)}</Text>
            </View>
            <View style={[styles.recapRow, styles.recapRowTTC]}>
              <Text style={styles.recapLabelTTC}>TOTAL TTC</Text>
              <Text style={styles.recapValueTTC}>{formatMontantFR(totaux.totalTTC)}</Text>
            </View>
          </View>
        </>
      )}

      <Button
        label="+ Ajouter une prestation"
        onPress={() => {
          addPrestation();
        }}
        variant="secondary"
        fullWidth
        style={styles.addBtn}
      />

      {editing && (
        <PrestationEditor
          key={editingId}
          prestation={editing}
          visible={editingId !== null}
          onClose={() => setEditingId(null)}
        />
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.sectionBg,
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  cardIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIndexText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, lineHeight: 18 },
  cardSub: { fontSize: 11, color: COLORS.textLight, marginTop: 3 },
  cardEdit: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginLeft: 8 },

  recapBox: {
    backgroundColor: COLORS.sectionBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  recapRowTTC: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
    paddingTop: 6,
  },
  recapLabel: { fontSize: 13, color: COLORS.textMid },
  recapValue: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  recapLabelTTC: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  recapValueTTC: { fontSize: 14, fontWeight: '700', color: COLORS.accent },

  addBtn: { marginTop: 4 },
});

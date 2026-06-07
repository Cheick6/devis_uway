import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useMissionStore } from '@/store/missionStore';
import { InputField } from '@/components/ui/InputField';
import { SectionCard } from '@/components/ui/SectionCard';
import { COLORS } from '@/constants/taux';

export function MissionInfoForm(): React.ReactElement {
  const info = useMissionStore((s) => s.mission.mission);
  const tva = useMissionStore((s) => s.mission.tva);
  const updateMissionInfo = useMissionStore((s) => s.updateMissionInfo);
  const updateTVA = useMissionStore((s) => s.updateTVA);

  return (
    <SectionCard title="Informations mission" step="2">
      <InputField
        label="Numéro de bon de commande *"
        value={info.numero_devis}
        onChangeText={(t) => updateMissionInfo({ numero_devis: t })}
        placeholder="B-002999"
      />
      <InputField
        label="Date d'émission"
        value={info.date_emission}
        onChangeText={(t) => updateMissionInfo({ date_emission: t })}
        placeholder="AAAA-MM-JJ"
        hint="Format : AAAA-MM-JJ"
      />
      <InputField
        label="Titre de l'événement"
        value={info.titre_evenement}
        onChangeText={(t) => updateMissionInfo({ titre_evenement: t })}
        placeholder="LE BANQUAI"
      />
      <InputField
        label="Lieu de l'événement"
        value={info.lieu_evenement}
        onChangeText={(t) => updateMissionInfo({ lieu_evenement: t })}
        placeholder="QUAI DE LA TOURNELLE PARIS 5ème"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Validité (jours)</Text>
          <TextInput
            style={styles.numInput}
            value={info.validite.toString()}
            onChangeText={(t) => updateMissionInfo({ validite: parseInt(t, 10) || 30 })}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>TVA (%)</Text>
          <TextInput
            style={styles.numInput}
            value={tva.toString()}
            onChangeText={(t) => updateTVA(parseFloat(t) || 0)}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  numInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },
});

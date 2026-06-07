import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useMissionStore } from '@/store/missionStore';
import { MissionClientForm } from '@/components/mission/MissionClientForm';
import { MissionInfoForm } from '@/components/mission/MissionInfoForm';
import { TarifConfigForm } from '@/components/mission/TarifConfigForm';
import { JoursFeriesForm } from '@/components/mission/JoursFeriesForm';
import { PrestationsList } from '@/components/mission/PrestationsList';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';

import { exporterMissionPDF } from '@/utils/exportPDF';
import { exporterMissionExcel } from '@/utils/exportExcel';
import { COLORS, SOCIETE_INFO } from '@/constants/taux';
import { formatMontantFR } from '@/utils/missionCalcul';

// ─────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────

function AppHeader(): React.ReactElement {
  const numero = useMissionStore((s) => s.mission.mission.numero_devis);
  const client = useMissionStore((s) => s.mission.client.nom);
  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <Text style={styles.headerLogoText}>{SOCIETE_INFO.initiales}</Text>
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.headerSociete}>{SOCIETE_INFO.nom}</Text>
        <Text style={styles.headerRef}>{numero}</Text>
        {!!client && <Text style={styles.headerClient}>{client}</Text>}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// SECTION EXPORT
// ─────────────────────────────────────────

function ExportSection(): React.ReactElement {
  const mission = useMissionStore((s) => s.mission);
  const prestations = mission.prestations;
  const hasData =
    prestations.length > 0 &&
    prestations.some((p) => p.lignes_facturation.length > 0);

  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingXLSX, setLoadingXLSX] = useState(false);

  const handleExportPDF = async () => {
    if (!hasData) {
      Alert.alert('Devis vide', 'Ajoutez au moins une prestation avec des lignes de facturation.');
      return;
    }
    setLoadingPDF(true);
    try {
      await exporterMissionPDF(mission);
    } catch (err) {
      Alert.alert('Erreur PDF', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!hasData) {
      Alert.alert('Devis vide', 'Ajoutez au moins une prestation avec des lignes de facturation.');
      return;
    }
    setLoadingXLSX(true);
    try {
      await exporterMissionExcel(mission);
    } catch (err) {
      Alert.alert('Erreur Excel', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingXLSX(false);
    }
  };

  return (
    <SectionCard title="Export du bon de commande" step="6">
      {!hasData && (
        <View style={styles.exportWarning}>
          <Text style={styles.exportWarningText}>
            Ajoutez des prestations avec des lignes de facturation pour activer les exports.
          </Text>
        </View>
      )}
      <Button
        label="Exporter en PDF (Bon de commande)"
        onPress={handleExportPDF}
        variant="primary"
        fullWidth
        loading={loadingPDF}
        disabled={!hasData}
        style={styles.exportBtn}
      />
      <Button
        label="Exporter en Excel (.xlsx)"
        onPress={handleExportExcel}
        variant="secondary"
        fullWidth
        loading={loadingXLSX}
        disabled={!hasData}
        style={styles.exportBtn}
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────

export default function Index(): React.ReactElement {
  const chargerMission = useMissionStore((s) => s.chargerMission);
  const reinitialiserMission = useMissionStore((s) => s.reinitialiserMission);
  const errorMessage = useMissionStore((s) => s.errorMessage);
  const setError = useMissionStore((s) => s.setError);
  const isLoading = useMissionStore((s) => s.isLoading);
  const totaux = useMissionStore((s) => s.totaux);
  const hasData = useMissionStore(
    (s) =>
      s.mission.prestations.length > 0 &&
      s.mission.prestations.some((p) => p.lignes_facturation.length > 0),
  );

  useEffect(() => {
    chargerMission();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      Alert.alert('Erreur', errorMessage, [{ text: 'OK', onPress: () => setError(null) }]);
    }
  }, [errorMessage]);

  const handleReset = () => {
    Alert.alert(
      'Nouveau bon de commande',
      'Le bon de commande actuel non sauvegardé sera perdu.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Nouveau', style: 'destructive', onPress: reinitialiserMission },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Barre de navigation */}
      <View style={styles.navbar}>
        <AppHeader />
        <TouchableOpacity style={[styles.navBtn, styles.navBtnDanger]} onPress={handleReset}>
          <Text style={styles.navBtnText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Bandeau total */}
      {hasData && (
        <View style={styles.totalBanner}>
          <Text style={styles.totalBannerLabel}>Total HT</Text>
          <Text style={styles.totalBannerValue}>{formatMontantFR(totaux.totalHT)}</Text>
          <Text style={styles.totalBannerLabel}>TTC</Text>
          <Text style={[styles.totalBannerValue, styles.totalBannerTTC]}>
            {formatMontantFR(totaux.totalTTC)}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MissionClientForm />
        <MissionInfoForm />
        <TarifConfigForm />
        <JoursFeriesForm />
        <PrestationsList />
        <ExportSection />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{SOCIETE_INFO.nom}</Text>
          <Text style={styles.footerSub}>Génération de bons de commande</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: { marginTop: 12, color: COLORS.textMid, fontSize: 15 },

  navbar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navBtnDanger: { backgroundColor: COLORS.accent },
  navBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  headerLogoText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  headerInfo: { flex: 1 },
  headerSociete: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  headerRef: { color: 'rgba(247,248,250,0.7)', fontSize: 11 },
  headerClient: { color: COLORS.accent, fontSize: 11, fontWeight: '600' },

  totalBanner: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  totalBannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  totalBannerValue: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  totalBannerTTC: { fontSize: 17 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 32 },

  exportBtn: { marginBottom: 10 },
  exportWarning: {
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#FEEBC8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  exportWarningText: { color: '#C05621', fontSize: 12 },

  footer: {
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  footerText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  footerSub: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
});

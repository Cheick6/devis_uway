/**
 * @file Section 2 — Liste des postes de travail avec ajout et édition modale.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useDevisStore } from '@/store/devisStore';
import { PosteForm } from '@/components/devis/PosteForm';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/taux';
import { calculerDureeHeures, formatHeures } from '@/utils/calcul';
import type { Poste } from '@/types/devis';

// ─────────────────────────────────────────
// CARTE POSTE (résumé)
// ─────────────────────────────────────────

interface PosteCardProps {
  poste: Poste;
  onEdit: () => void;
}

/**
 * Carte résumant un poste dans la liste (libellé, dates, agents, heures).
 */
function PosteCard({ poste, onEdit }: PosteCardProps): React.ReactElement {
  const heuresJour = poste.jourActif
    ? calculerDureeHeures(poste.heureJourDebut, poste.heureJourFin)
    : 0;
  const heuresNuit = poste.nuitActif
    ? calculerDureeHeures(poste.heureNuitDebut, poste.heureNuitFin)
    : 0;

  return (
    <TouchableOpacity style={styles.posteCard} onPress={onEdit} activeOpacity={0.8}>
      <View style={styles.posteLeft}>
        <View style={styles.posteAccent} />
        <View style={styles.posteInfo}>
          <Text style={styles.posteLibelle} numberOfLines={1}>
            {poste.libelle || '(Sans libellé)'}
          </Text>
          <Text style={styles.posteDates}>
            {poste.dateDebut} → {poste.dateFin}
          </Text>
          <View style={styles.posteTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{poste.agents} agent{poste.agents > 1 ? 's' : ''}</Text>
            </View>
            {heuresJour > 0 && (
              <View style={[styles.tag, styles.tagJour]}>
                <Text style={styles.tagText}>Jour {formatHeures(heuresJour)}/j</Text>
              </View>
            )}
            {heuresNuit > 0 && (
              <View style={[styles.tag, styles.tagNuit]}>
                <Text style={[styles.tagText, styles.tagTextNuit]}>Nuit {formatHeures(heuresNuit)}/j</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Text style={styles.editIcon}>›</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────

/**
 * Liste des postes de travail avec bouton d'ajout et édition modale.
 */
export function PosteList(): React.ReactElement {
  const postes = useDevisStore((state) => state.devis.postes);
  const addPoste = useDevisStore((state) => state.addPoste);

  const [posteEnEdition, setPosteEnEdition] = useState<Poste | null>(null);

  const handleAdd = () => {
    addPoste();
    // Ouvrir le dernier poste ajouté (sera dans le store après la prochaine re-render)
  };

  // Surveiller les changements de postes pour ouvrir le nouveau automatiquement
  const handleAddAndEdit = () => {
    addPoste();
    // Le poste sera en tête (ajouté en fin de tableau) — on écoute via useEffect
  };

  // Ouvrir automatiquement le dernier poste ajouté quand la liste s'allonge
  const prevLength = React.useRef(postes.length);
  React.useEffect(() => {
    if (postes.length > prevLength.current) {
      const dernier = postes[postes.length - 1];
      setPosteEnEdition(dernier);
    }
    prevLength.current = postes.length;
  }, [postes.length]);

  return (
    <>
      <SectionCard
        title="Postes de travail"
        step="2"
        action={
          <Button
            label="+ Ajouter"
            onPress={handleAddAndEdit}
            variant="accent"
            small
          />
        }
      >
        {postes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗂</Text>
            <Text style={styles.emptyText}>
              Aucun poste de travail.{'\n'}Appuyez sur "+ Ajouter" pour commencer.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.count}>
              {postes.length} poste{postes.length > 1 ? 's' : ''}
            </Text>
            {postes.map((poste) => (
              <PosteCard
                key={poste.id}
                poste={poste}
                onEdit={() => setPosteEnEdition(poste)}
              />
            ))}
          </View>
        )}
      </SectionCard>

      {/* ── Modal d'édition ── */}
      <Modal
        visible={posteEnEdition !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPosteEnEdition(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {posteEnEdition?.libelle ? `Éditer — ${posteEnEdition.libelle}` : 'Nouveau poste'}
            </Text>
          </View>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {posteEnEdition && (
              <PosteForm
                poste={posteEnEdition}
                onClose={() => setPosteEnEdition(null)}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  list: {},
  count: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },

  // Carte poste
  posteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sectionBg,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  posteLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  posteAccent: {
    width: 4,
    backgroundColor: COLORS.accent,
  },
  posteInfo: {
    flex: 1,
    padding: 12,
  },
  posteLibelle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  posteDates: {
    fontSize: 12,
    color: COLORS.textMid,
    marginBottom: 6,
  },
  posteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagJour: {
    backgroundColor: '#FEEBC8',
  },
  tagNuit: {
    backgroundColor: COLORS.primary,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textMid,
    fontWeight: '600',
  },
  tagTextNuit: {
    color: COLORS.white,
  },
  editIcon: {
    fontSize: 22,
    color: COLORS.textLight,
    paddingHorizontal: 12,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalScroll: {
    flex: 1,
  },
});

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DevisMission,
  MissionClient,
  MissionInfo,
  Prestation,
  LigneFacturation,
  TotauxMission,
  TarifMission,
  StatutAgent,
  PlageNuit,
  JourFerie,
  TypeHeure,
  Majoration,
} from '@/types/mission';
import { calculerTotauxMission, calculerPUHT } from '@/utils/missionCalcul';
import { getAujourdhuiISO } from '@/utils/calcul';

const STORAGE_KEY = '@uway:mission_v3';

// ─────────────────────────────────────────
// VALEURS PAR DÉFAUT
// ─────────────────────────────────────────

const STATUTS_DEFAUT: StatutAgent[] = [
  { id: 'ads',    nom: 'Agent de Sécurité (ADS)', tauxBase: 23 },
  { id: 'ce',     nom: "Chef d'Équipe",            tauxBase: 25 },
  { id: 'ssiap1', nom: 'SSIAP 1',                  tauxBase: 24 },
  { id: 'ssiap2', nom: 'SSIAP 2',                  tauxBase: 27 },
  { id: 'cyno',   nom: 'Agent Cynophile',           tauxBase: 28 },
  { id: 'ssiap3', nom: 'SSIAP Chef de Service',     tauxBase: 30 },
];

const PLAGE_NUIT_DEFAUT: PlageNuit = { debut: '21:00', fin: '06:00' };

const MAJORATIONS_DEFAUT: Majoration = {
  nuitSemaine:  10,
  jourDimanche: 10,
  nuitDimanche: 20,
  jourFerie:    100,
  nuitFerie:    100,
};

const TARIF_DEFAUT: TarifMission = {
  statuts:    STATUTS_DEFAUT,
  majorations: MAJORATIONS_DEFAUT,
  plageNuit:  PLAGE_NUIT_DEFAUT,
};

const FERIES_DEFAUT: JourFerie[] = [
  { id: 'f1',  date: '2026-01-01', nom: "Jour de l'An" },
  { id: 'f2',  date: '2026-04-06', nom: 'Lundi de Pâques' },
  { id: 'f3',  date: '2026-05-01', nom: 'Fête du Travail' },
  { id: 'f4',  date: '2026-05-08', nom: 'Victoire 1945' },
  { id: 'f5',  date: '2026-05-14', nom: 'Ascension' },
  { id: 'f6',  date: '2026-05-25', nom: 'Lundi de Pentecôte' },
  { id: 'f7',  date: '2026-07-14', nom: 'Fête Nationale' },
  { id: 'f8',  date: '2026-08-15', nom: 'Assomption' },
  { id: 'f9',  date: '2026-11-01', nom: 'Toussaint' },
  { id: 'f10', date: '2026-11-11', nom: 'Armistice' },
  { id: 'f11', date: '2026-12-25', nom: 'Noël' },
];

function creerMissionVide(): DevisMission {
  return {
    id: Date.now().toString(),
    client:  { nom: '', adresse: '', email: '', siret: '' },
    mission: {
      numero_devis:    `B-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      date_emission:   getAujourdhuiISO(),
      titre_evenement: '',
      lieu_evenement:  '',
      validite:        30,
    },
    prestations: [],
    tva:         20,
    tarif:       TARIF_DEFAUT,
    joursFeries: FERIES_DEFAUT,
  };
}

/** Migration des missions sauvegardées dans les versions précédentes */
function migrerMission(raw: DevisMission): DevisMission {
  const base = creerMissionVide();
  const tarif: TarifMission = {
    statuts:    raw.tarif?.statuts    ?? STATUTS_DEFAUT,
    majorations: raw.tarif?.majorations ?? MAJORATIONS_DEFAUT,
    plageNuit:  raw.tarif?.plageNuit  ?? PLAGE_NUIT_DEFAUT,
  };
  return {
    ...base,
    ...raw,
    tarif,
    joursFeries: raw.joursFeries ?? FERIES_DEFAUT,
    prestations: (raw.prestations ?? []).map((p) => ({
      ...p,
      lignes_facturation: (p.lignes_facturation ?? []).map((l) => ({
        statutId:  null,
        typeHeure: 'manuel' as TypeHeure,
        ...l,
      })),
    })),
  };
}

const TOTAUX_VIDES: TotauxMission = { totalHT: 0, montantTVA: 0, totalTTC: 0 };

// ─────────────────────────────────────────
// INTERFACE DU STORE
// ─────────────────────────────────────────

interface MissionStore {
  mission:      DevisMission;
  totaux:       TotauxMission;
  isLoading:    boolean;
  errorMessage: string | null;

  updateClient:      (updates: Partial<MissionClient>) => void;
  updateMissionInfo: (updates: Partial<MissionInfo>)   => void;
  updateTVA:         (tva: number)                      => void;

  // Tarif : plage nuit
  updatePlageNuit: (updates: Partial<PlageNuit>) => void;

  // Tarif : majorations
  updateMajoration: (key: keyof Majoration, valeur: number) => void;

  // Tarif : statuts agents
  addStatut:    (statut: Omit<StatutAgent, 'id'>)                         => void;
  updateStatut: (id: string, updates: Partial<Omit<StatutAgent, 'id'>>) => void;
  deleteStatut: (id: string)                                               => void;

  // Jours fériés
  addFerie:    (ferie: Omit<JourFerie, 'id'>)                         => void;
  deleteFerie: (id: string)                                             => void;
  updateFerie: (id: string, updates: Partial<Omit<JourFerie, 'id'>>) => void;

  // Prestations
  addPrestation:     ()                                                                              => void;
  updatePrestation:  (id: string, updates: Partial<Omit<Prestation, 'id' | 'lignes_facturation'>>) => void;
  deletePrestation:  (id: string)                                                                   => void;
  reorderPrestations:(from: number, to: number)                                                     => void;

  // Lignes
  addLigne:    (prestationId: string)                                                                   => void;
  addLignes:   (prestationId: string, lignes: Omit<LigneFacturation, 'id'>[])                          => void;
  updateLigne: (prestationId: string, ligneId: string, updates: Partial<Omit<LigneFacturation, 'id'>>) => void;
  deleteLigne: (prestationId: string, ligneId: string)                                                  => void;

  chargerMission:      () => Promise<void>;
  reinitialiserMission: ()  => void;
  setError:            (message: string | null) => void;
}

// ─────────────────────────────────────────
// STORE
// ─────────────────────────────────────────

export const useMissionStore = create<MissionStore>((set, get) => {
  const recompute = (mission: DevisMission) => {
    const totaux = calculerTotauxMission(mission.prestations, mission.tva);
    set({ mission, totaux });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mission)).catch(
      (e) => console.warn('[MissionStore] sauvegarde:', e),
    );
  };

  /**
   * Recalcule le pu_ht de toutes les lignes non-manuelles
   * (typeHeure ≠ 'manuel' ET statutId non-null).
   */
  const recalcLignes = (mission: DevisMission, tarif: TarifMission): Prestation[] =>
    mission.prestations.map((p) => ({
      ...p,
      lignes_facturation: p.lignes_facturation.map((l) => {
        if (l.typeHeure === 'manuel' || !l.statutId) return l;
        const statut = tarif.statuts.find((s) => s.id === l.statutId);
        if (!statut) return l;
        const computed = calculerPUHT(l.typeHeure, statut.tauxBase, tarif.majorations);
        return computed !== null ? { ...l, pu_ht: computed } : l;
      }),
    }));

  return {
    mission:      creerMissionVide(),
    totaux:       TOTAUX_VIDES,
    isLoading:    false,
    errorMessage: null,

    // ── Client / Mission ────────────────────────────────────────────
    updateClient: (updates) =>
      recompute({ ...get().mission, client: { ...get().mission.client, ...updates } }),

    updateMissionInfo: (updates) =>
      recompute({ ...get().mission, mission: { ...get().mission.mission, ...updates } }),

    updateTVA: (tva) => recompute({ ...get().mission, tva }),

    // ── Plage nuit ─────────────────────────────────────────────────
    updatePlageNuit: (updates) => {
      const current = get().mission;
      const tarif: TarifMission = {
        ...current.tarif,
        plageNuit: { ...current.tarif.plageNuit, ...updates },
      };
      recompute({ ...current, tarif });
    },

    // ── Majorations ────────────────────────────────────────────────
    updateMajoration: (key, valeur) => {
      const current = get().mission;
      const tarif: TarifMission = {
        ...current.tarif,
        majorations: { ...current.tarif.majorations, [key]: valeur },
      };
      const prestations = recalcLignes(current, tarif);
      recompute({ ...current, tarif, prestations });
    },

    // ── Statuts agents ─────────────────────────────────────────────
    addStatut: (statut) => {
      const current = get().mission;
      const newStatut: StatutAgent = { id: `s-${Date.now()}`, ...statut };
      const tarif: TarifMission = {
        ...current.tarif,
        statuts: [...current.tarif.statuts, newStatut],
      };
      recompute({ ...current, tarif });
    },

    updateStatut: (id, updates) => {
      const current = get().mission;
      const tarif: TarifMission = {
        ...current.tarif,
        statuts: current.tarif.statuts.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      };
      // Si le tauxBase a changé, recalc les lignes liées à ce statut
      const prestations = recalcLignes(current, tarif);
      recompute({ ...current, tarif, prestations });
    },

    deleteStatut: (id) => {
      const current = get().mission;
      const tarif: TarifMission = {
        ...current.tarif,
        statuts: current.tarif.statuts.filter((s) => s.id !== id),
      };
      // Détacher les lignes qui utilisaient ce statut
      const prestations = current.prestations.map((p) => ({
        ...p,
        lignes_facturation: p.lignes_facturation.map((l) =>
          l.statutId === id ? { ...l, statutId: null } : l,
        ),
      }));
      recompute({ ...current, tarif, prestations });
    },

    // ── Jours fériés ───────────────────────────────────────────────
    addFerie: (ferie) => {
      const newFerie: JourFerie = { id: `f-${Date.now()}`, ...ferie };
      const joursFeries = [...get().mission.joursFeries, newFerie].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      recompute({ ...get().mission, joursFeries });
    },

    deleteFerie: (id) =>
      recompute({
        ...get().mission,
        joursFeries: get().mission.joursFeries.filter((f) => f.id !== id),
      }),

    updateFerie: (id, updates) =>
      recompute({
        ...get().mission,
        joursFeries: get().mission.joursFeries
          .map((f) => (f.id === id ? { ...f, ...updates } : f))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }),

    // ── Prestations ────────────────────────────────────────────────
    addPrestation: () => {
      const p: Prestation = {
        id:                 `prest-${Date.now()}`,
        titre_bloc:         '',
        description_texte:  '',
        lignes_facturation: [],
      };
      recompute({ ...get().mission, prestations: [...get().mission.prestations, p] });
    },

    updatePrestation: (id, updates) => {
      const prestations = get().mission.prestations.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      );
      recompute({ ...get().mission, prestations });
    },

    deletePrestation: (id) =>
      recompute({
        ...get().mission,
        prestations: get().mission.prestations.filter((p) => p.id !== id),
      }),

    reorderPrestations: (from, to) => {
      const arr = [...get().mission.prestations];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      recompute({ ...get().mission, prestations: arr });
    },

    // ── Lignes ─────────────────────────────────────────────────────
    addLigne: (prestationId) => {
      const ligne: LigneFacturation = {
        id:          `ligne-${Date.now()}`,
        designation: '',
        statutId:    null,
        typeHeure:   'manuel',
        quantite:    0,
        pu_ht:       0,
      };
      const prestations = get().mission.prestations.map((p) =>
        p.id === prestationId
          ? { ...p, lignes_facturation: [...p.lignes_facturation, ligne] }
          : p,
      );
      recompute({ ...get().mission, prestations });
    },

    addLignes: (prestationId, lignes) => {
      const nouvelles: LigneFacturation[] = lignes.map((l, i) => ({
        ...l,
        id: `ligne-${Date.now()}-${i}`,
      }));
      const prestations = get().mission.prestations.map((p) =>
        p.id === prestationId
          ? { ...p, lignes_facturation: [...p.lignes_facturation, ...nouvelles] }
          : p,
      );
      recompute({ ...get().mission, prestations });
    },

    updateLigne: (prestationId, ligneId, updates) => {
      const prestations = get().mission.prestations.map((p) =>
        p.id === prestationId
          ? {
              ...p,
              lignes_facturation: p.lignes_facturation.map((l) =>
                l.id === ligneId ? { ...l, ...updates } : l,
              ),
            }
          : p,
      );
      recompute({ ...get().mission, prestations });
    },

    deleteLigne: (prestationId, ligneId) => {
      const prestations = get().mission.prestations.map((p) =>
        p.id === prestationId
          ? { ...p, lignes_facturation: p.lignes_facturation.filter((l) => l.id !== ligneId) }
          : p,
      );
      recompute({ ...get().mission, prestations });
    },

    // ── Persistance ─────────────────────────────────────────────────
    chargerMission: async () => {
      try {
        set({ isLoading: true });
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const raw = JSON.parse(json) as DevisMission;
          const mission = migrerMission(raw);
          const totaux = calculerTotauxMission(mission.prestations, mission.tva);
          set({ mission, totaux });
        }
      } catch {
        set({ errorMessage: 'Erreur lors du chargement' });
      } finally {
        set({ isLoading: false });
      }
    },

    reinitialiserMission: () => {
      const mission = creerMissionVide();
      set({ mission, totaux: TOTAUX_VIDES });
    },

    setError: (message) => set({ errorMessage: message }),
  };
});

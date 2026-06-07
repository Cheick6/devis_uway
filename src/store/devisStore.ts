/**
 * @file Store Zustand global pour la gestion du devis.
 * Choix Zustand : API simple, pas de boilerplate Redux,
 * persistance possible via middleware, et TypeScript natif.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  Devis,
  ClientInfo,
  Poste,
  Tarification,
  Majorations,
  JourFerie,
  LigneDevis,
  Recapitulatif,
  HistoriqueEntry,
  JoursActifs,
} from '@/types/devis';

import {
  TARIFICATION_DEFAUT,
  JOURS_ACTIFS_DEFAUT,
  CONDITIONS_GENERALES_DEFAUT,
  HISTORIQUE_MAX,
} from '@/constants/taux';

import {
  calculerLignesDevis,
  calculerRecapitulatif,
  genererReference,
  getAujourdhuiISO,
} from '@/utils/calcul';

import { calculerJoursFeriesOfficielsFrance } from '@/utils/feries';

// ─────────────────────────────────────────
// CLÉS ASYNCSTORAGE
// ─────────────────────────────────────────

const STORAGE_KEY_DEVIS = '@devis_securite:devis_courant';
const STORAGE_KEY_HISTORIQUE = '@devis_securite:historique';

// ─────────────────────────────────────────
// DEVIS PAR DÉFAUT
// ─────────────────────────────────────────

/**
 * Crée un devis vierge avec les valeurs par défaut.
 */
function creerDevisVide(): Devis {
  const annee = new Date().getFullYear();
  return {
    id: Date.now().toString(),
    clientInfo: {
      nom: '',
      adresse: '',
      reference: genererReference(),
      dateCreation: getAujourdhuiISO(),
      validite: 30,
      commercial: '',
    },
    postes: [],
    tarification: TARIFICATION_DEFAUT,
    joursFeries: calculerJoursFeriesOfficielsFrance(annee),
    conditionsGenerales: CONDITIONS_GENERALES_DEFAUT,
    dateCreation: getAujourdhuiISO(),
    dateModification: new Date().toISOString(),
  };
}

/**
 * Récapitulatif vide utilisé comme valeur initiale.
 */
const RECAP_VIDE: Recapitulatif = {
  totalHeuresJourSemaine: 0,
  totalHeuresNuitSemaine: 0,
  totalHeuresJourDimanche: 0,
  totalHeuresNuitDimanche: 0,
  totalHeuresJourFerie: 0,
  totalHeuresNuitFerie: 0,
  montantHT: 0,
  montantTVA: 0,
  montantTTC: 0,
  coutMoyenParAgent: 0,
  nbTotalAgentsHeures: 0,
};

// ─────────────────────────────────────────
// TYPES STORE
// ─────────────────────────────────────────

interface DevisStore {
  // ── State ──
  devis: Devis;
  lignes: LigneDevis[];
  recapitulatif: Recapitulatif;
  historique: HistoriqueEntry[];
  isLoading: boolean;
  errorMessage: string | null;

  // ── Actions client ──
  updateClientInfo: (updates: Partial<ClientInfo>) => void;

  // ── Actions postes ──
  addPoste: () => void;
  updatePoste: (id: string, updates: Partial<Poste>) => void;
  deletePoste: (id: string) => void;

  // ── Actions tarification ──
  updateTarification: (updates: Partial<Omit<Tarification, 'majorations'>>) => void;
  updateMajorations: (updates: Partial<Majorations>) => void;

  // ── Actions jours fériés ──
  addJourFerie: (date: string, nom: string) => void;
  deleteJourFerie: (id: string) => void;

  // ── Actions générales ──
  updateConditionsGenerales: (text: string) => void;

  // ── Persistance ──
  sauvegarderDevis: () => Promise<void>;
  chargerDevis: () => Promise<void>;
  sauvegarderDansHistorique: () => void;
  chargerDepuisHistorique: (id: string) => void;
  supprimerDeLHistorique: (id: string) => void;
  reinitialiserDevis: () => void;
  importerDevis: (data: Devis) => void;
  setError: (message: string | null) => void;
}

// ─────────────────────────────────────────
// STORE
// ─────────────────────────────────────────

export const useDevisStore = create<DevisStore>((set, get) => {
  /**
   * Recalcule les lignes et le récapitulatif puis persiste.
   * Appelé après chaque mutation du devis.
   */
  const recompute = (devis: Devis) => {
    const lignes = calculerLignesDevis(
      devis.postes,
      devis.tarification,
      devis.joursFeries,
    );
    const recapitulatif = calculerRecapitulatif(lignes, devis.tarification);
    const updatedDevis = { ...devis, dateModification: new Date().toISOString() };

    set({ devis: updatedDevis, lignes, recapitulatif });

    // Persistance asynchrone non-bloquante
    AsyncStorage.setItem(STORAGE_KEY_DEVIS, JSON.stringify(updatedDevis)).catch(
      (err) => console.warn('[DevisStore] Erreur sauvegarde:', err),
    );
  };

  return {
    // ── État initial ──
    devis: creerDevisVide(),
    lignes: [],
    recapitulatif: RECAP_VIDE,
    historique: [],
    isLoading: false,
    errorMessage: null,

    // ── Client ──
    updateClientInfo: (updates) => {
      const devis = { ...get().devis, clientInfo: { ...get().devis.clientInfo, ...updates } };
      recompute(devis);
    },

    // ── Postes ──
    addPoste: () => {
      const today = getAujourdhuiISO();
      const nouveauPoste: Poste = {
        id: `poste-${Date.now()}`,
        libelle: '',
        dateDebut: today,
        dateFin: today,
        agents: 1,
        jourActif: true,
        heureJourDebut: '08:00',
        heureJourFin: '20:00',
        nuitActif: false,
        heureNuitDebut: '20:00',
        heureNuitFin: '08:00',
        joursActifs: { ...JOURS_ACTIFS_DEFAUT },
      };
      const devis = { ...get().devis, postes: [...get().devis.postes, nouveauPoste] };
      recompute(devis);
    },

    updatePoste: (id, updates) => {
      const postes = get().devis.postes.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      );
      recompute({ ...get().devis, postes });
    },

    deletePoste: (id) => {
      const postes = get().devis.postes.filter((p) => p.id !== id);
      recompute({ ...get().devis, postes });
    },

    // ── Tarification ──
    updateTarification: (updates) => {
      const tarification = { ...get().devis.tarification, ...updates };
      recompute({ ...get().devis, tarification });
    },

    updateMajorations: (updates) => {
      const majorations = { ...get().devis.tarification.majorations, ...updates };
      const tarification = { ...get().devis.tarification, majorations };
      recompute({ ...get().devis, tarification });
    },

    // ── Jours fériés ──
    addJourFerie: (date, nom) => {
      const nouvelFerie: JourFerie = {
        id: `custom-${Date.now()}`,
        date,
        nom,
        officiel: false,
      };
      const joursFeries = [...get().devis.joursFeries, nouvelFerie].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      recompute({ ...get().devis, joursFeries });
    },

    deleteJourFerie: (id) => {
      const joursFeries = get().devis.joursFeries.filter((f) => f.id !== id);
      recompute({ ...get().devis, joursFeries });
    },

    // ── Conditions générales ──
    updateConditionsGenerales: (text) => {
      recompute({ ...get().devis, conditionsGenerales: text });
    },

    // ── Persistance ──
    sauvegarderDevis: async () => {
      try {
        set({ isLoading: true });
        await AsyncStorage.setItem(STORAGE_KEY_DEVIS, JSON.stringify(get().devis));
      } catch (err) {
        set({ errorMessage: 'Erreur lors de la sauvegarde' });
      } finally {
        set({ isLoading: false });
      }
    },

    chargerDevis: async () => {
      try {
        set({ isLoading: true });

        // Charger le devis courant
        const devisJSON = await AsyncStorage.getItem(STORAGE_KEY_DEVIS);
        if (devisJSON) {
          const devis: Devis = JSON.parse(devisJSON);
          const lignes = calculerLignesDevis(devis.postes, devis.tarification, devis.joursFeries);
          const recapitulatif = calculerRecapitulatif(lignes, devis.tarification);
          set({ devis, lignes, recapitulatif });
        }

        // Charger l'historique
        const histJSON = await AsyncStorage.getItem(STORAGE_KEY_HISTORIQUE);
        if (histJSON) {
          set({ historique: JSON.parse(histJSON) });
        }
      } catch (err) {
        set({ errorMessage: 'Erreur lors du chargement' });
      } finally {
        set({ isLoading: false });
      }
    },

    sauvegarderDansHistorique: () => {
      const { devis, recapitulatif, historique } = get();
      const entry: HistoriqueEntry = {
        id: devis.id,
        reference: devis.clientInfo.reference,
        client: devis.clientInfo.nom,
        dateCreation: devis.clientInfo.dateCreation,
        montantHT: recapitulatif.montantHT,
        snapshot: JSON.stringify(devis),
      };

      // Remplacer si existe déjà, sinon ajouter en tête
      const existeIndex = historique.findIndex((h) => h.id === entry.id);
      let nouvelHistorique: HistoriqueEntry[];
      if (existeIndex >= 0) {
        nouvelHistorique = [...historique];
        nouvelHistorique[existeIndex] = entry;
      } else {
        nouvelHistorique = [entry, ...historique].slice(0, HISTORIQUE_MAX);
      }

      set({ historique: nouvelHistorique });
      AsyncStorage.setItem(STORAGE_KEY_HISTORIQUE, JSON.stringify(nouvelHistorique)).catch(
        (err) => console.warn('[DevisStore] Erreur sauvegarde historique:', err),
      );
    },

    chargerDepuisHistorique: (id) => {
      const entry = get().historique.find((h) => h.id === id);
      if (!entry) return;
      const devis: Devis = JSON.parse(entry.snapshot);
      const lignes = calculerLignesDevis(devis.postes, devis.tarification, devis.joursFeries);
      const recapitulatif = calculerRecapitulatif(lignes, devis.tarification);
      set({ devis, lignes, recapitulatif });
    },

    supprimerDeLHistorique: (id) => {
      const historique = get().historique.filter((h) => h.id !== id);
      set({ historique });
      AsyncStorage.setItem(STORAGE_KEY_HISTORIQUE, JSON.stringify(historique)).catch(
        (err) => console.warn('[DevisStore] Erreur suppression historique:', err),
      );
    },

    reinitialiserDevis: () => {
      const devis = creerDevisVide();
      set({ devis, lignes: [], recapitulatif: RECAP_VIDE });
    },

    importerDevis: (data) => {
      recompute(data);
    },

    setError: (message) => {
      set({ errorMessage: message });
    },
  };
});

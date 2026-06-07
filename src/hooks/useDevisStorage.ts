/**
 * @file Hook pour la persistance, l'import/export JSON et la gestion de l'historique.
 */

import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useDevisStore } from '@/store/devisStore';
import type { Devis, HistoriqueEntry } from '@/types/devis';

// ─────────────────────────────────────────
// HOOK PRINCIPAL
// ─────────────────────────────────────────

/**
 * Expose les opérations de persistance et d'import/export.
 *
 * @returns Actions et état liés au stockage
 */
export function useDevisStorage(): {
  historique: HistoriqueEntry[];
  isLoading: boolean;
  chargerDevis: () => Promise<void>;
  sauvegarderDansHistorique: () => void;
  chargerDepuisHistorique: (id: string) => void;
  supprimerDeLHistorique: (id: string) => void;
  reinitialiserDevis: () => void;
  exporterJSON: () => string;
  importerJSON: (json: string) => boolean;
} {
  const historique = useDevisStore((state) => state.historique);
  const isLoading = useDevisStore((state) => state.isLoading);
  const devis = useDevisStore((state) => state.devis);

  const chargerDevis = useDevisStore((state) => state.chargerDevis);
  const sauvegarderDansHistorique = useDevisStore((state) => state.sauvegarderDansHistorique);
  const chargerDepuisHistorique = useDevisStore((state) => state.chargerDepuisHistorique);
  const supprimerDeLHistorique = useDevisStore((state) => state.supprimerDeLHistorique);
  const reinitialiserDevis = useDevisStore((state) => state.reinitialiserDevis);
  const importerDevis = useDevisStore((state) => state.importerDevis);
  const setError = useDevisStore((state) => state.setError);

  /**
   * Exporte le devis courant au format JSON.
   *
   * @returns Chaîne JSON du devis
   */
  const exporterJSON = useCallback((): string => {
    return JSON.stringify(devis, null, 2);
  }, [devis]);

  /**
   * Importe un devis depuis une chaîne JSON.
   * Valide la structure minimale avant import.
   *
   * @param json - Chaîne JSON à importer
   * @returns true si import réussi, false sinon
   */
  const importerJSON = useCallback(
    (json: string): boolean => {
      try {
        const data: unknown = JSON.parse(json);

        // Validation minimale de structure
        if (
          typeof data !== 'object' ||
          data === null ||
          !('clientInfo' in data) ||
          !('postes' in data) ||
          !('tarification' in data)
        ) {
          setError('Format JSON invalide : structure de devis manquante');
          return false;
        }

        importerDevis(data as Devis);
        return true;
      } catch {
        setError('Fichier JSON corrompu ou invalide');
        return false;
      }
    },
    [importerDevis, setError],
  );

  return {
    historique,
    isLoading,
    chargerDevis,
    sauvegarderDansHistorique,
    chargerDepuisHistorique,
    supprimerDeLHistorique,
    reinitialiserDevis,
    exporterJSON,
    importerJSON,
  };
}

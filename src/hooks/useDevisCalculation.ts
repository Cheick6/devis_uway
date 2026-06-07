/**
 * @file Hook exposant les données calculées du devis.
 * Encapsule l'accès au store pour les composants consommateurs.
 */

import { useDevisStore } from '@/store/devisStore';
import type { LigneDevis, Recapitulatif } from '@/types/devis';

// ─────────────────────────────────────────
// HOOK PRINCIPAL
// ─────────────────────────────────────────

/**
 * Retourne les lignes de décomposition et le récapitulatif calculés.
 * Les données sont automatiquement mises à jour à chaque modification du devis.
 *
 * @returns Objet contenant lignes, récapitulatif et utilitaires de formatage
 */
export function useDevisCalculation(): {
  lignes: LigneDevis[];
  recapitulatif: Recapitulatif;
  nbLignes: number;
  hasData: boolean;
} {
  const lignes = useDevisStore((state) => state.lignes);
  const recapitulatif = useDevisStore((state) => state.recapitulatif);

  return {
    lignes,
    recapitulatif,
    nbLignes: lignes.length,
    hasData: lignes.length > 0,
  };
}

// Sélecteurs du Coffre documentaire filtrés par le persona courant.
//
// Combine `useIDocVaultStore` (état brut) avec `useCurrentPersona` et les
// helpers purs de `vaultAccess` pour exposer des hooks prêts à consommer
// dans l'UI sans dupliquer la logique d'autorisation.

import { useEffect, useMemo } from "react";
import { useCurrentPersona } from "@/auth/useCurrentPersona";
import {
  canShare,
  canViewDocument,
  canViewFolder,
  sectionForFolder,
  type VaultSection,
} from "@/lib/vaultAccess";
import { useIDocVaultStore } from "@/stores/iDocVaultStore";
import type { VaultDocument, VaultFolder } from "@/types/idocument";
import type { Persona } from "@/data/icns-personas";

/**
 * S'assure que le store est seedé au premier accès. À monter une seule
 * fois côté composant racine du module (ex. IDocumentSection).
 */
export function useEnsureVaultSeeded(): void {
  const seeded = useIDocVaultStore((s) => s.seeded);
  const seed = useIDocVaultStore((s) => s.seed);
  useEffect(() => {
    if (!seeded) seed();
  }, [seeded, seed]);
}

interface VisibleFoldersResult {
  persona: Persona | null;
  all: VaultFolder[];
  bySection: Record<VaultSection, VaultFolder[]>;
}

const EMPTY_BY_SECTION: Record<VaultSection, VaultFolder[]> = {
  system: [],
  private: [],
  shared_with_me: [],
  service: [],
  cellules: [],
  cns_wide: [],
};

export function useVisibleFolders(): VisibleFoldersResult {
  const persona = useCurrentPersona();
  const folders = useIDocVaultStore((s) => s.folders);

  return useMemo(() => {
    if (!persona) {
      return { persona: null, all: [], bySection: EMPTY_BY_SECTION };
    }
    const visible = folders.filter(
      (f) => f.status !== "trashed" && canViewFolder(f, persona),
    );
    const bySection: Record<VaultSection, VaultFolder[]> = {
      system: [],
      private: [],
      shared_with_me: [],
      service: [],
      cellules: [],
      cns_wide: [],
    };
    for (const f of visible) {
      const section = sectionForFolder(f, persona);
      bySection[section].push(f);
    }
    // Tri stable : système conserve l'ordre du seed, les autres par nom.
    for (const k of Object.keys(bySection) as VaultSection[]) {
      if (k === "system") continue;
      bySection[k] = [...bySection[k]].sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      );
    }
    return { persona, all: visible, bySection };
  }, [persona, folders]);
}

export function useVisibleDocuments(folderId: string | null): VaultDocument[] {
  const persona = useCurrentPersona();
  const documents = useIDocVaultStore((s) => s.documents);
  return useMemo(() => {
    if (!persona) return [];
    return documents
      .filter((d) => d.status !== "trashed")
      .filter((d) => (folderId === null ? true : d.folderId === folderId))
      .filter((d) => canViewDocument(d, persona));
  }, [persona, documents, folderId]);
}

export function useCanShare(): boolean {
  const persona = useCurrentPersona();
  return useMemo(() => canShare(persona), [persona]);
}

/**
 * Reset automatique du store quand l'utilisateur se déconnecte
 * (transition `isAuthenticated` true→false). Évite qu'un dossier créé
 * lors d'une session précédente reste visible pour un autre persona
 * connecté ensuite dans le même onglet.
 */
export function useResetVaultOnLogout(isAuthenticated: boolean): void {
  const reset = useIDocVaultStore((s) => s.reset);
  useEffect(() => {
    if (!isAuthenticated) reset();
  }, [isAuthenticated, reset]);
}

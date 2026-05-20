// Store Zustand du Coffre documentaire iDocument iCNS.
//
// Persistance : **en mémoire uniquement** (Map). Alignement strict avec la
// politique iCNS "aucune donnée sensible sur localStorage/sessionStorage".
// Une recharge de page = état vierge (l'utilisateur est déjà déconnecté
// puisque le JWT est en mémoire aussi).
//
// Pour la démo, le store est seedé au premier accès :
//   - 3 dossiers système : Mes Documents / Brouillons / Poubelle
//   - 6 dossiers métier CNS visibles cns_wide (Renseignements, Opérations…)
//   - quelques documents d'exemple
//
// Toutes les mutations sont synchrones — aucun appel réseau.

import { create } from "zustand";
import type {
  VaultDocument,
  VaultDocumentSource,
  VaultFolder,
  VaultVisibility,
} from "@/types/idocument";
import type { Classification } from "@/data/icns-personas";

const SYSTEM_OWNER = "__system__";

const SYSTEM_FOLDERS: ReadonlyArray<
  Pick<VaultFolder, "id" | "name"> & { isTrash?: boolean }
> = [
  { id: "sys-mes-documents", name: "Mes Documents" },
  { id: "sys-brouillons", name: "Brouillons" },
  { id: "sys-poubelle", name: "Poubelle", isTrash: true },
];

// Les 13 cellules contributrices du renseignement national. Chaque cellule
// est matérialisée par un dossier appartenant à son directeur, avec
// visibilité `service` — accès automatique pour les agents de la cellule
// ET pour la cellule centrale CNS (règle d'exception dans `vaultAccess`).
const CELLULE_FOLDERS: ReadonlyArray<{
  id: string;
  name: string;
  serviceCode: string;
  ownerMatricule: string;
  tags: string[];
}> = [
  { id: "cellule-b2", name: "Cellule B2", serviceCode: "B2", ownerMatricule: "B2-DIR-001", tags: ["sécurité-état", "intérieur"] },
  { id: "cellule-dgdi", name: "Cellule DGDI", serviceCode: "DGDI", ownerMatricule: "DGDI-DIR-001", tags: ["immigration", "documentation"] },
  { id: "cellule-dgr", name: "Cellule DGR", serviceCode: "DGR", ownerMatricule: "DGR-DIR-001", tags: ["extérieur", "sous-région"] },
  { id: "cellule-dgss", name: "Cellule DGSS", serviceCode: "DGSS", ownerMatricule: "DGSS-DIR-001", tags: ["services-spéciaux"] },
  { id: "cellule-gr", name: "Cellule Garde Républicaine", serviceCode: "GR", ownerMatricule: "GR-DIR-001", tags: ["protection-rapprochée"] },
  { id: "cellule-gn", name: "Cellule Gendarmerie", serviceCode: "GN", ownerMatricule: "GN-DIR-001", tags: ["gendarmerie", "territoire"] },
  { id: "cellule-fagt", name: "Cellule FAG Terre", serviceCode: "FAG_TERRE", ownerMatricule: "FAGT-DIR-001", tags: ["forces-armées", "terre"] },
  { id: "cellule-faga", name: "Cellule FAG Air", serviceCode: "FAG_AIR", ownerMatricule: "FAGA-DIR-001", tags: ["forces-armées", "air"] },
  { id: "cellule-fagm", name: "Cellule FAG Marine", serviceCode: "FAG_MARINE", ownerMatricule: "FAGM-DIR-001", tags: ["forces-armées", "marine"] },
  { id: "cellule-police", name: "Cellule Police RG", serviceCode: "POLICE", ownerMatricule: "POL-DIR-001", tags: ["police", "renseignements-généraux"] },
  { id: "cellule-silam", name: "Cellule SILAM", serviceCode: "SILAM", ownerMatricule: "SILAM-DIR-001", tags: ["anti-trafic"] },
  { id: "cellule-dgsp", name: "Cellule DGSP", serviceCode: "DGSP", ownerMatricule: "DGSP-DIR-001", tags: ["sécurité-présidentielle"] },
  { id: "cellule-douane", name: "Cellule Douane", serviceCode: "DOUANE", ownerMatricule: "DOUANE-DIR-001", tags: ["douane", "frontières"] },
];

// Dossiers d'usage transverse, visibles par tout l'iCNS authentifié
// (doctrine, comptes-rendus). Ils n'appartiennent à aucune cellule.
const CNS_WIDE_FOLDERS: ReadonlyArray<{
  id: string;
  name: string;
  tags: string[];
}> = [
  { id: "cns-doctrine", name: "Doctrine & Procédures", tags: ["doctrine", "procédure"] },
  { id: "cns-comptes-rendus", name: "Comptes-rendus CNS", tags: ["compte-rendu", "réunion"] },
];

function makeSeedFolders(): VaultFolder[] {
  const now = Date.now();
  const systems: VaultFolder[] = SYSTEM_FOLDERS.map((s) => ({
    id: s.id,
    name: s.name,
    parentFolderId: null,
    ownerMatricule: SYSTEM_OWNER,
    classification: "DR" as Classification,
    visibility: { kind: "cns_wide" } as VaultVisibility,
    tags: [],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
    documentCount: 0,
    status: "active",
  }));

  const cellules: VaultFolder[] = CELLULE_FOLDERS.map((c) => ({
    id: c.id,
    name: c.name,
    parentFolderId: null,
    ownerMatricule: c.ownerMatricule,
    classification: "DR" as Classification,
    visibility: { kind: "service", service: c.serviceCode } as VaultVisibility,
    tags: c.tags,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    documentCount: 0,
    status: "active",
  }));

  const cnsWide: VaultFolder[] = CNS_WIDE_FOLDERS.map((b) => ({
    id: b.id,
    name: b.name,
    parentFolderId: null,
    ownerMatricule: SYSTEM_OWNER,
    classification: "DR" as Classification,
    visibility: { kind: "cns_wide" } as VaultVisibility,
    tags: b.tags,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    documentCount: 0,
    status: "active",
  }));

  return [...systems, ...cellules, ...cnsWide];
}

function makeSeedDocuments(): VaultDocument[] {
  const now = Date.now();
  // Documents partagés par chaque cellule avec le CNS. Le `folderId` cible
  // le dossier-cellule, le `ownerMatricule` est l'agent émetteur, et la
  // `visibility` hérite du dossier (`service`) pour respecter la chaîne
  // de besoin-d'en-connaître.
  const sample: Array<{
    title: string;
    folderId: string;
    serviceCode: string;
    ownerMatricule: string;
    classification: Classification;
    source: VaultDocumentSource;
    tags: string[];
  }> = [
    { title: "Note B2 — Mouvements frontière nord", folderId: "cellule-b2", serviceCode: "B2", ownerMatricule: "B2-CHF-001", classification: "SD", source: "correspondance", tags: ["frontière", "nord"] },
    { title: "Synthèse DGR — Convergences avril", folderId: "cellule-dgr", serviceCode: "DGR", ownerMatricule: "DGR-DIR-001", classification: "SD", source: "upload", tags: ["synthèse", "sous-région"] },
    { title: "Alerte DGSS — Cellule clandestine", folderId: "cellule-dgss", serviceCode: "DGSS", ownerMatricule: "DGSS-DIR-001", classification: "TSD", source: "correspondance", tags: ["alerte", "urgent"] },
    { title: "DGDI — Flux migratoires Q1", folderId: "cellule-dgdi", serviceCode: "DGDI", ownerMatricule: "DGDI-CHF-001", classification: "CD", source: "upload", tags: ["migration", "rapport"] },
    { title: "Police RG — Manifestations Libreville", folderId: "cellule-police", serviceCode: "POLICE", ownerMatricule: "POL-CHF-001", classification: "DR", source: "scan", tags: ["manifestation"] },
    { title: "SILAM — Saisie réseau de stupéfiants", folderId: "cellule-silam", serviceCode: "SILAM", ownerMatricule: "SILAM-CHF-001", classification: "CD", source: "correspondance", tags: ["stupéfiants"] },
    { title: "Procédure d'alerte CNS-W3", folderId: "cns-doctrine", serviceCode: "", ownerMatricule: SYSTEM_OWNER, classification: "DR", source: "upload", tags: ["procédure"] },
    { title: "Compte-rendu réunion SG du 12/04", folderId: "cns-comptes-rendus", serviceCode: "", ownerMatricule: SYSTEM_OWNER, classification: "CD", source: "scan", tags: ["SG", "réunion"] },
  ];

  return sample.map((s, i) => ({
    id: `seed-doc-${i + 1}`,
    title: s.title,
    folderId: s.folderId,
    ownerMatricule: s.ownerMatricule,
    classification: s.classification,
    visibility: s.serviceCode
      ? ({ kind: "service", service: s.serviceCode } as VaultVisibility)
      : ({ kind: "cns_wide" } as VaultVisibility),
    tags: s.tags,
    status: "published",
    source: s.source,
    createdAt: now - (i + 1) * 86_400_000,
    updatedAt: now - (i + 1) * 3_600_000,
  }));
}

// ──────────────────────────────────────────────────────────────────────
// Types du store
// ──────────────────────────────────────────────────────────────────────

interface CreateFolderInput {
  name: string;
  ownerMatricule: string;
  classification: Classification;
  visibility: VaultVisibility;
  tags?: string[];
  parentFolderId?: string | null;
}

interface CreateDocumentInput {
  title: string;
  folderId: string | null;
  ownerMatricule: string;
  classification: Classification;
  visibility?: VaultVisibility;
  tags?: string[];
  source?: VaultDocumentSource;
  size?: number;
  mimeType?: string;
  fileUrl?: string;
  storagePath?: string;
}

interface IDocVaultState {
  folders: VaultFolder[];
  documents: VaultDocument[];
  seeded: boolean;

  seed: () => void;
  reset: () => void;

  createFolder: (input: CreateFolderInput) => VaultFolder;
  updateFolderSharing: (folderId: string, visibility: VaultVisibility) => void;
  trashFolder: (folderId: string) => void;
  restoreFolder: (folderId: string) => void;

  createDocument: (input: CreateDocumentInput) => VaultDocument;
  trashDocument: (documentId: string) => void;
  permanentlyDelete: (documentId: string) => void;
}

// Génère un id court côté client (suffisant pour la démo en mémoire).
function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export const useIDocVaultStore = create<IDocVaultState>((set, get) => ({
  folders: [],
  documents: [],
  seeded: false,

  seed: () => {
    if (get().seeded) return;
    set({
      folders: makeSeedFolders(),
      documents: makeSeedDocuments(),
      seeded: true,
    });
    // Recalcul des compteurs après seed.
    recomputeDocumentCounts(set, get);
  },

  reset: () => {
    set({ folders: [], documents: [], seeded: false });
  },

  createFolder: (input) => {
    const now = Date.now();
    const folder: VaultFolder = {
      id: makeId("fold"),
      name: input.name.trim(),
      parentFolderId: input.parentFolderId ?? null,
      ownerMatricule: input.ownerMatricule,
      classification: input.classification,
      visibility: input.visibility,
      tags: input.tags ?? [],
      isSystem: false,
      createdAt: now,
      updatedAt: now,
      documentCount: 0,
      status: "active",
    };
    set((s) => ({ folders: [...s.folders, folder] }));
    return folder;
  },

  updateFolderSharing: (folderId, visibility) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId && !f.isSystem
          ? { ...f, visibility, updatedAt: Date.now() }
          : f,
      ),
    }));
  },

  trashFolder: (folderId) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId && !f.isSystem
          ? { ...f, status: "trashed", updatedAt: Date.now() }
          : f,
      ),
    }));
  },

  restoreFolder: (folderId) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId
          ? { ...f, status: "active", updatedAt: Date.now() }
          : f,
      ),
    }));
  },

  createDocument: (input) => {
    const now = Date.now();
    const doc: VaultDocument = {
      id: makeId("doc"),
      title: input.title.trim(),
      folderId: input.folderId,
      ownerMatricule: input.ownerMatricule,
      classification: input.classification,
      visibility:
        input.visibility ??
        ({ kind: "private" } satisfies VaultVisibility),
      tags: input.tags ?? [],
      status: "draft",
      source: input.source ?? "upload",
      createdAt: now,
      updatedAt: now,
      size: input.size,
      mimeType: input.mimeType,
      fileUrl: input.fileUrl,
      storagePath: input.storagePath,
    };
    set((s) => ({ documents: [...s.documents, doc] }));
    recomputeDocumentCounts(set, get);
    return doc;
  },

  trashDocument: (documentId) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === documentId
          ? { ...d, status: "trashed", updatedAt: Date.now() }
          : d,
      ),
    }));
    recomputeDocumentCounts(set, get);
  },

  permanentlyDelete: (documentId) => {
    set((s) => ({ documents: s.documents.filter((d) => d.id !== documentId) }));
    recomputeDocumentCounts(set, get);
  },
}));

// Recalcule `documentCount` à partir de l'état courant (mutation atomique).
function recomputeDocumentCounts(
  set: (s: Partial<IDocVaultState>) => void,
  get: () => IDocVaultState,
): void {
  const docs = get().documents;
  const counts = new Map<string, number>();
  for (const d of docs) {
    if (d.status === "trashed" || !d.folderId) continue;
    counts.set(d.folderId, (counts.get(d.folderId) ?? 0) + 1);
  }
  set({
    folders: get().folders.map((f) => ({
      ...f,
      documentCount: counts.get(f.id) ?? 0,
    })),
  });
}

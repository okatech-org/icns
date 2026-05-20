// Types iDocument — gestion electronique de documents (GED) executif
// Reflete la schema Supabase 20260504120000_idoc_create_module.sql

import type { Classification, RoleICNS } from "@/data/icns-personas";

export type IDocStatus = "draft" | "published" | "archived" | "trashed";
export type IDocFolderStatus = "active" | "trashed";

// ──────────────────────────────────────────────────────────────────────
// Coffre documentaire iCNS — modèle client (Phase démo Zustand)
// Aligne sur le système de sécurité iCNS : classification DR/CD/SD/TSD
// et règle d'accès « habilitation_user ≥ classification_dossier ».
// ──────────────────────────────────────────────────────────────────────

export type VaultVisibility =
  | { kind: "private" }
  | {
      kind: "shared";
      matricules: string[];
      roles: RoleICNS[];
      services: string[];
    }
  | { kind: "service"; service: string }
  | { kind: "cns_wide" };

export type VaultDocumentSource =
  | "correspondance"
  | "upload"
  | "inbound-email"
  | "scan";

export interface VaultFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
  ownerMatricule: string;
  classification: Classification;
  visibility: VaultVisibility;
  tags: string[];
  isSystem: boolean;
  createdAt: number;
  updatedAt: number;
  documentCount: number;
  status: IDocFolderStatus;
}

export interface VaultDocument {
  id: string;
  title: string;
  folderId: string | null;
  ownerMatricule: string;
  classification: Classification;
  visibility: VaultVisibility;
  tags: string[];
  status: IDocStatus;
  source: VaultDocumentSource;
  createdAt: number;
  updatedAt: number;
  size?: number;
  mimeType?: string;
  /** URL d'aperçu (blob: en mode démo, URL signée Supabase en prod). */
  fileUrl?: string;
  /** Chemin de stockage backend (non utilisé en mode démo). */
  storagePath?: string;
}

export interface IDocFolder {
    id: string;
    name: string;
    description: string | null;
    parent_folder_id: string | null;
    created_by: string;
    organization_id: string | null;
    tags: string[];
    color: string | null;
    icon: string | null;
    is_system: boolean;
    status: IDocFolderStatus;
    document_count: number;
    created_at: string;
    updated_at: string;
}

export interface IDocFolderWithChildren extends IDocFolder {
    children: IDocFolderWithChildren[];
}

export interface IDocDocumentType {
    id: string;
    organization_id: string | null;
    nom: string;
    code: string;
    description: string | null;
    icone: string | null;
    couleur: string | null;
    retention_category_slug: string | null;
    is_default: boolean;
    est_actif: boolean;
    created_at: string;
    updated_at: string;
}

export interface IDocDocument {
    id: string;
    title: string;
    description: string | null;
    folder_id: string | null;
    document_type_id: string | null;
    created_by: string;
    last_edited_by: string | null;
    organization_id: string | null;
    status: IDocStatus;
    storage_path: string | null;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    content_hash: string | null;
    tags: string[];
    custom_metadata: Record<string, unknown>;
    trashed_at: string | null;
    trashed_by: string | null;
    previous_status: string | null;
    current_version: number;
    archive_id: string | null;
    archived_at: string | null;
    archived_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface IDocDocumentWithRelations extends IDocDocument {
    folder?: IDocFolder | null;
    document_type?: IDocDocumentType | null;
}

export interface IDocDocumentVersion {
    id: string;
    document_id: string;
    version: number;
    storage_path: string | null;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    content_hash: string | null;
    edited_by: string;
    change_description: string | null;
    created_at: string;
}

// Inputs

export interface CreateIDocFolderInput {
    name: string;
    description?: string;
    parent_folder_id?: string | null;
    tags?: string[];
    color?: string;
    icon?: string;
}

export interface CreateIDocDocumentInput {
    title: string;
    description?: string;
    folder_id?: string | null;
    document_type_id?: string | null;
    tags?: string[];
    custom_metadata?: Record<string, unknown>;
    storage_path?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    content_hash?: string;
    status?: IDocStatus;
}

export interface UpdateIDocDocumentInput {
    title?: string;
    description?: string;
    folder_id?: string | null;
    document_type_id?: string | null;
    tags?: string[];
    custom_metadata?: Record<string, unknown>;
    status?: IDocStatus;
}

export interface IDocUploadResult {
    storage_path: string;
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    content_hash: string;
}

export interface IDocStats {
    total: number;
    draft: number;
    published: number;
    archived: number;
    trashed: number;
}

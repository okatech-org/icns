// Store Zustand local pour iCorrespondance — utilisé en mode démo quand
// le backend Convex/Supabase n'est pas joignable.
//
// Politique mémoire alignée sur les autres stores iCNS :
//   - aucune persistance localStorage/sessionStorage
//   - reset au logout
//   - seed initial (3 correspondances de démo) à la première lecture

import { create } from "zustand";
import type {
  ICorrFolder,
  ICorrDocument,
  ICorrWorkflowStep,
  ICorrStatus,
  ICorrStepType,
  CreateICorrFolderInput,
} from "@/types/icorrespondance";

export interface AttachICorrDocumentInput {
  folder_id: string;
  name: string;
  storage_path?: string | null;
  file_url?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  content_hash?: string | null;
}

const SYSTEM_ACTOR = "demo-system";

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextReference(seq: number): string {
  const year = new Date().getFullYear();
  return `CORR-${year}-${String(seq).padStart(4, "0")}`;
}

interface ICorrespondanceState {
  folders: ICorrFolder[];
  documents: ICorrDocument[];
  workflow: ICorrWorkflowStep[];
  refSequence: number;
  seeded: boolean;

  seed: () => void;
  reset: () => void;

  // Mutations
  createFolder: (input: CreateICorrFolderInput, actor: { id: string; name: string }) => ICorrFolder;
  attachDocument: (input: AttachICorrDocumentInput) => ICorrDocument;
  submitForApproval: (folderId: string, actor: { id: string; name: string }, comment?: string) => void;
  approve: (folderId: string, actor: { id: string; name: string }, comment?: string) => void;
  reject: (folderId: string, actor: { id: string; name: string }, reason: string) => void;
  deliver: (folderId: string, method: "PRINT" | "EMAIL", actor: { id: string; name: string }) => void;
}

function makeStep(
  folderId: string,
  stepType: ICorrStepType,
  actor: { id: string; name: string } | null,
  comment?: string,
): ICorrWorkflowStep {
  return {
    id: genId("step"),
    folder_id: folderId,
    step_type: stepType,
    actor_id: actor?.id ?? null,
    actor_name: actor?.name ?? null,
    actor_role: null,
    target_id: null,
    target_name: null,
    comment: comment ?? null,
    is_read: false,
    read_at: null,
    created_at: nowIso(),
  };
}

function seedFolders(): {
  folders: ICorrFolder[];
  documents: ICorrDocument[];
  workflow: ICorrWorkflowStep[];
  nextRef: number;
} {
  const folders: ICorrFolder[] = [];
  const workflow: ICorrWorkflowStep[] = [];

  const make = (
    refSeq: number,
    name: string,
    status: ICorrStatus,
    overrides: Partial<ICorrFolder> = {},
  ): ICorrFolder => {
    const id = genId("folder");
    return {
      id,
      user_id: SYSTEM_ACTOR,
      organization_id: null,
      name,
      reference_number: nextReference(refSeq),
      recipient_name: null,
      recipient_organization: null,
      recipient_email: null,
      recipient_user_id: null,
      comment: null,
      correspondence_type: "lettre",
      status,
      is_urgent: false,
      is_internal: false,
      is_read: true,
      current_holder_id: null,
      requires_approval: true,
      approved_by_id: null,
      approved_at: null,
      rejection_reason: null,
      delivery_method: null,
      delivered_at: null,
      sent_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      ...overrides,
    };
  };

  const f1 = make(1, "Note de service — Veille frontière nord", "APPROVED", {
    recipient_name: "Cabinet du SG",
    recipient_organization: "CNS — Secrétariat Général",
    correspondence_type: "note",
    is_urgent: true,
    approved_by_id: "CNS-SG-001",
    approved_at: nowIso(),
  });
  const f2 = make(2, "Demande d'éclaircissement — Op. Lumière", "PENDING_APPROVAL", {
    recipient_name: "Col. Pierre OBAME",
    recipient_organization: "DGR — Renseignement extérieur",
    correspondence_type: "lettre",
  });
  const f3 = make(3, "Convocation réunion sécurité du 25/05", "DRAFT", {
    recipient_name: "Lt-Col KOUMBA Jean",
    recipient_organization: "DGSS",
    correspondence_type: "convocation",
    requires_approval: false,
  });

  folders.push(f1, f2, f3);
  workflow.push(
    makeStep(f1.id, "CREATED", { id: SYSTEM_ACTOR, name: "Démo" }),
    makeStep(f1.id, "APPROVED", { id: "CNS-SG-001", name: "Gén. Charles ESSONO" }),
    makeStep(f2.id, "CREATED", { id: SYSTEM_ACTOR, name: "Démo" }),
    makeStep(f2.id, "SENT_FOR_APPROVAL", { id: SYSTEM_ACTOR, name: "Démo" }),
    makeStep(f3.id, "CREATED", { id: SYSTEM_ACTOR, name: "Démo" }),
  );

  return { folders, documents: [], workflow, nextRef: 4 };
}

export const useICorrespondanceStore = create<ICorrespondanceState>((set, get) => ({
  folders: [],
  documents: [],
  workflow: [],
  refSequence: 1,
  seeded: false,

  seed: () => {
    if (get().seeded) return;
    const { folders, documents, workflow, nextRef } = seedFolders();
    set({ folders, documents, workflow, refSequence: nextRef, seeded: true });
  },

  reset: () => {
    set({ folders: [], documents: [], workflow: [], refSequence: 1, seeded: false });
  },

  createFolder: (input, actor) => {
    const id = genId("folder");
    const seq = get().refSequence;
    const folder: ICorrFolder = {
      id,
      user_id: actor.id,
      organization_id: null,
      name: input.name,
      reference_number: nextReference(seq),
      recipient_name: input.recipient_name ?? null,
      recipient_organization: input.recipient_organization ?? null,
      recipient_email: input.recipient_email ?? null,
      recipient_user_id: null,
      comment: input.comment ?? null,
      correspondence_type: input.correspondence_type ?? "lettre",
      status: "DRAFT",
      is_urgent: input.is_urgent ?? false,
      is_internal: false,
      is_read: true,
      current_holder_id: actor.id,
      requires_approval: input.requires_approval ?? true,
      approved_by_id: null,
      approved_at: null,
      rejection_reason: null,
      delivery_method: null,
      delivered_at: null,
      sent_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    set((s) => ({
      folders: [folder, ...s.folders],
      workflow: [...s.workflow, makeStep(id, "CREATED", actor)],
      refSequence: seq + 1,
    }));
    return folder;
  },

  attachDocument: (input) => {
    const doc: ICorrDocument = {
      id: genId("doc"),
      folder_id: input.folder_id,
      name: input.name,
      storage_path: input.storage_path ?? null,
      file_url: input.file_url ?? null,
      file_type: input.mime_type?.split("/")[1] ?? null,
      file_size: input.file_size ?? null,
      mime_type: input.mime_type ?? null,
      content_hash: input.content_hash ?? null,
      is_generated: false,
      generator_type: null,
      created_at: nowIso(),
    };
    set((s) => ({ documents: [...s.documents, doc] }));
    return doc;
  },

  submitForApproval: (folderId, actor, comment) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId
          ? { ...f, status: "PENDING_APPROVAL", updated_at: nowIso() }
          : f,
      ),
      workflow: [...s.workflow, makeStep(folderId, "SENT_FOR_APPROVAL", actor, comment)],
    }));
  },

  approve: (folderId, actor, comment) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId
          ? {
              ...f,
              status: "APPROVED",
              approved_by_id: actor.id,
              approved_at: nowIso(),
              updated_at: nowIso(),
            }
          : f,
      ),
      workflow: [...s.workflow, makeStep(folderId, "APPROVED", actor, comment)],
    }));
  },

  reject: (folderId, actor, reason) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId
          ? {
              ...f,
              status: "REJECTED",
              rejection_reason: reason,
              updated_at: nowIso(),
            }
          : f,
      ),
      workflow: [...s.workflow, makeStep(folderId, "REJECTED", actor, reason)],
    }));
  },

  deliver: (folderId, method, actor) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === folderId
          ? {
              ...f,
              status: method === "EMAIL" ? "SENT" : "DELIVERED",
              delivery_method: method,
              delivered_at: nowIso(),
              sent_at: method === "EMAIL" ? nowIso() : f.sent_at,
              updated_at: nowIso(),
            }
          : f,
      ),
      workflow: [
        ...s.workflow,
        makeStep(
          folderId,
          method === "EMAIL" ? "DELIVERED_EMAIL" : "DELIVERED_PRINT",
          actor,
        ),
      ],
    }));
  },
}));

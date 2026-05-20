// Hooks React Query pour iCorrespondance.
//
// Mode démo (Convex placeholder) : bypass automatique des services
// Supabase/Convex → lecture/écriture dans le store Zustand local
// `useICorrespondanceStore`. Cela permet d'envoyer une correspondance,
// la voir apparaître dans la liste, suivre son workflow… sans backend.

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foldersService, documentsService, workflowService } from "@/services/icorrespondance";
import type {
    CreateICorrFolderInput,
    ICorrDocument,
    ICorrFolder,
    ICorrStats,
    ICorrWorkflowStep,
} from "@/types/icorrespondance";
import { useICorrespondanceStore, type AttachICorrDocumentInput } from "@/stores/iCorrespondanceStore";
import { useCurrentPersona } from "@/auth/useCurrentPersona";
import { isDemoMode } from "@/lib/demoMode";

const KEYS = {
    folders: (filters?: unknown) => ["icorr", "folders", filters ?? "all"] as const,
    folder: (id: string) => ["icorr", "folder", id] as const,
    inbox: () => ["icorr", "inbox"] as const,
    workflow: (folderId: string) => ["icorr", "workflow", folderId] as const,
    documents: (folderId: string) => ["icorr", "documents", folderId] as const,
    stats: () => ["icorr", "stats"] as const,
};

// ──────────────────────────────────────────────────────────────────────
// Helpers mode démo
// ──────────────────────────────────────────────────────────────────────

const DEMO = isDemoMode();

function useEnsureSeed() {
    const seed = useICorrespondanceStore((s) => s.seed);
    useMemo(() => {
        if (DEMO) seed();
    }, [seed]);
}

function actorFromPersona(matricule: string | null, name: string | null) {
    return {
        id: matricule ?? "demo-anonymous",
        name: name ?? "Démo",
    };
}

// ──────────────────────────────────────────────────────────────────────
// ===== Folders =====
// ──────────────────────────────────────────────────────────────────────

export const useICorrFolders = (filters?: Parameters<typeof foldersService.list>[0]) => {
    useEnsureSeed();
    const folders = useICorrespondanceStore((s) => s.folders);
    return useQuery({
        queryKey: KEYS.folders(filters),
        queryFn: async (): Promise<ICorrFolder[]> => {
            if (DEMO) return folders;
            return foldersService.list(filters);
        },
        // En mode démo, on relit le store via useMemo : pas de staleTime.
        staleTime: DEMO ? 0 : 1 * 60 * 1000,
        initialData: DEMO ? folders : undefined,
    });
};

export const useICorrFolder = (id: string | null) => {
    const folders = useICorrespondanceStore((s) => s.folders);
    return useQuery({
        queryKey: KEYS.folder(id ?? ""),
        queryFn: async (): Promise<ICorrFolder | null> => {
            if (DEMO) return folders.find((f) => f.id === id) ?? null;
            return foldersService.get(id!);
        },
        enabled: !!id,
        staleTime: DEMO ? 0 : 30 * 1000,
        initialData: DEMO ? folders.find((f) => f.id === id) ?? null : undefined,
    });
};

export const useICorrInbox = () => {
    const folders = useICorrespondanceStore((s) => s.folders);
    return useQuery({
        queryKey: KEYS.inbox(),
        queryFn: async (): Promise<ICorrFolder[]> => {
            if (DEMO) return folders.filter((f) => !f.is_read);
            return foldersService.listInbox();
        },
        staleTime: DEMO ? 0 : 30 * 1000,
    });
};

export const useCreateICorrFolder = () => {
    const qc = useQueryClient();
    const persona = useCurrentPersona();
    const createInStore = useICorrespondanceStore((s) => s.createFolder);
    return useMutation({
        mutationFn: async (input: CreateICorrFolderInput): Promise<ICorrFolder> => {
            if (DEMO) {
                return createInStore(input, actorFromPersona(persona?.matricule ?? null, persona?.prenomNom ?? null));
            }
            return foldersService.create(input);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useUpdateICorrFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: Partial<CreateICorrFolderInput> }) => {
            if (DEMO) {
                // Pas critique pour la démo : on ne supporte pas l'édition profonde.
                throw new Error("Édition non supportée en mode démo");
            }
            return foldersService.update(id, patch);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useSubmitForApproval = () => {
    const qc = useQueryClient();
    const persona = useCurrentPersona();
    const submit = useICorrespondanceStore((s) => s.submitForApproval);
    return useMutation({
        mutationFn: async ({ id, approverId, comment }: { id: string; approverId: string; comment?: string }) => {
            if (DEMO) {
                submit(id, actorFromPersona(persona?.matricule ?? null, persona?.prenomNom ?? null), comment);
                return { id, approverId };
            }
            return foldersService.submitForApproval(id, approverId, comment);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useApproveICorr = () => {
    const qc = useQueryClient();
    const persona = useCurrentPersona();
    const approve = useICorrespondanceStore((s) => s.approve);
    return useMutation({
        mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
            if (DEMO) {
                approve(id, actorFromPersona(persona?.matricule ?? null, persona?.prenomNom ?? null), comment);
                return { id };
            }
            return foldersService.approve(id, comment);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useRejectICorr = () => {
    const qc = useQueryClient();
    const persona = useCurrentPersona();
    const reject = useICorrespondanceStore((s) => s.reject);
    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            if (DEMO) {
                reject(id, actorFromPersona(persona?.matricule ?? null, persona?.prenomNom ?? null), reason);
                return { id };
            }
            return foldersService.reject(id, reason);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useDeliverICorr = () => {
    const qc = useQueryClient();
    const persona = useCurrentPersona();
    const deliver = useICorrespondanceStore((s) => s.deliver);
    return useMutation({
        mutationFn: async ({ id, method }: { id: string; method: "PRINT" | "EMAIL" }) => {
            if (DEMO) {
                deliver(id, method, actorFromPersona(persona?.matricule ?? null, persona?.prenomNom ?? null));
                return { id };
            }
            return foldersService.markDelivered(id, method);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useICorrStats = () => {
    const folders = useICorrespondanceStore((s) => s.folders);
    return useQuery({
        queryKey: KEYS.stats(),
        queryFn: async (): Promise<ICorrStats> => {
            if (DEMO) {
                return {
                    total: folders.length,
                    drafts: folders.filter((f) => f.status === "DRAFT").length,
                    pending_approval: folders.filter((f) => f.status === "PENDING_APPROVAL").length,
                    approved: folders.filter((f) => f.status === "APPROVED").length,
                    sent: folders.filter((f) => f.status === "DELIVERED" || f.status === "SENT").length,
                    urgent: folders.filter((f) => f.is_urgent).length,
                };
            }
            return foldersService.getStats();
        },
        staleTime: DEMO ? 0 : 1 * 60 * 1000,
    });
};

// ──────────────────────────────────────────────────────────────────────
// ===== Workflow =====
// ──────────────────────────────────────────────────────────────────────

export const useICorrWorkflow = (folderId: string | null) => {
    const steps = useICorrespondanceStore((s) => s.workflow);
    return useQuery({
        queryKey: KEYS.workflow(folderId ?? ""),
        queryFn: async (): Promise<ICorrWorkflowStep[]> => {
            if (DEMO) return steps.filter((s) => s.folder_id === folderId);
            return workflowService.list(folderId!);
        },
        enabled: !!folderId,
        staleTime: DEMO ? 0 : 30 * 1000,
    });
};

// ──────────────────────────────────────────────────────────────────────
// ===== Documents =====
// ──────────────────────────────────────────────────────────────────────

export const useICorrDocuments = (folderId: string | null) => {
    const documents = useICorrespondanceStore((s) => s.documents);
    return useQuery({
        queryKey: KEYS.documents(folderId ?? ""),
        queryFn: async (): Promise<ICorrDocument[]> => {
            if (DEMO) return documents.filter((d) => d.folder_id === folderId);
            return documentsService.list(folderId!);
        },
        enabled: !!folderId,
        staleTime: DEMO ? 0 : 30 * 1000,
    });
};

export const useAttachICorrDocument = () => {
    const qc = useQueryClient();
    const attach = useICorrespondanceStore((s) => s.attachDocument);
    return useMutation({
        mutationFn: async (input: AttachICorrDocumentInput) => {
            if (DEMO) return attach(input);
            // En production, le service Convex/Supabase exige des champs
            // non-nullables — on les force avec `as` pour faire le pont.
            return documentsService.attach(input as Parameters<typeof documentsService.attach>[0]);
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: KEYS.documents(variables.folder_id) });
        },
    });
};

export const useDetachICorrDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            if (DEMO) {
                // Suppression côté store : on n'implémente pas pour la démo
                // car non bloquant pour le flow d'envoi.
                throw new Error("Suppression non supportée en mode démo");
            }
            return documentsService.detach(id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

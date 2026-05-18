// Hooks React Query pour iCorrespondance

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foldersService, documentsService, workflowService } from "@/services/icorrespondance";
import type { CreateICorrFolderInput } from "@/types/icorrespondance";

const KEYS = {
    folders: (filters?: unknown) => ["icorr", "folders", filters ?? "all"] as const,
    folder: (id: string) => ["icorr", "folder", id] as const,
    inbox: () => ["icorr", "inbox"] as const,
    workflow: (folderId: string) => ["icorr", "workflow", folderId] as const,
    documents: (folderId: string) => ["icorr", "documents", folderId] as const,
    stats: () => ["icorr", "stats"] as const,
};

// ===== Folders =====

export const useICorrFolders = (filters?: Parameters<typeof foldersService.list>[0]) => {
    return useQuery({
        queryKey: KEYS.folders(filters),
        queryFn: () => foldersService.list(filters),
        staleTime: 1 * 60 * 1000,
    });
};

export const useICorrFolder = (id: string | null) => {
    return useQuery({
        queryKey: KEYS.folder(id ?? ""),
        queryFn: () => foldersService.get(id!),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
};

export const useICorrInbox = () => {
    return useQuery({
        queryKey: KEYS.inbox(),
        queryFn: () => foldersService.listInbox(),
        staleTime: 30 * 1000,
    });
};

export const useCreateICorrFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateICorrFolderInput) => foldersService.create(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useUpdateICorrFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: Partial<CreateICorrFolderInput> }) =>
            foldersService.update(id, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useSubmitForApproval = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, approverId, comment }: { id: string; approverId: string; comment?: string }) =>
            foldersService.submitForApproval(id, approverId, comment),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useApproveICorr = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
            foldersService.approve(id, comment),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useRejectICorr = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            foldersService.reject(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useDeliverICorr = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, method }: { id: string; method: "PRINT" | "EMAIL" }) =>
            foldersService.markDelivered(id, method),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

export const useICorrStats = () => {
    return useQuery({
        queryKey: KEYS.stats(),
        queryFn: () => foldersService.getStats(),
        staleTime: 1 * 60 * 1000,
    });
};

// ===== Workflow =====

export const useICorrWorkflow = (folderId: string | null) => {
    return useQuery({
        queryKey: KEYS.workflow(folderId ?? ""),
        queryFn: () => workflowService.list(folderId!),
        enabled: !!folderId,
        staleTime: 30 * 1000,
    });
};

// ===== Documents =====

export const useICorrDocuments = (folderId: string | null) => {
    return useQuery({
        queryKey: KEYS.documents(folderId ?? ""),
        queryFn: () => documentsService.list(folderId!),
        enabled: !!folderId,
        staleTime: 30 * 1000,
    });
};

export const useAttachICorrDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: Parameters<typeof documentsService.attach>[0]) =>
            documentsService.attach(input),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: KEYS.documents(variables.folder_id) });
        },
    });
};

export const useDetachICorrDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentsService.detach(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["icorr"] });
        },
    });
};

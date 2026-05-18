// Hooks React Query pour iDocument

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    documentsService,
    foldersService,
    documentTypesService,
    versionsService,
} from "@/services/idocument";
import type {
    CreateIDocDocumentInput,
    CreateIDocFolderInput,
    UpdateIDocDocumentInput,
} from "@/types/idocument";

const KEYS = {
    documents: (filters?: unknown) => ["idoc", "documents", filters ?? "all"] as const,
    document: (id: string) => ["idoc", "document", id] as const,
    folders: () => ["idoc", "folders"] as const,
    folder: (id: string) => ["idoc", "folder", id] as const,
    types: () => ["idoc", "types"] as const,
    versions: (documentId: string) => ["idoc", "versions", documentId] as const,
    stats: () => ["idoc", "stats"] as const,
};

// ===== Documents =====

export const useIDocDocuments = (filters?: Parameters<typeof documentsService.list>[0]) => {
    return useQuery({
        queryKey: KEYS.documents(filters),
        queryFn: () => documentsService.list(filters),
        staleTime: 2 * 60 * 1000,
    });
};

export const useIDocDocument = (id: string | null) => {
    return useQuery({
        queryKey: KEYS.document(id ?? ""),
        queryFn: () => documentsService.get(id!),
        enabled: !!id,
        staleTime: 1 * 60 * 1000,
    });
};

export const useCreateIDocDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateIDocDocumentInput) => documentsService.create(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

export const useUpdateIDocDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: UpdateIDocDocumentInput }) =>
            documentsService.update(id, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

export const useTrashIDocDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentsService.trash(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

export const useRestoreIDocDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentsService.restore(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

export const useDeleteIDocDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentsService.permanentDelete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

export const useIDocStats = () => {
    return useQuery({
        queryKey: KEYS.stats(),
        queryFn: () => documentsService.getStats(),
        staleTime: 2 * 60 * 1000,
    });
};

// ===== Folders =====

export const useIDocFolders = () => {
    return useQuery({
        queryKey: KEYS.folders(),
        queryFn: () => foldersService.list(),
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateIDocFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateIDocFolderInput) => foldersService.create(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.folders() });
        },
    });
};

export const useRenameIDocFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            foldersService.rename(id, name),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.folders() });
        },
    });
};

export const useDeleteIDocFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => foldersService.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

// ===== Types =====

export const useIDocDocumentTypes = () => {
    return useQuery({
        queryKey: KEYS.types(),
        queryFn: () => documentTypesService.list(),
        staleTime: 15 * 60 * 1000,
    });
};

// ===== Versions =====

export const useIDocVersions = (documentId: string | null) => {
    return useQuery({
        queryKey: KEYS.versions(documentId ?? ""),
        queryFn: () => versionsService.listByDocument(documentId!),
        enabled: !!documentId,
        staleTime: 2 * 60 * 1000,
    });
};

export const useCreateIDocVersion = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: Parameters<typeof versionsService.create>[0]) =>
            versionsService.create(input),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: KEYS.versions(variables.document_id) });
            qc.invalidateQueries({ queryKey: KEYS.document(variables.document_id) });
        },
    });
};

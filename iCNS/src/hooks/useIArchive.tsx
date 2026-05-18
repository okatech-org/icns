// Hooks React Query pour iArchive

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { archivesService, archiveCategoriesService, certificatesService } from "@/services/iarchive";
import type { CreateArchiveInput } from "@/types/iarchive";

const KEYS = {
    archives: (filters?: unknown) => ["iarch", "archives", filters ?? "all"] as const,
    archive: (id: string) => ["iarch", "archive", id] as const,
    categories: () => ["iarch", "categories"] as const,
    certificate: (archiveId: string) => ["iarch", "certificate", archiveId] as const,
    expiringSoon: () => ["iarch", "expiring-soon"] as const,
    stats: () => ["iarch", "stats"] as const,
};

// ===== Archives =====

export const useArchives = (filters?: Parameters<typeof archivesService.list>[0]) => {
    return useQuery({
        queryKey: KEYS.archives(filters),
        queryFn: () => archivesService.list(filters),
        staleTime: 2 * 60 * 1000,
    });
};

export const useArchive = (id: string | null) => {
    return useQuery({
        queryKey: KEYS.archive(id ?? ""),
        queryFn: () => archivesService.get(id!),
        enabled: !!id,
        staleTime: 1 * 60 * 1000,
    });
};

export const useCreateArchive = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateArchiveInput) => archivesService.create(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["iarch"] });
        },
    });
};

export const useArchiveFromDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ documentId, categoryId, title }: { documentId: string; categoryId: string; title?: string }) =>
            archivesService.createFromDocument(documentId, categoryId, title),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["iarch"] });
            qc.invalidateQueries({ queryKey: ["idoc"] });
        },
    });
};

export const useApplyLegalHold = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            archivesService.applyLegalHold(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["iarch"] });
        },
    });
};

export const useReleaseLegalHold = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => archivesService.releaseLegalHold(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["iarch"] });
        },
    });
};

export const useExpiringSoon = (days = 90) => {
    return useQuery({
        queryKey: KEYS.expiringSoon(),
        queryFn: () => archivesService.listExpiringSoon(days),
        staleTime: 5 * 60 * 1000,
    });
};

export const useArchiveStats = () => {
    return useQuery({
        queryKey: KEYS.stats(),
        queryFn: () => archivesService.getStats(),
        staleTime: 2 * 60 * 1000,
    });
};

// ===== Categories =====

export const useArchiveCategories = () => {
    return useQuery({
        queryKey: KEYS.categories(),
        queryFn: () => archiveCategoriesService.list(),
        staleTime: 15 * 60 * 1000,
    });
};

// ===== Certificates =====

export const useArchiveCertificate = (archiveId: string | null) => {
    return useQuery({
        queryKey: KEYS.certificate(archiveId ?? ""),
        queryFn: () => certificatesService.getByArchive(archiveId!),
        enabled: !!archiveId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGenerateCertificate = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ archiveId, sha256Hash }: { archiveId: string; sha256Hash: string | null }) =>
            certificatesService.generate(archiveId, sha256Hash),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: KEYS.certificate(variables.archiveId) });
        },
    });
};

export const useIssueDestruction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: Parameters<typeof certificatesService.issueDestruction>[0]) =>
            certificatesService.issueDestruction(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["iarch"] });
        },
    });
};

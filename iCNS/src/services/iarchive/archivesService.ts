// Service principal iArchive

import { supabase } from "@/integrations/supabase/client";
import type {
    IArchArchive,
    IArchArchiveWithRelations,
    CreateArchiveInput,
    IArchStats,
} from "@/types/iarchive";

const TABLE = "iarch_archives";

export const archivesService = {
    async list(filters?: {
        status?: string;
        categorySlug?: string;
        isVault?: boolean;
        search?: string;
    }): Promise<IArchArchiveWithRelations[]> {
        let query = supabase
            .from(TABLE)
            .select("*, category:category_id(*)")
            .order("archived_at", { ascending: false });

        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.categorySlug) query = query.eq("category_slug", filters.categorySlug);
        if (filters?.isVault !== undefined) query = query.eq("is_vault", filters.isVault);
        if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as IArchArchiveWithRelations[];
    },

    async get(id: string): Promise<IArchArchiveWithRelations | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*, category:category_id(*)")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IArchArchiveWithRelations | null;
    },

    async create(input: CreateArchiveInput): Promise<IArchArchive> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Non authentifie");

        const payload = {
            ...input,
            uploaded_by: userData.user.id,
            archived_by: userData.user.id,
            archived_at: new Date().toISOString(),
            source_type: input.source_type ?? "manual_upload",
        };

        const { data, error } = await supabase
            .from(TABLE)
            .insert(payload as never)
            .select("*, category:category_id(*)")
            .single();
        if (error) throw error;
        return data as unknown as IArchArchive;
    },

    async createFromDocument(
        documentId: string,
        categoryId: string,
        title?: string
    ): Promise<IArchArchive> {
        // Recupere le document source
        const { data: doc, error: docError } = await supabase
            .from("idoc_documents")
            .select("*")
            .eq("id", documentId)
            .maybeSingle();
        if (docError) throw docError;
        if (!doc) throw new Error("Document introuvable");
        const document = doc as unknown as {
            title: string;
            description: string | null;
            storage_path: string | null;
            file_url: string | null;
            file_name: string | null;
            file_size: number | null;
            mime_type: string | null;
            content_hash: string | null;
            folder_id: string | null;
            created_at: string;
        };

        // Cree l archive
        const archive = await this.create({
            title: title ?? document.title,
            description: document.description ?? undefined,
            category_id: categoryId,
            source_document_id: documentId,
            source_folder_id: document.folder_id,
            source_type: "document_archive",
            storage_path: document.storage_path ?? undefined,
            file_url: document.file_url ?? undefined,
            file_name: document.file_name ?? undefined,
            file_size: document.file_size ?? undefined,
            mime_type: document.mime_type ?? undefined,
            sha256_hash: document.content_hash ?? undefined,
            original_creation_date: document.created_at,
        });

        // Met a jour le document source
        const { data: userData } = await supabase.auth.getUser();
        await supabase
            .from("idoc_documents")
            .update({
                status: "archived",
                archive_id: archive.id,
                archived_at: new Date().toISOString(),
                archived_by: userData?.user?.id ?? null,
            } as never)
            .eq("id", documentId);

        return archive;
    },

    async applyLegalHold(id: string, reason: string): Promise<IArchArchive> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                legal_hold_applied_at: new Date().toISOString(),
                legal_hold_reason: reason,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IArchArchive;
    },

    async releaseLegalHold(id: string): Promise<IArchArchive> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                legal_hold_applied_at: null,
                legal_hold_reason: null,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IArchArchive;
    },

    async transitionStatus(id: string, status: string): Promise<IArchArchive> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({ status } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IArchArchive;
    },

    async listExpiringSoon(days = 90): Promise<IArchArchiveWithRelations[]> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*, category:category_id(*)")
            .lte("retention_expires_at", cutoff.toISOString())
            .neq("status", "destroyed")
            .order("retention_expires_at");
        if (error) throw error;
        return (data || []) as unknown as IArchArchiveWithRelations[];
    },

    async getStats(): Promise<IArchStats> {
        const [{ data: all }, { data: soon }] = await Promise.all([
            supabase.from(TABLE).select("status, is_vault, retention_expires_at"),
            supabase.from(TABLE)
                .select("id")
                .lte("retention_expires_at", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString())
                .neq("status", "destroyed"),
        ]);
        const archives = (all || []) as { status: string; is_vault: boolean }[];
        return {
            total: archives.length,
            active: archives.filter((a) => a.status === "active").length,
            semi_active: archives.filter((a) => a.status === "semi_active").length,
            archived: archives.filter((a) => a.status === "archived").length,
            expired: archives.filter((a) => a.status === "expired").length,
            destroyed: archives.filter((a) => a.status === "destroyed").length,
            expiring_soon: (soon || []).length,
            vault: archives.filter((a) => a.is_vault).length,
        };
    },
};

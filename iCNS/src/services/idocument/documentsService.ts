// CRUD des documents iDocument

import { supabase } from "@/integrations/supabase/client";
import type {
    IDocDocument,
    IDocDocumentWithRelations,
    CreateIDocDocumentInput,
    UpdateIDocDocumentInput,
    IDocStats,
} from "@/types/idocument";

const TABLE = "idoc_documents";

export const documentsService = {
    async list(filters?: {
        folderId?: string | null;
        status?: string;
        documentTypeId?: string;
        search?: string;
    }): Promise<IDocDocumentWithRelations[]> {
        let query = supabase
            .from(TABLE)
            .select("*, folder:folder_id(*), document_type:document_type_id(*)")
            .order("updated_at", { ascending: false });

        if (filters?.folderId !== undefined) {
            if (filters.folderId === null) {
                query = query.is("folder_id", null);
            } else {
                query = query.eq("folder_id", filters.folderId);
            }
        }
        if (filters?.status) {
            query = query.eq("status", filters.status);
        } else {
            // Par defaut, on cache la corbeille
            query = query.neq("status", "trashed");
        }
        if (filters?.documentTypeId) {
            query = query.eq("document_type_id", filters.documentTypeId);
        }
        if (filters?.search) {
            query = query.ilike("title", `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as IDocDocumentWithRelations[];
    },

    async get(id: string): Promise<IDocDocumentWithRelations | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*, folder:folder_id(*), document_type:document_type_id(*)")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IDocDocumentWithRelations | null;
    },

    async create(input: CreateIDocDocumentInput): Promise<IDocDocument> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Non authentifie");

        const payload = {
            ...input,
            created_by: userData.user.id,
            last_edited_by: userData.user.id,
            status: input.status ?? "draft",
        };

        const { data, error } = await supabase
            .from(TABLE)
            .insert(payload as never)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocDocument;
    },

    async update(id: string, patch: UpdateIDocDocumentInput): Promise<IDocDocument> {
        const { data: userData } = await supabase.auth.getUser();
        const payload = {
            ...patch,
            last_edited_by: userData?.user?.id ?? null,
        };
        const { data, error } = await supabase
            .from(TABLE)
            .update(payload as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocDocument;
    },

    async trash(id: string): Promise<IDocDocument> {
        const { data: doc } = await supabase.from(TABLE).select("status").eq("id", id).maybeSingle();
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: "trashed",
                trashed_at: new Date().toISOString(),
                trashed_by: userData?.user?.id ?? null,
                previous_status: (doc as { status?: string } | null)?.status ?? "draft",
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocDocument;
    },

    async restore(id: string): Promise<IDocDocument> {
        const { data: doc } = await supabase.from(TABLE).select("previous_status").eq("id", id).maybeSingle();
        const previous = (doc as { previous_status?: string } | null)?.previous_status || "draft";
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: previous,
                trashed_at: null,
                trashed_by: null,
                previous_status: null,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IDocDocument;
    },

    async permanentDelete(id: string): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq("id", id);
        if (error) throw error;
    },

    async getStats(): Promise<IDocStats> {
        const { data, error } = await supabase.from(TABLE).select("status");
        if (error) throw error;
        const docs = (data || []) as { status: string }[];
        return {
            total: docs.filter((d) => d.status !== "trashed").length,
            draft: docs.filter((d) => d.status === "draft").length,
            published: docs.filter((d) => d.status === "published").length,
            archived: docs.filter((d) => d.status === "archived").length,
            trashed: docs.filter((d) => d.status === "trashed").length,
        };
    },
};

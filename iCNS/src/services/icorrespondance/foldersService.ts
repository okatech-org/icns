// CRUD des dossiers iCorrespondance + workflow

import { supabase } from "@/integrations/supabase/client";
import type {
    ICorrFolder,
    ICorrFolderWithDocs,
    CreateICorrFolderInput,
    ICorrStats,
} from "@/types/icorrespondance";
import { workflowService } from "./workflowService";

const TABLE = "icorr_folders";

export const foldersService = {
    async list(filters?: { status?: string; isUrgent?: boolean }): Promise<ICorrFolder[]> {
        let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.isUrgent) query = query.eq("is_urgent", true);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as ICorrFolder[];
    },

    async get(id: string): Promise<ICorrFolderWithDocs | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*, documents:icorr_documents(*)")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as ICorrFolderWithDocs | null;
    },

    async listInbox(): Promise<ICorrFolder[]> {
        // Dossiers ou je suis destinataire ou porteur courant et qui necessitent une action
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return [];

        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .or(`recipient_user_id.eq.${userId},current_holder_id.eq.${userId}`)
            .neq("status", "ARCHIVED")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as ICorrFolder[];
    },

    async create(input: CreateICorrFolderInput): Promise<ICorrFolder> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Non authentifie");

        // Genere la reference via la fonction PostgreSQL
        const { data: refData, error: refError } = await supabase.rpc("generate_icorr_reference", {
            prefix: "EXEC",
        });
        if (refError) throw new Error(`Echec generation reference : ${refError.message}`);

        const payload = {
            ...input,
            user_id: userData.user.id,
            current_holder_id: userData.user.id,
            reference_number: refData as string,
            status: "DRAFT" as const,
            requires_approval: input.requires_approval ?? true,
        };

        const { data, error } = await supabase
            .from(TABLE)
            .insert(payload as never)
            .select()
            .single();
        if (error) throw error;

        const folder = data as unknown as ICorrFolder;
        await workflowService.log(folder.id, "CREATED", null, "Dossier cree");
        return folder;
    },

    async update(id: string, patch: Partial<CreateICorrFolderInput>): Promise<ICorrFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update(patch as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as ICorrFolder;
    },

    async submitForApproval(id: string, approverId: string, comment?: string): Promise<ICorrFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: "PENDING_APPROVAL",
                current_holder_id: approverId,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        await workflowService.log(id, "SENT_FOR_APPROVAL", approverId, comment ?? null);
        return data as unknown as ICorrFolder;
    },

    async approve(id: string, comment?: string): Promise<ICorrFolder> {
        const { data: userData } = await supabase.auth.getUser();
        // Recupere l auteur original pour lui retourner le dossier
        const { data: existing } = await supabase
            .from(TABLE)
            .select("user_id")
            .eq("id", id)
            .maybeSingle();
        const originalAuthor = (existing as { user_id?: string } | null)?.user_id ?? null;

        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: "APPROVED",
                approved_by_id: userData?.user?.id ?? null,
                approved_at: new Date().toISOString(),
                current_holder_id: originalAuthor,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        await workflowService.log(id, "APPROVED", originalAuthor, comment ?? null);
        return data as unknown as ICorrFolder;
    },

    async reject(id: string, reason: string): Promise<ICorrFolder> {
        const { data: existing } = await supabase
            .from(TABLE)
            .select("user_id")
            .eq("id", id)
            .maybeSingle();
        const originalAuthor = (existing as { user_id?: string } | null)?.user_id ?? null;

        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: "REJECTED",
                rejection_reason: reason,
                current_holder_id: originalAuthor,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        await workflowService.log(id, "REJECTED", originalAuthor, reason);
        return data as unknown as ICorrFolder;
    },

    async markReadyForDelivery(id: string): Promise<ICorrFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({ status: "READY_FOR_DELIVERY" } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        await workflowService.log(id, "READY_FOR_DELIVERY", null, null);
        return data as unknown as ICorrFolder;
    },

    async markDelivered(id: string, method: "PRINT" | "EMAIL"): Promise<ICorrFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: "DELIVERED",
                delivery_method: method,
                delivered_at: new Date().toISOString(),
                sent_at: method === "EMAIL" ? new Date().toISOString() : null,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        await workflowService.log(
            id,
            method === "PRINT" ? "DELIVERED_PRINT" : "DELIVERED_EMAIL",
            null,
            null
        );
        return data as unknown as ICorrFolder;
    },

    async archive(id: string): Promise<ICorrFolder> {
        const { data, error } = await supabase
            .from(TABLE)
            .update({ status: "ARCHIVED" } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        await workflowService.log(id, "ARCHIVED", null, null);
        return data as unknown as ICorrFolder;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq("id", id);
        if (error) throw error;
    },

    async getStats(): Promise<ICorrStats> {
        const { data, error } = await supabase.from(TABLE).select("status, is_urgent");
        if (error) throw error;
        const folders = (data || []) as { status: string; is_urgent: boolean }[];
        return {
            total: folders.length,
            drafts: folders.filter((f) => f.status === "DRAFT").length,
            pending_approval: folders.filter((f) => f.status === "PENDING_APPROVAL").length,
            approved: folders.filter((f) => f.status === "APPROVED").length,
            sent: folders.filter((f) => f.status === "SENT" || f.status === "DELIVERED").length,
            urgent: folders.filter((f) => f.is_urgent && f.status !== "ARCHIVED").length,
        };
    },
};

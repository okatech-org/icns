// Versioning des documents iDocument

import { supabase } from "@/integrations/supabase/client";
import type { IDocDocumentVersion } from "@/types/idocument";

const TABLE = "idoc_document_versions";

export const versionsService = {
    async listByDocument(documentId: string): Promise<IDocDocumentVersion[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("document_id", documentId)
            .order("version", { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as IDocDocumentVersion[];
    },

    async create(input: {
        document_id: string;
        storage_path: string;
        file_url: string;
        file_name: string;
        file_size: number;
        mime_type: string;
        content_hash: string;
        change_description?: string;
    }): Promise<IDocDocumentVersion> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Non authentifie");

        // Determine prochaine version (MAX(version) + 1)
        const { data: last } = await supabase
            .from(TABLE)
            .select("version")
            .eq("document_id", input.document_id)
            .order("version", { ascending: false })
            .limit(1)
            .maybeSingle();
        const nextVersion = ((last as { version?: number } | null)?.version ?? 0) + 1;

        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                ...input,
                version: nextVersion,
                edited_by: userData.user.id,
            } as never)
            .select()
            .single();
        if (error) throw error;

        // Met a jour le current_version sur le document parent
        await supabase
            .from("idoc_documents")
            .update({ current_version: nextVersion } as never)
            .eq("id", input.document_id);

        return data as unknown as IDocDocumentVersion;
    },
};

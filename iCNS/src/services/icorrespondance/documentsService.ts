// Pieces jointes iCorrespondance

import { supabase } from "@/integrations/supabase/client";
import type { ICorrDocument } from "@/types/icorrespondance";

const TABLE = "icorr_documents";

export const documentsService = {
    async list(folderId: string): Promise<ICorrDocument[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("folder_id", folderId)
            .order("created_at");
        if (error) throw error;
        return (data || []) as unknown as ICorrDocument[];
    },

    async attach(input: {
        folder_id: string;
        name: string;
        storage_path: string;
        file_url: string;
        file_size: number;
        mime_type: string;
        content_hash: string;
        is_generated?: boolean;
    }): Promise<ICorrDocument> {
        const fileType = input.mime_type.split("/")[0] || "other";
        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                folder_id: input.folder_id,
                name: input.name,
                storage_path: input.storage_path,
                file_url: input.file_url,
                file_size: input.file_size,
                mime_type: input.mime_type,
                file_type: fileType,
                content_hash: input.content_hash,
                is_generated: input.is_generated ?? false,
            } as never)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as ICorrDocument;
    },

    async detach(id: string): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq("id", id);
        if (error) throw error;
    },
};

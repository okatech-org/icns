// Service des types de documents iDocument (LETTRE, RAPPORT, NOTE...)

import { supabase } from "@/integrations/supabase/client";
import type { IDocDocumentType } from "@/types/idocument";

const TABLE = "idoc_document_types";

export const documentTypesService = {
    async list(includeInactive = false): Promise<IDocDocumentType[]> {
        let query = supabase.from(TABLE).select("*").order("nom");
        if (!includeInactive) {
            query = query.eq("est_actif", true);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as IDocDocumentType[];
    },

    async get(id: string): Promise<IDocDocumentType | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IDocDocumentType | null;
    },

    async getByCode(code: string): Promise<IDocDocumentType | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("code", code)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IDocDocumentType | null;
    },
};

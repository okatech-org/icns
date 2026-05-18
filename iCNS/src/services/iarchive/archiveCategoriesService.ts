// Service des categories d archivage

import { supabase } from "@/integrations/supabase/client";
import type { IArchCategory } from "@/types/iarchive";

const TABLE = "iarch_categories";

export const archiveCategoriesService = {
    async list(includeInactive = false): Promise<IArchCategory[]> {
        let query = supabase.from(TABLE).select("*").order("sort_order");
        if (!includeInactive) {
            query = query.eq("is_active", true);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as IArchCategory[];
    },

    async get(id: string): Promise<IArchCategory | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IArchCategory | null;
    },

    async getBySlug(slug: string): Promise<IArchCategory | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("slug", slug)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IArchCategory | null;
    },
};

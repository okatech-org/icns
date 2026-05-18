import { supabase } from "@/integrations/supabase/client";
import type { OfficialDecree, LegalReview, AdministrativeArchive } from "@/types/secretariat-general";

export const secretariatService = {
    // --- Official Decrees ---
    async getOfficialDecrees() {
        const { data, error } = await supabase
            .from("official_decrees")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as OfficialDecree[];
    },

    async createOfficialDecree(decree: Omit<OfficialDecree, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("official_decrees")
            .insert(decree)
            .select()
            .single();

        if (error) throw error;
        return data as OfficialDecree;
    },

    async updateOfficialDecreeStatus(id: string, status: OfficialDecree["status"]) {
        const { data, error } = await supabase
            .from("official_decrees")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as OfficialDecree;
    },

    // --- Legal Reviews ---
    async getLegalReviews() {
        const { data, error } = await supabase
            .from("legal_reviews")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as LegalReview[];
    },

    async createLegalReview(review: Omit<LegalReview, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("legal_reviews")
            .insert(review)
            .select()
            .single();

        if (error) throw error;
        return data as LegalReview;
    },

    async updateLegalReviewStatus(id: string, status: LegalReview["status"]) {
        const { data, error } = await supabase
            .from("legal_reviews")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as LegalReview;
    },

    // --- Administrative Archives ---
    async getAdministrativeArchives() {
        const { data, error } = await supabase
            .from("administrative_archives")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as AdministrativeArchive[];
    },

    async createAdministrativeArchive(archive: Omit<AdministrativeArchive, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("administrative_archives")
            .insert(archive)
            .select()
            .single();

        if (error) throw error;
        return data as AdministrativeArchive;
    }
};

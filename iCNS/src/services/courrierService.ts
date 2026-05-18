import { supabase } from "@/integrations/supabase/client";
import { IncomingMail, MailStats } from "@/types/service-courriers-types";

export const courrierService = {
    // Fetch all incoming mails
    getIncomingMails: async (): Promise<IncomingMail[]> => {
        const { data, error } = await supabase
            .from("incoming_mails")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as IncomingMail[];
    },

    // Create a new incoming mail
    createIncomingMail: async (mail: Omit<IncomingMail, "id" | "created_at" | "updated_at">): Promise<IncomingMail> => {
        const { data, error } = await supabase
            .from("incoming_mails")
            .insert(mail)
            .select()
            .single();

        if (error) throw error;
        return data as IncomingMail;
    },

    // Update mail status
    updateMailStatus: async (id: string, status: string): Promise<IncomingMail> => {
        const { data, error } = await supabase
            .from("incoming_mails")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as IncomingMail;
    },

    // Get mail statistics (calculated client-side for now to match existing logic, but could be DB function)
    getMailStats: (mails: IncomingMail[]): MailStats => {
        const today = new Date().toDateString();
        return {
            totalToday: mails.filter(m => new Date(m.received_date).toDateString() === today).length,
            urgentPending: mails.filter(m => (m.urgency === 'haute' || m.urgency === 'urgente') && m.status !== 'archive').length,
            toProcess: mails.filter(m => m.status === 'recu' || m.status === 'en_traitement').length,
            processedToday: mails.filter(m => m.status === 'distribue' && new Date(m.updated_at).toDateString() === today).length
        };
    }
};


import { supabase } from "@/integrations/supabase/client";
import { VisitorLog, AccreditationRequest } from "@/types/reception";

export const receptionService = {
    // Visitors
    async getVisitors() {
        const { data, error } = await (supabase as any)
            .from("visitor_logs")
            .select("*")
            .order("check_in_time", { ascending: false });

        if (error) throw error;
        return data as VisitorLog[];
    },

    async checkInVisitor(visitor: Omit<VisitorLog, "id" | "created_at" | "check_out_time">) {
        const { data, error } = await (supabase as any)
            .from("visitor_logs")
            .insert(visitor)
            .select()
            .single();

        if (error) throw error;
        return data as VisitorLog;
    },

    async checkOutVisitor(id: string) {
        const { data, error } = await (supabase as any)
            .from("visitor_logs")
            .update({
                status: "checked_out",
                check_out_time: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as VisitorLog;
    },

    // Accreditations
    async getAccreditations() {
        const { data, error } = await (supabase as any)
            .from("accreditation_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as AccreditationRequest[];
    },

    async createAccreditation(request: Omit<AccreditationRequest, "id" | "created_at">) {
        const { data, error } = await (supabase as any)
            .from("accreditation_requests")
            .insert(request)
            .select()
            .single();

        if (error) throw error;
        return data as AccreditationRequest;
    },

    async updateAccreditationStatus(id: string, status: AccreditationRequest["status"]) {
        const { data, error } = await (supabase as any)
            .from("accreditation_requests")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as AccreditationRequest;
    }
};

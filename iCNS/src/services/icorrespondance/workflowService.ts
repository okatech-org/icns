// Audit trail du workflow iCorrespondance

import { supabase } from "@/integrations/supabase/client";
import type { ICorrWorkflowStep, ICorrStepType } from "@/types/icorrespondance";

const TABLE = "icorr_workflow_steps";

export const workflowService = {
    async list(folderId: string): Promise<ICorrWorkflowStep[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("folder_id", folderId)
            .order("created_at", { ascending: true });
        if (error) throw error;
        return (data || []) as unknown as ICorrWorkflowStep[];
    },

    async log(
        folderId: string,
        stepType: ICorrStepType,
        targetId: string | null,
        comment: string | null
    ): Promise<ICorrWorkflowStep> {
        const { data: userData } = await supabase.auth.getUser();

        // Recupere le nom de l acteur
        let actorName: string | null = null;
        if (userData?.user?.id) {
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("full_name")
                .eq("user_id", userData.user.id)
                .maybeSingle();
            actorName = (profile as { full_name?: string } | null)?.full_name ?? userData.user.email ?? null;
        }

        // Recupere le nom de la cible
        let targetName: string | null = null;
        if (targetId) {
            const { data: targetProfile } = await supabase
                .from("user_profiles")
                .select("full_name")
                .eq("user_id", targetId)
                .maybeSingle();
            targetName = (targetProfile as { full_name?: string } | null)?.full_name ?? null;
        }

        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                folder_id: folderId,
                step_type: stepType,
                actor_id: userData?.user?.id ?? null,
                actor_name: actorName,
                target_id: targetId,
                target_name: targetName,
                comment,
            } as never)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as ICorrWorkflowStep;
    },

    async markRead(stepId: string): Promise<void> {
        await supabase
            .from(TABLE)
            .update({ is_read: true, read_at: new Date().toISOString() } as never)
            .eq("id", stepId);
    },
};

// Service des certificats d archivage et de destruction

import { supabase } from "@/integrations/supabase/client";
import type { IArchCertificate, IArchDestructionCertificate } from "@/types/iarchive";

export const certificatesService = {
    async generate(archiveId: string, sha256Hash: string | null, validUntil?: string): Promise<IArchCertificate> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("Non authentifie");

        // Genere le numero CERT-YYYY-NNNNN via la fonction PostgreSQL
        const { data: numberData, error: rpcError } = await supabase.rpc("iarch_generate_cert_number", {
            prefix: "CERT",
        });
        if (rpcError) throw new Error(`Echec generation numero : ${rpcError.message}`);
        const certificateNumber = numberData as string;

        const { data, error } = await supabase
            .from("iarch_certificates")
            .insert({
                archive_id: archiveId,
                certificate_number: certificateNumber,
                sha256_hash: sha256Hash,
                issued_by: userData.user.id,
                valid_until: validUntil ?? null,
                status: "valid",
            } as never)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IArchCertificate;
    },

    async getByArchive(archiveId: string): Promise<IArchCertificate | null> {
        const { data, error } = await supabase
            .from("iarch_certificates")
            .select("*")
            .eq("archive_id", archiveId)
            .order("issued_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data as unknown as IArchCertificate | null;
    },

    async revoke(id: string, reason: string): Promise<IArchCertificate> {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("iarch_certificates")
            .update({
                status: "revoked",
                revoked_at: new Date().toISOString(),
                revoked_by: userData?.user?.id ?? null,
                revoked_reason: reason,
            } as never)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as IArchCertificate;
    },

    async issueDestruction(input: {
        archiveId: string;
        reason: string;
        method?: "legal_expiry" | "manual_request" | "compliance";
    }): Promise<IArchDestructionCertificate> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) throw new Error("Non authentifie");

        // Recupere les infos de l archive
        const { data: arch } = await supabase
            .from("iarch_archives")
            .select("*, category:category_id(*)")
            .eq("id", input.archiveId)
            .maybeSingle();
        const archive = arch as unknown as {
            title: string;
            file_name: string | null;
            file_size: number | null;
            mime_type: string | null;
            sha256_hash: string | null;
            archived_at: string;
            retention_years: number | null;
            retention_expires_at: string | null;
            category_slug: string | null;
            organization_id: string | null;
            category?: { name: string; ohada_reference: string | null } | null;
        } | null;
        if (!archive) throw new Error("Archive introuvable");

        // Genere DEST-YYYY-NNNNN
        const { data: numberData, error: rpcError } = await supabase.rpc("iarch_generate_cert_number", {
            prefix: "DEST",
        });
        if (rpcError) throw new Error(rpcError.message);

        const { data, error } = await supabase
            .from("iarch_destruction_certificates")
            .insert({
                certificate_number: numberData as string,
                archive_id: input.archiveId,
                organization_id: archive.organization_id,
                document_title: archive.title,
                document_category: archive.category?.name ?? null,
                document_category_slug: archive.category_slug,
                original_file_name: archive.file_name,
                original_file_size: archive.file_size,
                original_mime_type: archive.mime_type,
                original_sha256_hash: archive.sha256_hash,
                original_archived_at: archive.archived_at,
                retention_years: archive.retention_years,
                retention_expires_at: archive.retention_expires_at,
                ohada_reference: archive.category?.ohada_reference ?? null,
                destroyed_by: userData.user.id,
                destruction_reason: input.reason,
                destruction_method: input.method ?? "manual_request",
                status: "issued",
            } as never)
            .select()
            .single();
        if (error) throw error;

        // Marque l archive comme detruite
        await supabase
            .from("iarch_archives")
            .update({ status: "destroyed" } as never)
            .eq("id", input.archiveId);

        return data as unknown as IArchDestructionCertificate;
    },
};

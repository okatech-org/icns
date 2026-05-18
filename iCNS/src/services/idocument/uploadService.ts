// Service d upload generique vers les buckets Supabase
// Utilisable par iDocument, iArchive, iCorrespondance

import { supabase } from "@/integrations/supabase/client";
import { hashService } from "./hashService";
import type { IDocUploadResult } from "@/types/idocument";

export type IDocBucket = "idoc-files" | "iarch-files" | "icorr-files";

interface UploadOptions {
    bucket: IDocBucket;
    file: File;
    onProgress?: (progress: number) => void;
}

export const uploadService = {
    /**
     * Calcule le hash, telecharge le fichier dans le bucket, retourne URL signee + metadonnees.
     * Convention de chemin : {user_id}/{annee}/{uuid}-{filename}
     */
    async upload({ bucket, file, onProgress }: UploadOptions): Promise<IDocUploadResult> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error("Utilisateur non authentifie");
        }
        const userId = userData.user.id;
        const year = new Date().getFullYear();

        // 1) Hash SHA-256 (cote client)
        onProgress?.(10);
        const contentHash = await hashService.computeSHA256(file);
        onProgress?.(30);

        // 2) Genere un nom de fichier unique
        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const storagePath = `${userId}/${year}/${crypto.randomUUID()}-${safeName}`;

        // 3) Upload
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type || "application/octet-stream",
            });

        if (uploadError) {
            throw new Error(`Echec de l upload : ${uploadError.message}`);
        }
        onProgress?.(80);

        // 4) URL signee 1 heure
        const { data: signed, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(storagePath, 3600);

        if (signError) {
            throw new Error(`Echec generation URL signee : ${signError.message}`);
        }
        onProgress?.(100);

        return {
            storage_path: storagePath,
            file_url: signed.signedUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
            content_hash: contentHash,
        };
    },

    /**
     * Regenere une URL signee fraiche (3600s) pour un chemin de bucket existant.
     */
    async getSignedUrl(bucket: IDocBucket, storagePath: string, expiresIn = 3600): Promise<string> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(storagePath, expiresIn);
        if (error) throw new Error(error.message);
        return data.signedUrl;
    },

    /**
     * Supprime un objet du bucket.
     */
    async remove(bucket: IDocBucket, storagePath: string): Promise<void> {
        const { error } = await supabase.storage.from(bucket).remove([storagePath]);
        if (error) throw new Error(error.message);
    },
};

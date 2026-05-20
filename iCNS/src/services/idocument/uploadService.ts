// Service d'upload générique vers les buckets Supabase Storage.
// Utilisable par iDocument, iArchive, iCorrespondance.
//
// Mode démo (Convex/Supabase indisponible) : bypass complet du réseau.
// On calcule quand même le SHA-256 réel côté client (Web Crypto), on génère
// une `blob:` URL pour permettre l'aperçu local, et on retourne un
// `storage_path` factice — l'utilisateur peut ainsi attacher un fichier
// à une correspondance ou un document en démo, et le retrouver dans la
// même session.

import { supabase } from "@/integrations/supabase/client";
import { hashService } from "./hashService";
import { isDemoMode } from "@/lib/demoMode";
import type { IDocUploadResult } from "@/types/idocument";

export type IDocBucket = "idoc-files" | "iarch-files" | "icorr-files";

interface UploadOptions {
    bucket: IDocBucket;
    file: File;
    onProgress?: (progress: number) => void;
}

async function demoUpload({ bucket, file, onProgress }: UploadOptions): Promise<IDocUploadResult> {
    onProgress?.(10);
    const contentHash = await hashService.computeSHA256(file);
    onProgress?.(60);
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const storagePath = `demo/${bucket}/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
    const blobUrl = URL.createObjectURL(file);
    onProgress?.(100);
    return {
        storage_path: storagePath,
        file_url: blobUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        content_hash: contentHash,
    };
}

export const uploadService = {
    /**
     * Calcule le hash, télécharge le fichier dans le bucket, retourne URL signée + métadonnées.
     * Convention de chemin : {user_id}/{annee}/{uuid}-{filename}
     */
    async upload(options: UploadOptions): Promise<IDocUploadResult> {
        if (isDemoMode()) return demoUpload(options);

        const { bucket, file, onProgress } = options;
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

        // 3) Upload (cast `any` car le shim Supabase ne reflète pas la
        //    signature complète — runtime correct en backend réel).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storageApi = supabase.storage.from(bucket) as any;
        const { error: uploadError } = await storageApi.upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
        });

        if (uploadError) {
            throw new Error(`Echec de l upload : ${uploadError.message}`);
        }
        onProgress?.(80);

        // 4) URL signee 1 heure
        const { data: signed, error: signError } = await storageApi.createSignedUrl(storagePath, 3600);

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
     * En mode démo : retourne tel quel (les `blob:` URLs sont déjà résolus).
     */
    async getSignedUrl(bucket: IDocBucket, storagePath: string, expiresIn = 3600): Promise<string> {
        if (isDemoMode()) return storagePath;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storageApi = supabase.storage.from(bucket) as any;
        const { data, error } = await storageApi.createSignedUrl(storagePath, expiresIn);
        if (error) throw new Error(error.message);
        return data.signedUrl;
    },

    /**
     * Supprime un objet du bucket. No-op en mode démo.
     */
    async remove(bucket: IDocBucket, storagePath: string): Promise<void> {
        if (isDemoMode()) return;
        const { error } = await supabase.storage.from(bucket).remove([storagePath]);
        if (error) throw new Error(error.message);
    },
};

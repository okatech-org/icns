// Service de hachage SHA-256 cote client (Web Crypto API)
// Utilise par iDocument, iArchive et iCorrespondance pour scellement d integrite
// Limite MVP : fichiers jusqu a 50 Mo (au-dela, basculer sur une Edge Function en streaming)

const MAX_BROWSER_HASH_SIZE = 52428800; // 50 MB

export const hashService = {
    /**
     * Calcule le hash SHA-256 hexadecimal d un File ou Blob.
     */
    async computeSHA256(file: Blob): Promise<string> {
        if (file.size > MAX_BROWSER_HASH_SIZE) {
            throw new Error(
                `Fichier trop volumineux pour le hash navigateur (max ${MAX_BROWSER_HASH_SIZE / 1024 / 1024} Mo). Utilisez une Edge Function.`
            );
        }
        const buffer = await file.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", buffer);
        return bufferToHex(digest);
    },

    /**
     * Verifie qu un fichier correspond bien a un hash attendu.
     */
    async verifyHash(file: Blob, expected: string): Promise<boolean> {
        const actual = await this.computeSHA256(file);
        return actual.toLowerCase() === expected.toLowerCase();
    },

    /**
     * Hash d une chaine UTF-8.
     */
    async hashText(text: string): Promise<string> {
        const buffer = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest("SHA-256", buffer);
        return bufferToHex(digest);
    },

    /**
     * Tronque un hash en affichage (8 + 8 caracteres separes par ...).
     */
    truncateHash(hash: string): string {
        if (!hash || hash.length < 16) return hash || "";
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    },
};

function bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
}

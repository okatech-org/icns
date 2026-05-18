// Client TypeScript de référence pour l'API présidentielle iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.3 (EF-03.6) — Prompt 5.2
//
// À fournir à l'équipe en charge de l'application présidentielle.
// Le client gère :
//   - obtention du token OAuth2 via mTLS
//   - renouvellement automatique avant expiration
//   - appels typés aux endpoints
//   - vérification de la signature de réponse (à compléter avec la clé
//     publique HSM en prod)

export interface SyntheseSummary {
  id: string;
  reference: string;
  classification: "DR" | "CD" | "SD" | "TSD";
  signeParSgAt: number;
  transmisePresidenceAt: number | null;
}

export interface SyntheseDetail extends SyntheseSummary {
  encryptedTitre: string;
  encryptedCorps: string;
  dossiersSources: Array<{ dossierId: string; extraitChiffre?: string }>;
}

export interface ClientOptions {
  baseUrl: string;
  /** Fonction qui retourne les en-têtes mTLS injectés par le LB du client.
   *  En prod, le LB du client présidentiel les inclut automatiquement —
   *  cette fonction n'est utile que pour le poste durci avec hand-off mTLS. */
  mtlsHeaders?: () => Record<string, string>;
  /** Optionnel : clé publique iCNS pour vérifier `X-iCNS-Signature`. */
  serverPublicKey?: CryptoKey;
}

export class ICNSPresidentielleClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private options: ClientOptions) {}

  // ────────────────────────────────────────────────────────────────────
  // Authentification
  // ────────────────────────────────────────────────────────────────────

  private async ensureToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt - 30_000) {
      return this.accessToken;
    }
    const r = await fetch(`${this.options.baseUrl}/api-presidentielle/oauth/token`, {
      method: "POST",
      headers: {
        ...(this.options.mtlsHeaders?.() ?? {}),
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) {
      throw new Error(`Token request failed: ${r.status} ${await r.text()}`);
    }
    const body = (await r.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = body.access_token;
    this.tokenExpiresAt = now + body.expires_in * 1000;
    return body.access_token;
  }

  // ────────────────────────────────────────────────────────────────────
  // Endpoints
  // ────────────────────────────────────────────────────────────────────

  async listSyntheses(): Promise<SyntheseSummary[]> {
    const r = await this.call("GET", "/api-presidentielle/syntheses");
    const data = (await r.json()) as { syntheses: SyntheseSummary[] };
    await this.verifySignature(r);
    return data.syntheses;
  }

  async getSynthese(id: string): Promise<SyntheseDetail | null> {
    const r = await this.call("GET", `/api-presidentielle/syntheses/${encodeURIComponent(id)}`);
    if (r.status === 404) return null;
    await this.verifySignature(r);
    return (await r.json()) as SyntheseDetail;
  }

  async acknowledgeSynthese(id: string): Promise<void> {
    const r = await this.call(
      "POST",
      `/api-presidentielle/syntheses/${encodeURIComponent(id)}/acknowledge`,
    );
    if (!r.ok) throw new Error(`acknowledge failed: ${r.status}`);
  }

  async sendInstruction(id: string, texte: string): Promise<void> {
    const r = await this.call(
      "POST",
      `/api-presidentielle/syntheses/${encodeURIComponent(id)}/instruction`,
      { texte },
    );
    if (!r.ok) throw new Error(`instruction failed: ${r.status}`);
  }

  // ────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────

  private async call(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const token = await this.ensureToken();
    return await fetch(`${this.options.baseUrl}${path}`, {
      method,
      headers: {
        ...(this.options.mtlsHeaders?.() ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async verifySignature(response: Response): Promise<void> {
    const sig = response.headers.get("X-iCNS-Signature");
    if (!sig) return; // peut être absent sur les endpoints non signés
    if (!this.options.serverPublicKey) return;
    // TODO Prompt 5.2 final : récupérer le body brut + vérifier avec
    // crypto.subtle.verify({name: 'RSASSA-PKCS1-v1_5', ...},
    //                      serverPublicKey, decode(sig), bodyBytes).
    // En dev (signature MOCK-RESPONSE-SIGN), on n'effectue pas la vérif.
  }
}

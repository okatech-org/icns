// Endpoints HTTP iCNS — API présidentielle (Prompt 5.2)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.3 (EF-03)
//
// Convex expose ces routes via `httpRouter`. Le mTLS et l'extraction du
// certificat client sont effectués en amont par le load balancer (NGINX
// ou équivalent) qui injecte les headers :
//   - X-Client-Cert-Serial
//   - X-Client-Cert-Subject
//   - X-Client-Cert-Issuer
// L'API vérifie ces headers + un Bearer token OAuth2 court (15 min)
// délivré par `/api-presidentielle/oauth/token`.

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function extractMtls(req: Request): { serial: string; subject: string; issuer: string } | null {
  const serial = req.headers.get("X-Client-Cert-Serial");
  const subject = req.headers.get("X-Client-Cert-Subject");
  const issuer = req.headers.get("X-Client-Cert-Issuer");
  if (!serial || !subject || !issuer) return null;
  return { serial, subject, issuer };
}

function extractBearer(req: Request): string | null {
  const h = req.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7);
}

function extractMatriculeFromSubject(subject: string): string | null {
  // Convention : CN=<matricule>,O=<org>...
  const m = subject.match(/CN=([^,]+)/);
  return m ? m[1] : null;
}

// ──────────────────────────────────────────────────────────────────────
// /api-presidentielle/oauth/token — émet un access token court
// ──────────────────────────────────────────────────────────────────────

http.route({
  path: "/api-presidentielle/oauth/token",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const mtls = extractMtls(req);
    if (!mtls) return jsonResponse({ error: "mTLS_required" }, 401);
    if (!mtls.issuer.startsWith("CN=PKI_SOUVERAINE")) {
      return jsonResponse({ error: "issuer_not_authorized" }, 401);
    }
    const matricule = extractMatriculeFromSubject(mtls.subject);
    if (!matricule) return jsonResponse({ error: "invalid_subject" }, 401);

    // Vérifier l'autorisation nominative (api_presidentielle_autorisations)
    const autorise = await ctx.runQuery(internal.api_presidentielle.handlers.isAuthorized, {
      matricule,
      certificatSerial: mtls.serial,
    });
    if (!autorise) {
      await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
        matricule,
        certificatSerial: mtls.serial,
        endpoint: "/oauth/token",
        statusCode: 403,
        adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
      });
      return jsonResponse({ error: "not_authorized" }, 403);
    }

    // Émettre un JWT de 15 minutes (réutilise notre `signJWT`)
    const token = await ctx.runMutation(internal.api_presidentielle.handlers.issueToken, {
      matricule,
      certificatSerial: mtls.serial,
    });
    await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
      matricule,
      certificatSerial: mtls.serial,
      endpoint: "/oauth/token",
      statusCode: 200,
      adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
    });
    return jsonResponse(
      { access_token: token.jwt, token_type: "Bearer", expires_in: 900 },
      200,
    );
  }),
});

// ──────────────────────────────────────────────────────────────────────
// GET /api-presidentielle/syntheses — liste des synthèses signées
// ──────────────────────────────────────────────────────────────────────

http.route({
  path: "/api-presidentielle/syntheses",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const auth = await authPresidentielle(ctx, req);
    if (!auth.ok) return auth.response;

    const list = await ctx.runQuery(internal.api_presidentielle.handlers.listSyntheses, {});
    await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
      matricule: auth.matricule,
      certificatSerial: auth.certificatSerial,
      endpoint: "/syntheses",
      statusCode: 200,
      adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
    });
    return jsonResponse({ syntheses: list }, 200, {
      "X-iCNS-Signature": auth.signature ?? "",
    });
  }),
});

http.route({
  path: "/api-presidentielle/syntheses",
  method: "POST",
  handler: httpAction(async (_ctx, _req) => {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }),
});

http.route({
  // Endpoint paramétré : /syntheses/{id}/acknowledge etc.
  // Convex http supporte les path params via pathPrefix + parsing.
  pathPrefix: "/api-presidentielle/syntheses/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const auth = await authPresidentielle(ctx, req);
    if (!auth.ok) return auth.response;
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // /api-presidentielle/syntheses/<id>
    const id = parts[parts.length - 1];

    const syn = await ctx.runQuery(internal.api_presidentielle.handlers.getSynthese, {
      id,
    });
    if (!syn) {
      await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
        matricule: auth.matricule,
        certificatSerial: auth.certificatSerial,
        endpoint: `/syntheses/${id}`,
        statusCode: 404,
        adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
      });
      return jsonResponse({ error: "not_found" }, 404);
    }
    await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
      matricule: auth.matricule,
      certificatSerial: auth.certificatSerial,
      endpoint: `/syntheses/${id}`,
      statusCode: 200,
      adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
      syntheseId: id,
    });
    return jsonResponse(syn, 200, { "X-iCNS-Signature": auth.signature ?? "" });
  }),
});

http.route({
  pathPrefix: "/api-presidentielle/syntheses/",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const auth = await authPresidentielle(ctx, req);
    if (!auth.ok) return auth.response;
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // /api-presidentielle/syntheses/<id>/<action>
    const action = parts[parts.length - 1];
    const id = parts[parts.length - 2];

    if (action === "acknowledge") {
      await ctx.runMutation(internal.api_presidentielle.handlers.acknowledgeSynthese, {
        syntheseId: id,
        matriculeAppelant: auth.matricule,
      });
      await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
        matricule: auth.matricule,
        certificatSerial: auth.certificatSerial,
        endpoint: `/syntheses/${id}/acknowledge`,
        statusCode: 200,
        adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
        syntheseId: id,
      });
      return jsonResponse({ ok: true }, 200);
    }
    if (action === "instruction") {
      const body = (await req.json().catch(() => ({}))) as { texte?: string };
      if (!body.texte) return jsonResponse({ error: "texte_required" }, 400);
      await ctx.runMutation(internal.api_presidentielle.handlers.instructionPresidentielle, {
        syntheseId: id,
        matriculeAppelant: auth.matricule,
        texte: body.texte,
      });
      await ctx.runMutation(internal.api_presidentielle.handlers.logCall, {
        matricule: auth.matricule,
        certificatSerial: auth.certificatSerial,
        endpoint: `/syntheses/${id}/instruction`,
        statusCode: 201,
        adresseIP: req.headers.get("X-Forwarded-For") ?? "?",
        syntheseId: id,
      });
      return jsonResponse({ ok: true }, 201);
    }
    return jsonResponse({ error: "unknown_action" }, 404);
  }),
});

// ──────────────────────────────────────────────────────────────────────
// Helper d'authentification de l'API présidentielle
// ──────────────────────────────────────────────────────────────────────

async function authPresidentielle(
  ctx: any,
  req: Request,
): Promise<
  | { ok: true; matricule: string; certificatSerial: string; signature?: string }
  | { ok: false; response: Response }
> {
  const mtls = extractMtls(req);
  if (!mtls) return { ok: false, response: jsonResponse({ error: "mTLS_required" }, 401) };
  const matricule = extractMatriculeFromSubject(mtls.subject);
  if (!matricule)
    return { ok: false, response: jsonResponse({ error: "invalid_subject" }, 401) };

  const bearer = extractBearer(req);
  if (!bearer)
    return { ok: false, response: jsonResponse({ error: "bearer_required" }, 401) };

  const verified = await ctx.runQuery(internal.api_presidentielle.handlers.verifyToken, {
    token: bearer,
    expectedMatricule: matricule,
  });
  if (!verified.ok) {
    return { ok: false, response: jsonResponse({ error: verified.reason }, 401) };
  }

  return {
    ok: true,
    matricule,
    certificatSerial: mtls.serial,
    signature: verified.responseSignature,
  };
}

export default http;

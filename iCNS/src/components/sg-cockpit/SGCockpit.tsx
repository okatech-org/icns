// Cockpit SG-CNS — Vue d'ensemble + actions (Prompt 4.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.2

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useICNSAuth } from "../../auth/useICNSAuth";

export function SGCockpit() {
  const jwt = useICNSAuth((s) => s.jwt);
  const role = useICNSAuth((s) => s.role);

  if (!jwt) return null;
  if (role !== "sg_cns") {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Cockpit réservé au Secrétaire Général du CNS.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* La classification TSD est deja affichee par le bandeau sticky en
          haut de l'iCNS Workspace, pas de duplication ici. */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Cockpit SG-CNS</h1>
        <p className="text-sm text-muted-foreground">
          Vue temps réel du renseignement national · Conseil National de Sécurité
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <StrategicDashboard jwt={jwt} />
        <FlashAlerts jwt={jwt} />
      </div>

      <SynthesesAValider jwt={jwt} />
      <ConvergencesNouvelles jwt={jwt} />
      <ActionsSG jwt={jwt} />
    </div>
  );
}

function StrategicDashboard({ jwt }: { jwt: string }) {
  const dossiers = useQuery(api.dossiers.queries.listDossiers, {
    jwt,
    statut: "transmis_cns",
    limit: 200,
  });
  const total = dossiers?.length ?? 0;
  const parClass = (dossiers ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.classification] = (acc[d.classification] ?? 0) + 1;
    return acc;
  }, {});
  const parUrgence = (dossiers ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.urgence] = (acc[d.urgence] ?? 0) + 1;
    return acc;
  }, {});
  const parService = (dossiers ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.serviceProducteurCode] = (acc[d.serviceProducteurCode] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Tableau stratégique</h2>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Dossiers en attente CNS</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase text-muted-foreground">Par classification</p>
          <div className="flex flex-wrap gap-2">
            {(["DR", "CD", "SD", "TSD"] as const).map((c) => (
              <span key={c} className="rounded bg-muted px-2 py-1">
                {c} : <strong>{parClass[c] ?? 0}</strong>
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase text-muted-foreground">Par urgence</p>
          <div className="flex flex-wrap gap-2">
            {(["routine", "urgent", "flash"] as const).map((u) => (
              <span
                key={u}
                className={
                  "rounded px-2 py-1 " +
                  (u === "flash" ? "bg-red-500/30 text-red-200" : "bg-muted")
                }
              >
                {u} : <strong>{parUrgence[u] ?? 0}</strong>
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase text-muted-foreground">Top services</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(parService)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([s, n]) => (
                <span key={s} className="rounded bg-muted px-2 py-1">
                  {s}: <strong>{n}</strong>
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlashAlerts({ jwt }: { jwt: string }) {
  const outbox = useQuery(api.icom.queries.listOutbox, { jwt, limit: 50 });
  const inbox = useQuery(api.icom.queries.listInbox, { jwt, limit: 50 });
  const flashEscalades = [
    ...(outbox ?? []).filter((c) => c.flashEscaladeStatut === "escaladee"),
    ...(inbox ?? []).filter((c) => c.flashEscaladeStatut === "escaladee"),
  ];

  return (
    <section className="rounded-lg border border-red-200/60 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
      <h2 className="mb-3 text-lg font-semibold text-red-700 dark:text-red-300">
        Alertes Flash escaladées
      </h2>
      {flashEscalades.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune escalade active.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {flashEscalades.map((c) => (
            <li
              key={c._id}
              className="rounded-md border border-red-200/60 bg-card/60 p-2 dark:border-red-900/40"
            >
              <p className="font-mono text-xs">{c.reference}</p>
              <p className="text-xs">
                Type : {c.type ?? "—"} · destinataire : {c.destinataireService ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SynthesesAValider({ jwt }: { jwt: string }) {
  const syntheses = useQuery(api.cns.synthesis.listSynthesesAStatut, {
    jwt,
    statut: "propose_au_sg",
  });
  const signer = useMutation(api.cns.synthesis.signerSynthese);
  const classer = useMutation(api.cns.synthesis.classerSyntheseSansSuite);

  const [openId, setOpenId] = useState<string | null>(null);
  const [signatureBlob, setSignatureBlob] = useState("");
  const [motif, setMotif] = useState("");
  const [transmettre, setTransmettre] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Synthèses à signer</h2>
      {syntheses === undefined && <p className="text-sm">Chargement…</p>}
      {syntheses && syntheses.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune synthèse en attente.</p>
      )}
      <ul className="space-y-2">
        {(syntheses ?? []).map((s) => (
          <li key={s._id} className="rounded-md border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs">{s.reference}</p>
              <button
                type="button"
                onClick={() => setOpenId(openId === s._id ? null : s._id)}
                className="text-primary underline-offset-2 hover:underline"
              >
                {openId === s._id ? "Fermer" : "Voir"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Classification {s.classification} · rédigé par {s.redacteurMatricule}
            </p>

            {openId === s._id && (
              <div className="mt-3 space-y-2 border-t pt-2">
                <label className="block text-xs font-medium">Signature qualifiée</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-mono"
                  value={signatureBlob}
                  onChange={(e) => setSignatureBlob(e.target.value)}
                />
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={transmettre}
                    onChange={(e) => setTransmettre(e.target.checked)}
                  />
                  Transmettre vers l'API présidentielle après signature
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await signer({
                        jwt,
                        syntheseId: s._id,
                        signatureBlob,
                        transmettreAPresidence: transmettre,
                      });
                      setOpenId(null);
                      setSignatureBlob("");
                    }}
                    disabled={signatureBlob.length < 16}
                    className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                  >
                    Signer
                  </button>
                </div>

                <div className="mt-2 border-t pt-2">
                  <label className="block text-xs font-medium">Motif de classement</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await classer({ jwt, syntheseId: s._id, motif });
                      setOpenId(null);
                      setMotif("");
                    }}
                    disabled={motif.trim().length < 5}
                    className="mt-1 rounded-md border border-input px-3 py-1 text-xs disabled:opacity-50"
                  >
                    Classer sans suite
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConvergencesNouvelles({ jwt }: { jwt: string }) {
  const convergences = useQuery(api.cns.crossing.listConvergencesNouvelles, {
    jwt,
    limit: 20,
  });
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Convergences détectées</h2>
      {convergences === undefined && <p className="text-sm">Chargement…</p>}
      {convergences && convergences.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune nouvelle convergence.</p>
      )}
      <ul className="space-y-2 text-sm">
        {(convergences ?? []).map((c) => (
          <li key={c._id} className="rounded-md border border-border p-2">
            <p className="text-xs">
              <strong>{c.score}</strong> tags partagés entre {c.dossierIds.length} dossiers ·{" "}
              services : {c.services.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground">
              Détectée le {new Date(c.detecteeAt).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionsSG({ jwt: _jwt }: { jwt: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Actions du SG-CNS</h2>
      <p className="text-sm text-muted-foreground">
        Convoquer une formation restreinte, demander un éclaircissement, activer une
        crise — ces actions passent par les modules iCom et Crise correspondants.
      </p>
      {/* Ces boutons routent vers les modules concernés. À câbler quand on intègre
          le routing iCNS principal (Phase 4 finale). */}
    </section>
  );
}

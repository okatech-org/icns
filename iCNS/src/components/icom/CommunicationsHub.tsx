// iCom — Hub des communications inter-services (Prompt 4.1)

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useICNSAuth } from "../../auth/useICNSAuth";

type TypeCom = "requisition" | "note_coordination" | "directive" | "compte_rendu" | "demande_eclaircissement";
type Urgence = "routine" | "urgent" | "flash";
type Classification = "DR" | "CD" | "SD" | "TSD";

export function CommunicationsHub() {
  const jwt = useICNSAuth((s) => s.jwt);
  const role = useICNSAuth((s) => s.role);
  const [tab, setTab] = useState<"inbox" | "outbox" | "compose">("inbox");

  if (!jwt) return null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Communications officielles (iCom)</h2>
        <nav className="flex gap-1">
          {(["inbox", "outbox", "compose"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "rounded-md px-3 py-1 text-sm " +
                (tab === t ? "bg-primary text-primary-foreground" : "border border-input")
              }
            >
              {t === "inbox" ? "Reçues" : t === "outbox" ? "Envoyées" : "Nouvelle"}
            </button>
          ))}
        </nav>
      </header>

      {tab === "inbox" && <Inbox jwt={jwt} />}
      {tab === "outbox" && <Outbox jwt={jwt} />}
      {tab === "compose" && (
        <Compose
          jwt={jwt}
          allowDirective={role === "sg_cns"}
          onSent={() => setTab("outbox")}
        />
      )}
    </div>
  );
}

function Inbox({ jwt }: { jwt: string }) {
  const inbox = useQuery(api.icom.queries.listInbox, { jwt, limit: 100 });
  const acknowledge = useMutation(api.icom.create.acknowledgeCom);

  if (inbox === undefined) return <p className="text-sm">Chargement…</p>;
  if (inbox.length === 0) return <p className="text-sm text-muted-foreground">Boîte vide.</p>;

  return (
    <ul className="space-y-2">
      {inbox.map((c) => (
        <li
          key={c._id}
          className={
            "rounded-md border p-3 " +
            (c.urgence === "flash" && !c.isAcknowledged
              ? "border-red-500 bg-red-500/10 animate-pulse"
              : c.urgence === "urgent"
                ? "border-amber-500"
                : "border-border")
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs">{c.reference}</p>
              <p className="text-sm font-medium uppercase">{c.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">
                De {c.emetteurMatricule} ({c.emetteurService}) ·{" "}
                {new Date(c.sentAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  "rounded px-2 py-0.5 text-xs uppercase " +
                  (c.urgence === "flash"
                    ? "bg-red-600 text-white"
                    : c.urgence === "urgent"
                      ? "bg-amber-500/30"
                      : "bg-muted")
                }
              >
                {c.urgence}
              </span>
              {!c.isAcknowledged && (
                <button
                  type="button"
                  onClick={() => acknowledge({ jwt, communicationId: c._id })}
                  className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                >
                  Accuser réception
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Outbox({ jwt }: { jwt: string }) {
  const outbox = useQuery(api.icom.queries.listOutbox, { jwt, limit: 100 });
  if (outbox === undefined) return <p className="text-sm">Chargement…</p>;
  if (outbox.length === 0) return <p className="text-sm text-muted-foreground">Aucune communication envoyée.</p>;
  return (
    <ul className="space-y-2">
      {outbox.map((c) => (
        <li key={c._id} className="rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs">{c.reference}</span>
            <span className="text-xs uppercase">{c.urgence}</span>
          </div>
          <p className="mt-1">
            {c.type.replace(/_/g, " ")} → {c.destinataireService}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(c.sentAt).toLocaleString("fr-FR")}
            {c.flashEscaladeStatut === "escaladee" && (
              <span className="ml-2 rounded bg-red-500/20 px-1 text-red-200">
                Escaladée SG-CNS
              </span>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Compose({
  jwt,
  allowDirective,
  onSent,
}: {
  jwt: string;
  allowDirective: boolean;
  onSent: () => void;
}) {
  const createCom = useMutation(api.icom.create.createCom);
  const [type, setType] = useState<TypeCom>("note_coordination");
  const [urgence, setUrgence] = useState<Urgence>("routine");
  const [classification, setClassification] = useState<Classification>("DR");
  const [destinataireService, setDestinataireService] = useState("CNS_SECRETARIAT");
  const [objet, setObjet] = useState("");
  const [corps, setCorps] = useState("");
  const [signatureBlob, setSignatureBlob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const types: TypeCom[] = ["requisition", "note_coordination", "compte_rendu", "demande_eclaircissement"];
  if (allowDirective) types.unshift("directive");

  const submit = async () => {
    setError(null);
    if (signatureBlob.length < 16) {
      setError("Signature qualifiée requise.");
      return;
    }
    setSubmitting(true);
    try {
      await createCom({
        jwt,
        type,
        urgence,
        classification,
        destinataireService,
        objet,
        corps,
        signatureQualifieeBlob: signatureBlob,
      });
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1"
            value={type}
            onChange={(e) => setType(e.target.value as TypeCom)}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Urgence</span>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1"
            value={urgence}
            onChange={(e) => setUrgence(e.target.value as Urgence)}
          >
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="flash">Flash (escalade auto SG-CNS si non lu en 1h)</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Classification</span>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1"
            value={classification}
            onChange={(e) => setClassification(e.target.value as Classification)}
          >
            <option value="DR">DR</option>
            <option value="CD">CD</option>
            <option value="SD">SD</option>
            <option value="TSD">TSD</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Destinataire</span>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-2 py-1"
            value={destinataireService}
            onChange={(e) => setDestinataireService(e.target.value)}
            placeholder="Code service (ex. DGSS) ou CNS_SECRETARIAT"
          />
        </label>
      </div>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Objet</span>
        <input
          type="text"
          className="w-full rounded-md border border-input bg-background px-2 py-1"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Corps</span>
        <textarea
          rows={8}
          className="w-full rounded-md border border-input bg-background px-2 py-1"
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Signature qualifiée (HSM)</span>
        <input
          type="text"
          className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs"
          value={signatureBlob}
          onChange={(e) => setSignatureBlob(e.target.value)}
          placeholder="MOCK-SIGN:icom:xxx (dev) — branchera HSM en prod"
        />
      </label>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !objet || !corps || signatureBlob.length < 16}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

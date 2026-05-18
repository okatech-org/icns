// iCom — Hub des communications inter-services (Prompt 4.1)

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useICNSAuth } from "../../auth/useICNSAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCheck,
  Inbox as InboxIcon,
  Mail,
  PenSquare,
  Send,
  Siren,
  Zap,
} from "lucide-react";

type TypeCom = "requisition" | "note_coordination" | "directive" | "compte_rendu" | "demande_eclaircissement";
type Urgence = "routine" | "urgent" | "flash";
type Classification = "DR" | "CD" | "SD" | "TSD";

const URGENCE_META: Record<
  Urgence,
  { label: string; badgeClass: string; cardClass: string; Icon: typeof Zap }
> = {
  flash: {
    label: "FLASH",
    badgeClass: "bg-red-600 text-white",
    cardClass: "border-red-500 bg-red-500/5",
    Icon: Siren,
  },
  urgent: {
    label: "URGENT",
    badgeClass: "bg-amber-500 text-black",
    cardClass: "border-amber-500/50 bg-amber-500/5",
    Icon: AlertCircle,
  },
  routine: {
    label: "ROUTINE",
    badgeClass: "bg-muted text-foreground",
    cardClass: "border-border",
    Icon: Mail,
  },
};

const CLASSIFICATION_BADGE: Record<Classification, string> = {
  DR: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  CD: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40",
  SD: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40",
  TSD: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function CommunicationsHub() {
  const jwt = useICNSAuth((s) => s.jwt);
  const role = useICNSAuth((s) => s.role);
  const [tab, setTab] = useState<"inbox" | "outbox" | "compose">("inbox");

  const inbox = useQuery(api.icom.queries.listInbox, jwt ? { jwt, limit: 100 } : "skip");
  const outbox = useQuery(api.icom.queries.listOutbox, jwt ? { jwt, limit: 100 } : "skip");

  if (!jwt) return null;

  const inboxUnread = inbox?.filter((c) => !c.isAcknowledged).length ?? 0;
  const outboxCount = outbox?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <nav className="flex flex-wrap gap-2">
        <TabButton
          active={tab === "inbox"}
          onClick={() => setTab("inbox")}
          icon={<InboxIcon className="h-4 w-4" />}
          label="Reçues"
          count={inbox?.length}
          badgeCount={inboxUnread}
        />
        <TabButton
          active={tab === "outbox"}
          onClick={() => setTab("outbox")}
          icon={<Send className="h-4 w-4" />}
          label="Envoyées"
          count={outboxCount}
        />
        <TabButton
          active={tab === "compose"}
          onClick={() => setTab("compose")}
          icon={<PenSquare className="h-4 w-4" />}
          label="Composer"
        />
      </nav>

      {tab === "inbox" && <Inbox jwt={jwt} inbox={inbox} />}
      {tab === "outbox" && <Outbox outbox={outbox} />}
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

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  badgeCount,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors " +
        (active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "border border-border bg-background hover:bg-muted")
      }
    >
      {icon}
      {label}
      {count !== undefined && (
        <span
          className={
            "rounded-full px-1.5 py-0.5 text-[10px] font-mono " +
            (active ? "bg-primary-foreground/20" : "bg-muted")
          }
        >
          {count}
        </span>
      )}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="relative -ml-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
    </button>
  );
}

function Inbox({
  jwt,
  inbox,
}: {
  jwt: string;
  inbox:
    | Array<{
        _id: string;
        reference: string;
        type: string;
        urgence: Urgence;
        emetteurMatricule: string;
        emetteurService: string;
        sentAt: number;
        isAcknowledged?: boolean;
      }>
    | undefined;
}) {
  const acknowledge = useMutation(api.icom.create.acknowledgeCom);

  if (inbox === undefined) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Chargement…
        </CardContent>
      </Card>
    );
  }

  if (inbox.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <InboxIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Aucune communication reçue</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Lorsqu'un service vous adresse une communication officielle (réquisition, note,
            directive, demande d'éclaircissement), elle apparaît ici classée par urgence.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {inbox.map((c) => {
        const meta = URGENCE_META[c.urgence];
        const unread = !c.isAcknowledged;
        return (
          <li
            key={c._id}
            className={
              "rounded-lg border p-4 transition-shadow " +
              meta.cardClass +
              (unread && c.urgence === "flash" ? " animate-pulse" : "") +
              " hover:shadow-sm"
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <meta.Icon
                    className={
                      "h-4 w-4 shrink-0 " +
                      (c.urgence === "flash"
                        ? "text-red-600"
                        : c.urgence === "urgent"
                          ? "text-amber-600"
                          : "text-muted-foreground")
                    }
                  />
                  <span
                    className={
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                      meta.badgeClass
                    }
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {c.reference}
                  </span>
                  {unread && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Non lu
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold uppercase">
                  {c.type.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  De <span className="font-mono">{c.emetteurMatricule}</span> ·{" "}
                  service <span className="font-mono">{c.emetteurService}</span> ·{" "}
                  {timeAgo(c.sentAt)} ({new Date(c.sentAt).toLocaleString("fr-FR")})
                </p>
              </div>
              {unread && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => acknowledge({ jwt, communicationId: c._id as never })}
                  className="shrink-0"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Accuser réception
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Outbox({
  outbox,
}: {
  outbox:
    | Array<{
        _id: string;
        reference: string;
        type: string;
        urgence: Urgence;
        destinataireService: string;
        sentAt: number;
        flashEscaladeStatut?: string;
      }>
    | undefined;
}) {
  if (outbox === undefined) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Chargement…
        </CardContent>
      </Card>
    );
  }

  if (outbox.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Aucune communication envoyée</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Utilisez l'onglet « Composer » pour rédiger et signer une communication
            officielle à destination d'un autre service.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {outbox.map((c) => {
        const meta = URGENCE_META[c.urgence];
        return (
          <li key={c._id} className={"rounded-lg border p-4 " + meta.cardClass + " hover:shadow-sm"}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <meta.Icon
                  className={
                    "h-4 w-4 shrink-0 " +
                    (c.urgence === "flash"
                      ? "text-red-600"
                      : c.urgence === "urgent"
                        ? "text-amber-600"
                        : "text-muted-foreground")
                  }
                />
                <span className={"rounded px-1.5 py-0.5 text-[10px] font-bold " + meta.badgeClass}>
                  {meta.label}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{c.reference}</span>
              </div>
              {c.flashEscaladeStatut === "escaladee" && (
                <Badge variant="destructive">Escaladée SG-CNS</Badge>
              )}
            </div>
            <p className="mt-2 text-sm font-medium">
              {c.type.replace(/_/g, " ")} →{" "}
              <span className="font-mono">{c.destinataireService}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {timeAgo(c.sentAt)} ({new Date(c.sentAt).toLocaleString("fr-FR")})
            </p>
          </li>
        );
      })}
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
      setError("Signature qualifiée requise (≥ 16 caractères).");
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nouvelle communication officielle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Type</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
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
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Urgence</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={urgence}
              onChange={(e) => setUrgence(e.target.value as Urgence)}
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="flash">Flash (escalade auto SG-CNS si non lu en 1 h)</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Classification</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={classification}
              onChange={(e) => setClassification(e.target.value as Classification)}
            >
              <option value="DR">DR — Diffusion Restreinte</option>
              <option value="CD">CD — Confidentiel Défense</option>
              <option value="SD">SD — Secret Défense</option>
              <option value="TSD">TSD — Très Secret Défense</option>
            </select>
            <span
              className={
                "mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-mono " +
                CLASSIFICATION_BADGE[classification]
              }
            >
              {classification}
            </span>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Destinataire (code service)</span>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={destinataireService}
              onChange={(e) => setDestinataireService(e.target.value)}
              placeholder="ex. DGSS, DGR, CNS_SECRETARIAT"
            />
          </label>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Objet</span>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            placeholder="Sujet de la communication…"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Corps</span>
          <textarea
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            placeholder="Détail de la communication…"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Signature qualifiée (HSM)</span>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
            value={signatureBlob}
            onChange={(e) => setSignatureBlob(e.target.value)}
            placeholder="MOCK-SIGN:icom:xxx (dev) — branchera HSM en prod"
          />
        </label>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-muted-foreground">
            Toutes les communications sont chiffrées (AES-256) et tracées dans le journal
            d'audit chaîné.
          </p>
          <Button
            onClick={submit}
            disabled={submitting || !objet || !corps || signatureBlob.length < 16}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {submitting ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

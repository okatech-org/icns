// Modules ICNSWorkspace — cellule, audit, admin, archive
// Implémentés contre les queries Convex publiques.
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.3, §3.4 (Cellule CNS, RSSI, Admin, iArchive)

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useICNSAuth } from "../../auth/useICNSAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertTriangle,
    CheckCircle2,
    Database,
    FileSearch,
    GitMerge,
    History,
    Key,
    Lock,
    Network,
    Shield,
    UserCheck,
} from "lucide-react";

const CLASSIFICATION_COLORS: Record<string, string> = {
    DR: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    CD: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    SD: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    TSD: "bg-red-500/15 text-red-700 dark:text-red-300",
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

// ═══════════════════════════════════════════════════════════════════
// CELLULE — Croisement multi-services + synthèses
// ═══════════════════════════════════════════════════════════════════

export function CelluleModule() {
    const jwt = useICNSAuth((s) => s.jwt);
    const [keyword, setKeyword] = useState("");
    const [submittedKeyword, setSubmittedKeyword] = useState("");

    const convergences = useQuery(
        api.cns.crossing.listConvergencesNouvelles,
        jwt ? { jwt, limit: 20 } : "skip",
    );

    const syntheses = useQuery(
        api.cns.synthesis.listSynthesesAStatut,
        jwt ? { jwt, statut: "brouillon", limit: 10 } : "skip",
    );

    const searchResults = useQuery(
        api.cns.crossing.searchDossiers,
        jwt && submittedKeyword
            ? {
                jwt,
                criteres: {
                    must: [{ type: "mot_cle" as const, value: submittedKeyword }],
                },
            }
            : "skip",
    );

    if (!jwt) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5" /> Cellule de coordination CNS
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Authentification requise (rôle <code>analyste_cns</code> ou{" "}
                        <code>sg_cns</code>).
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5" /> Cellule de coordination CNS
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Croisement multi-services et production de synthèses inter-agences.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileSearch className="h-4 w-4" /> Recherche transversale
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSubmittedKeyword(keyword.trim());
                        }}
                    >
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Mot-clé (individu, organisation, lieu…)"
                            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                        <Button type="submit" size="sm">
                            Rechercher
                        </Button>
                    </form>
                    {submittedKeyword && (
                        <div className="mt-4 text-sm">
                            {searchResults === undefined ? (
                                <p className="text-muted-foreground">Recherche…</p>
                            ) : searchResults.length === 0 ? (
                                <p className="text-muted-foreground">
                                    Aucun dossier indexé sur « {submittedKeyword} ».
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {searchResults.map((d) => (
                                        <li
                                            key={d.dossierId}
                                            className="rounded-md border border-border p-3 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono">{d.reference}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        CLASSIFICATION_COLORS[d.classification]
                                                    }
                                                >
                                                    {d.classification}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-muted-foreground">
                                                Service producteur : {d.service} · score {d.score}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <GitMerge className="h-4 w-4" /> Convergences détectées
                        {convergences && convergences.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {convergences.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {convergences === undefined ? (
                        <p className="text-sm text-muted-foreground">Chargement…</p>
                    ) : convergences.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucune convergence nouvelle.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {convergences.map((c) => (
                                <li
                                    key={c._id}
                                    className="flex items-start justify-between rounded-md border border-border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {c.services.length} services · score {c.score}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {c.dossierIds.length} dossiers en jonction · détectée{" "}
                                            {timeAgo(c.detecteeAt)}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{c.statut}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileSearch className="h-4 w-4" /> Synthèses en brouillon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {syntheses === undefined ? (
                        <p className="text-sm text-muted-foreground">Chargement…</p>
                    ) : syntheses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucune synthèse en cours de rédaction.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {syntheses.map((s) => (
                                <li
                                    key={s._id}
                                    className="flex items-center justify-between rounded-md border border-border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-mono">{s.reference}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {s.dossiersSources.length} dossiers cités
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={CLASSIFICATION_COLORS[s.classification]}
                                    >
                                        {s.classification}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT — Vérification chaîne d'audit + journal
// ═══════════════════════════════════════════════════════════════════

export function AuditModule() {
    const verification = useQuery(api.audit_verify.verifyAuditChain, { maxEntries: 1000 });
    const lastHash = useQuery(api.audit_verify.getLastAuditHash);
    const logs = useQuery(api.operations.getAuditLogs, { limit: 20 });

    const totalEvents = verification?.totalEntries ?? 0;
    const breaks = verification?.ecarts ?? [];
    const chainOk = verification?.ok ?? false;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Audit & RSSI
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Vérification de l'intégrité du journal d'audit chaîné et inspection des
                        événements récents.
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">État de la chaîne</CardTitle>
                        {chainOk ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div
                            className={
                                "text-xl font-bold " +
                                (chainOk ? "text-emerald-600" : "text-red-600")
                            }
                        >
                            {verification === undefined
                                ? "—"
                                : chainOk
                                  ? "Intègre"
                                  : `${breaks.length} écart${breaks.length > 1 ? "s" : ""}`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {totalEvents} entrées vérifiées
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dernier hash</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs font-mono truncate">
                            {lastHash === undefined
                                ? "—"
                                : lastHash?.hash
                                  ? lastHash.hash.slice(0, 24) + "…"
                                  : "génésis"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            séquence {lastHash?.sequence ?? 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Journal opérationnel</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            {logs === undefined ? "—" : logs.length}
                        </div>
                        <p className="text-xs text-muted-foreground">événements récents</p>
                    </CardContent>
                </Card>
            </div>

            {!chainOk && breaks.length > 0 && (
                <Card className="border-red-500/40">
                    <CardHeader>
                        <CardTitle className="text-base text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Écarts détectés
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {breaks.slice(0, 5).map((b, i) => (
                                <li
                                    key={i}
                                    className="rounded-md border border-red-500/30 bg-red-500/5 p-3"
                                >
                                    <p className="font-mono text-xs">
                                        Séq {b.sequence} · {b.reason}
                                    </p>
                                    {b.detail && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {b.detail}
                                        </p>
                                    )}
                                </li>
                            ))}
                            {breaks.length > 5 && (
                                <li className="text-xs text-muted-foreground">
                                    + {breaks.length - 5} autres écarts.
                                </li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Événements récents</CardTitle>
                </CardHeader>
                <CardContent>
                    {logs === undefined ? (
                        <p className="text-sm text-muted-foreground">Chargement…</p>
                    ) : logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucun événement enregistré.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                    <th className="py-2 pr-2">Quand</th>
                                    <th className="py-2 pr-2">Action</th>
                                    <th className="py-2 pr-2">Ressource</th>
                                    <th className="py-2 pr-2">Utilisateur</th>
                                    <th className="py-2 pr-2 text-right">Sévérité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.slice(0, 10).map((l) => (
                                    <tr key={l._id} className="border-b border-border/50">
                                        <td className="py-2 pr-2 text-xs text-muted-foreground">
                                            {timeAgo(l._creationTime)}
                                        </td>
                                        <td className="py-2 pr-2">{l.action}</td>
                                        <td className="py-2 pr-2 text-xs">{l.resource}</td>
                                        <td className="py-2 pr-2 text-xs font-mono">{l.userId}</td>
                                        <td className="py-2 pr-2 text-right">
                                            <Badge variant="outline">{l.severity}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN — Habilitations et utilisateur courant
// ═══════════════════════════════════════════════════════════════════

export function AdminModule() {
    const jwt = useICNSAuth((s) => s.jwt);
    const role = useICNSAuth((s) => s.role);
    const service = useICNSAuth((s) => s.service);
    const expiresAt = useICNSAuth((s) => s.expiresAt);

    const currentUser = useQuery(
        api.auth.middleware.getCurrentUser,
        jwt ? { jwt } : "skip",
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" /> Administration technique
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Visualisation de la session courante et des informations d'habilitation.
                        Les actions de gestion (création d'agent, attribution de rôle) sont
                        réalisées hors session via les outils CLI sécurisés (cf.{" "}
                        <code>scripts/seed-users.ts</code>).
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Session courante</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Rôle</dt>
                                <dd>
                                    <Badge variant="outline" className="font-mono">
                                        {role ?? "—"}
                                    </Badge>
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Service</dt>
                                <dd className="font-mono text-xs">{service ?? "—"}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">JWT expire</dt>
                                <dd className="text-xs">
                                    {expiresAt
                                        ? new Date(expiresAt).toLocaleString("fr-FR")
                                        : "—"}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Identité validée</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentUser === undefined ? (
                            <p className="text-sm text-muted-foreground">Vérification…</p>
                        ) : !currentUser ? (
                            <p className="text-sm text-muted-foreground">
                                Aucune identité côté backend (JWT invalide ou expiré).
                            </p>
                        ) : (
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Matricule</dt>
                                    <dd className="font-mono">{currentUser.matricule}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Rôle (backend)</dt>
                                    <dd className="font-mono">{currentUser.role}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Service (backend)</dt>
                                    <dd className="font-mono">{currentUser.service}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Session expire</dt>
                                    <dd className="text-xs">
                                        {new Date(currentUser.sessionExpiresAt).toLocaleString(
                                            "fr-FR",
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Verrouillage automatique
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        La session est verrouillée après <strong>15 minutes d'inactivité</strong>{" "}
                        et le JWT est uniquement maintenu en mémoire. Le rechargement de la page
                        invalide systématiquement la session — re-MFA obligatoire (carte agent +
                        PIN + biométrie).
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// ARCHIVE — Déclassification + dossiers archivés
// ═══════════════════════════════════════════════════════════════════

export function ArchiveModule() {
    const jwt = useICNSAuth((s) => s.jwt);
    const [statutFilter, setStatutFilter] = useState<string>("");

    const requests = useQuery(
        api.iarchive.declassification.listDeclassificationRequests,
        jwt
            ? statutFilter
                ? { jwt, statut: statutFilter }
                : { jwt }
            : "skip",
    );

    if (!jwt) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" /> iArchive
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Authentification requise (rôles <code>sg_cns</code>, <code>rssi</code>,{" "}
                        <code>auditeur</code> ou <code>admin_technique</code>).
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" /> iArchive — Versement & déclassification
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Politiques de rétention : <strong>DR 5 ans</strong> ·{" "}
                        <strong>CD 10 ans</strong> · <strong>SD 30 ans</strong> ·{" "}
                        <strong>TSD 50 ans</strong>. Toute déclassification requiert une
                        validation SG-CNS puis une décision de la commission.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Demandes de déclassification</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex gap-2">
                        {(
                            [
                                ["", "Tous"],
                                ["en_attente_commission", "En attente"],
                                ["approuvee_sg", "Approuvée SG"],
                                ["executee", "Exécutée"],
                                ["rejetee", "Rejetée"],
                            ] as const
                        ).map(([value, label]) => (
                            <Button
                                key={value || "all"}
                                size="sm"
                                variant={statutFilter === value ? "default" : "outline"}
                                onClick={() => setStatutFilter(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>

                    {requests === undefined ? (
                        <p className="text-sm text-muted-foreground">Chargement…</p>
                    ) : requests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucune demande {statutFilter ? `avec le statut « ${statutFilter} »` : "en cours"}.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                    <th className="py-2 pr-2">Date</th>
                                    <th className="py-2 pr-2">Demandeur</th>
                                    <th className="py-2 pr-2">Motif</th>
                                    <th className="py-2 pr-2 text-right">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r) => (
                                    <tr key={r._id} className="border-b border-border/50">
                                        <td className="py-2 pr-2 text-xs text-muted-foreground">
                                            {timeAgo(r._creationTime)}
                                        </td>
                                        <td className="py-2 pr-2 font-mono text-xs">
                                            {r.requestedByMatricule}
                                        </td>
                                        <td className="py-2 pr-2 text-xs truncate max-w-xs">
                                            {r.motif}
                                        </td>
                                        <td className="py-2 pr-2 text-right">
                                            <Badge variant="outline">{r.statut}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

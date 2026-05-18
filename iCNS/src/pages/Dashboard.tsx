// Tableau de bord generique — branche sur les queries Convex publiques
// (KPI nationaux, journal d'audit, courriers entrants, signalements).

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    FileText,
    MessageSquare,
    AlertTriangle,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";

type AuditLog = {
    _id: string;
    _creationTime: number;
    action: string;
    resource: string;
    severity: string;
    success: boolean;
    userId: string;
};

type IncomingMail = {
    _id: string;
    _creationTime: number;
    subject?: string;
    senderName?: string;
    urgency: string;
    status: string;
};

type NationalKpis = {
    _id: string;
    _creationTime: number;
    month?: string;
    pibGrowth?: number;
    unemploymentRate?: number;
    inflationRate?: number;
    publicDebtRatio?: number;
    data?: Record<string, unknown>;
};

type Signalement = {
    _id: string;
    _creationTime: number;
    type?: string;
    region?: string;
    severity?: string;
    status?: string;
};

const SEVERITY_COLORS: Record<string, string> = {
    critical: "bg-red-500/15 text-red-700 dark:text-red-300",
    high: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
};

function timeAgo(ms: number): string {
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const kpis = useQuery(api.dashboard.getNationalKpis) as
        | NationalKpis
        | null
        | undefined;
    const auditLogs = useQuery(api.operations.getAuditLogs, { limit: 5 }) as
        | AuditLog[]
        | undefined;
    const incomingMails = useQuery(api.operations.getIncomingMails) as
        | IncomingMail[]
        | undefined;
    const signalements = useQuery(api.dashboard.getSignalements) as
        | Signalement[]
        | undefined;

    const stats = useMemo(() => {
        const docsCount = auditLogs?.filter((l) => l.resource === "document").length ?? 0;
        const mailsCount = incomingMails?.length ?? 0;
        const unreadMails = incomingMails?.filter((m) => m.status === "new").length ?? 0;
        const alerts = signalements?.filter(
            (s) => s.severity === "critical" || s.severity === "high",
        ).length ?? 0;
        const activityCount = auditLogs?.length ?? 0;
        return { docsCount, mailsCount, unreadMails, alerts, activityCount };
    }, [auditLogs, incomingMails, signalements]);

    const loading =
        kpis === undefined ||
        auditLogs === undefined ||
        incomingMails === undefined ||
        signalements === undefined;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
                    <p className="text-muted-foreground">
                        Vue d'ensemble en temps réel des données nationales et de votre activité.
                    </p>
                </div>
                <Button onClick={() => navigate("/icorrespondance")}>
                    Nouvelle correspondance
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents tracés</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "—" : stats.docsCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            événements documents (dernières 5 entrées audit)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Courriers</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "—" : stats.mailsCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {loading ? "" : `${stats.unreadMails} non traités`}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Signalements actifs</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "—" : stats.alerts}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            sévérité critique ou élevée
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activité auditée</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "—" : stats.activityCount}
                        </div>
                        <p className="text-xs text-muted-foreground">événements récents</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Activités récentes</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Chargement…</p>
                        ) : !auditLogs || auditLogs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aucune activité enregistrée pour le moment.
                            </p>
                        ) : (
                            <ul className="space-y-5">
                                {auditLogs.map((log) => (
                                    <li key={log._id} className="flex items-start gap-4">
                                        <div className="mt-1 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Activity className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight">
                                                {log.action}
                                                {log.success ? "" : " (échec)"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                ressource : {log.resource} · utilisateur : {log.userId}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={SEVERITY_COLORS[log.severity] ?? ""}
                                        >
                                            {log.severity}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {timeAgo(log._creationTime)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Courriers prioritaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Chargement…</p>
                        ) : !incomingMails || incomingMails.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aucun courrier reçu.
                            </p>
                        ) : (
                            <ul className="space-y-4">
                                {incomingMails.slice(0, 4).map((mail) => (
                                    <li key={mail._id} className="flex items-start gap-3">
                                        <span className="relative flex h-2 w-2 mr-1 mt-2">
                                            <span
                                                className={
                                                    "absolute inline-flex h-full w-full rounded-full opacity-60 " +
                                                    (mail.urgency === "high"
                                                        ? "bg-red-400 animate-ping"
                                                        : "bg-sky-400")
                                                }
                                            ></span>
                                            <span
                                                className={
                                                    "relative inline-flex rounded-full h-2 w-2 " +
                                                    (mail.urgency === "high"
                                                        ? "bg-red-500"
                                                        : "bg-sky-500")
                                                }
                                            ></span>
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight truncate">
                                                {mail.subject ?? "Sans objet"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {mail.senderName ?? "Expéditeur inconnu"} · {mail.status}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {kpis && (
                <Card>
                    <CardHeader>
                        <CardTitle>Indicateurs nationaux</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Mois</p>
                                <p className="font-semibold">{kpis.month ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Croissance PIB</p>
                                <p className="font-semibold">
                                    {kpis.pibGrowth !== undefined ? `${kpis.pibGrowth}%` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Chômage</p>
                                <p className="font-semibold">
                                    {kpis.unemploymentRate !== undefined
                                        ? `${kpis.unemploymentRate}%`
                                        : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Inflation</p>
                                <p className="font-semibold">
                                    {kpis.inflationRate !== undefined
                                        ? `${kpis.inflationRate}%`
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Dashboard;

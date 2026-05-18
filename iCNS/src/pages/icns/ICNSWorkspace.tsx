// Espace de travail iCNS — Hub par rôle (Phase 3+)
// Affiche les modules iCNS pertinents selon le rôle de l'utilisateur connecté.

import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useICNSAuth } from "@/auth/useICNSAuth";
import { ClassificationBanner } from "@/components/dossiers/ClassificationBanner";
import { DossierList } from "@/components/dossiers/DossierList";
import { DossierEditor } from "@/components/dossiers/DossierEditor";
import { NewDossierWizard } from "@/components/dossiers/NewDossierWizard";
import { CommunicationsHub } from "@/components/icom/CommunicationsHub";
import { SGCockpit } from "@/components/sg-cockpit/SGCockpit";
import {
  AdminModule,
  ArchiveModule,
  AuditModule,
  CelluleModule,
} from "@/components/icns-workspace/WorkspaceModules";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Archive,
  ChevronRight,
  Folder,
  LogOut,
  Mail,
  Network,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { ICNS_PERSONAS } from "@/data/icns-personas";
import type { Id } from "@convex/_generated/dataModel";

type ModuleKey =
  | "dossiers"
  | "icom"
  | "sg-cockpit"
  | "audit"
  | "admin"
  | "cellule"
  | "archive";

const MODULES_PAR_ROLE: Record<string, ModuleKey[]> = {
  officier_traitant: ["dossiers", "icom"],
  chef_section: ["dossiers", "icom"],
  directeur_service: ["dossiers", "icom"],
  analyste_cns: ["cellule", "dossiers", "icom"],
  sg_cns: ["sg-cockpit", "dossiers", "icom", "archive"],
  rssi: ["audit", "icom"],
  auditeur: ["audit"],
  admin_technique: ["admin"],
};

const MODULE_META: Record<
  ModuleKey,
  { label: string; description: string; Icon: typeof Folder }
> = {
  "sg-cockpit": {
    label: "Cockpit SG-CNS",
    description: "Vue d'ensemble Secrétariat Général",
    Icon: ShieldCheck,
  },
  cellule: {
    label: "Cellule CNS",
    description: "Croisement et synthèses inter-services",
    Icon: Network,
  },
  dossiers: {
    label: "Mes dossiers",
    description: "Dossiers de renseignement visibles",
    Icon: Folder,
  },
  icom: {
    label: "Communications",
    description: "Messages officiels inter-agences",
    Icon: Mail,
  },
  audit: {
    label: "Audit / RSSI",
    description: "Journal d'audit chaîné, intégrité",
    Icon: Shield,
  },
  archive: {
    label: "iArchive",
    description: "Versement & déclassification",
    Icon: Archive,
  },
  admin: {
    label: "Administration",
    description: "Habilitations & paramètres techniques",
    Icon: UserCog,
  },
};

const ROLE_LABEL: Record<string, string> = {
  officier_traitant: "Officier traitant",
  chef_section: "Chef de section",
  directeur_service: "Directeur de service",
  analyste_cns: "Analyste CNS",
  sg_cns: "Secrétaire Général CNS",
  rssi: "RSSI",
  auditeur: "Auditeur",
  admin_technique: "Administrateur technique",
};

// Classification visible dans la bannière selon le rôle (niveau plafond
// d'habilitation pour les rôles iCNS).
const ROLE_CLASSIFICATION: Record<string, "DR" | "CD" | "SD" | "TSD"> = {
  officier_traitant: "SD",
  chef_section: "SD",
  directeur_service: "TSD",
  analyste_cns: "TSD",
  sg_cns: "TSD",
  rssi: "TSD",
  auditeur: "SD",
  admin_technique: "CD",
};

function initialsFromName(name: string): string {
  return name
    .replace(/[^A-Za-zÀ-ÿ\s\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function ICNSWorkspace() {
  const navigate = useNavigate();
  const { jwt, role, service, isAuthenticated, expiresAt, clearAuth } = useICNSAuth();
  const [active, setActive] = useState<ModuleKey>("dossiers");
  const [openDossierId, setOpenDossierId] = useState<Id<"dossiers_renseignement"> | null>(null);
  const [creatingDossier, setCreatingDossier] = useState(false);
  const now = useNow();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/icns/login", { replace: true });
      return;
    }
    // Garde-fou : si un JWT non conforme traîne en mémoire (session
    // corrompue, ancien build, manipulation DevTools), on coupe la session
    // immédiatement pour éviter que toutes les queries Convex authentifiées
    // n'échouent en cascade avec « Header JWT illisible ».
    if (!jwt || jwt.split(".").length !== 3) {
      clearAuth("jwt_malforme");
      navigate("/icns/login", { replace: true });
    }
  }, [isAuthenticated, jwt, clearAuth, navigate]);

  useEffect(() => {
    if (!role) return;
    const allowed = MODULES_PAR_ROLE[role] ?? ["dossiers"];
    if (!allowed.includes(active)) setActive(allowed[0]);
  }, [role, active]);

  // Profil agent dérivé du matricule (catalogue ICNS_PERSONAS).
  // Le matricule provient du JWT décodé : on l'extrait du payload base64.
  const matricule = useMemo(() => {
    if (!jwt) return null;
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      return null;
    }
  }, [jwt]);

  const persona = useMemo(
    () => (matricule ? ICNS_PERSONAS.find((p) => p.matricule === matricule) ?? null : null),
    [matricule],
  );

  if (!isAuthenticated || !jwt || !role) {
    return null;
  }

  const allowedModules = MODULES_PAR_ROLE[role] ?? ["dossiers"];
  const classification = ROLE_CLASSIFICATION[role] ?? "CD";
  const activeMeta = MODULE_META[active];

  const handleLogout = () => {
    clearAuth("user_initiated");
    navigate("/icns/login", { replace: true });
  };

  const sessionEndsIn = expiresAt
    ? Math.max(0, Math.round((expiresAt - now.getTime()) / 60_000))
    : null;

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <ClassificationBanner classification={classification} />

      {/* Header riche */}
      <header className="sticky top-7 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background p-1.5">
              <img
                src={emblemGabon}
                alt="République Gabonaise"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                iCNS — Conseil National de Sécurité
              </h1>
              <p className="text-xs text-muted-foreground">
                République Gabonaise · Plateforme de renseignement national
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                Session active
                {sessionEndsIn !== null && (
                  <>
                    {" · "}
                    <span className="font-mono">
                      {sessionEndsIn > 0 ? `${sessionEndsIn} min` : "expirée"}
                    </span>
                  </>
                )}
              </span>
            </div>
            <span className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-xs font-mono">
              {now.toLocaleString("fr-FR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>

          {/* Déconnexion mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="md:hidden"
            aria-label="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Modules autorisés
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {allowedModules.length} module{allowedModules.length > 1 ? "s" : ""} disponible
              {allowedModules.length > 1 ? "s" : ""}
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {allowedModules.map((m) => {
              const meta = MODULE_META[m];
              const isActive = active === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setActive(m);
                    setOpenDossierId(null);
                    setCreatingDossier(false);
                  }}
                  className={
                    "group flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors " +
                    (isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted")
                  }
                >
                  <meta.Icon
                    className={
                      "mt-0.5 h-4 w-4 shrink-0 " +
                      (isActive ? "text-primary" : "text-muted-foreground")
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        "text-sm leading-tight " +
                        (isActive ? "font-semibold" : "font-medium")
                      }
                    >
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </nav>

          {/* Profil agent */}
          <div className="border-t border-border p-3">
            <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {persona ? initialsFromName(persona.prenomNom) : matricule?.slice(0, 2) ?? "??"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {persona?.prenomNom ?? matricule ?? "Agent"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {ROLE_LABEL[role] ?? role}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                    {matricule ?? "—"}
                  </span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    {persona?.classificationMax ?? classification}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 px-1 text-[10px] leading-tight text-muted-foreground">
              Session iCNS · verrouillage automatique après 15 min d'inactivité
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          {/* Sub-header du module actif */}
          <div className="border-b border-border bg-background px-6 py-4 md:px-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>iCNS</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{activeMeta.label}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <activeMeta.Icon className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold leading-tight">{activeMeta.label}</h2>
                  <p className="text-sm text-muted-foreground">{activeMeta.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-[11px]">
                  {role}
                </span>
                <span className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-[11px]">
                  {service}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar mobile (compact horizontal) */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden">
            {allowedModules.map((m) => {
              const meta = MODULE_META[m];
              const isActive = active === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setActive(m);
                    setOpenDossierId(null);
                    setCreatingDossier(false);
                  }}
                  className={
                    "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors " +
                    (isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "border border-border hover:bg-muted")
                  }
                >
                  <meta.Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </button>
              );
            })}
          </nav>

          {/* Module rendering */}
          <div className="px-6 py-6 md:px-8 md:py-8">
            {active === "dossiers" && (
              <>
                {creatingDossier && (
                  <NewDossierWizard
                    availableTypes={DEMO_TYPES}
                    onCreated={(id) => {
                      setCreatingDossier(false);
                      setOpenDossierId(id as Id<"dossiers_renseignement">);
                    }}
                    onCancel={() => setCreatingDossier(false)}
                  />
                )}
                {!creatingDossier && openDossierId && (
                  <DossierEditor
                    dossierId={openDossierId}
                    onClose={() => setOpenDossierId(null)}
                  />
                )}
                {!creatingDossier && !openDossierId && (
                  <DossierList
                    onOpen={(id) => setOpenDossierId(id as Id<"dossiers_renseignement">)}
                    onCreate={() => setCreatingDossier(true)}
                  />
                )}
              </>
            )}

            {active === "icom" && <CommunicationsHub />}

            {active === "sg-cockpit" && <SGCockpit />}

            {active === "cellule" && <CelluleModule />}
            {active === "audit" && <AuditModule />}
            {active === "admin" && <AdminModule />}
            {active === "archive" && <ArchiveModule />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Types de dossier de démonstration — utilisés tant que les vrais types
// (table `types_dossier`) ne sont pas seedés en base. La création échouera
// au moment de l'insertion si la base ne contient pas ces types.
const DEMO_TYPES = [
  {
    _id: "demo-mp" as Id<"types_dossier">,
    code: "MP",
    label: "Mise en cause Personnelle",
    classificationMin: "CD" as const,
  },
  {
    _id: "demo-rc" as Id<"types_dossier">,
    code: "RC",
    label: "Renseignement de Contre-ingérence",
    classificationMin: "SD" as const,
  },
  {
    _id: "demo-no" as Id<"types_dossier">,
    code: "NO",
    label: "Note d'Observation",
    classificationMin: "DR" as const,
  },
];

// Espace de travail iCNS — Hub par rôle (Phase 3+)
// Affiche les modules iCNS pertinents selon le rôle de l'utilisateur connecté.

import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
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
import { IDocumentWorkspace } from "@/components/idocument/IDocumentWorkspace";
import { ICorrespondanceSection } from "@/components/icorrespondance/ICorrespondanceSection";
import { IAstedSection } from "@/components/iasted/IAstedSection";
import { IAgendaSection } from "@/components/iagenda/IAgendaSection";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { IAstedPopup } from "@/components/iasted/IAstedPopup";
import { useSuperAdmin } from "@/contexts/SuperAdminContext";
import { usePublishPageContext, type PageContextSnapshot } from "@/lib/iasted";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Archive,
  Bot,
  Calendar,
  ChevronRight,
  FileText,
  Folder,
  LogOut,
  Mail,
  Moon,
  Network,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
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
  | "archive"
  | "idocument"
  | "icorrespondance"
  | "iasted"
  | "iagenda";

// Note : "dossiers" et "archive" sont absorbés par iDocument (qui inclut
// l'arbre des dossiers de renseignement + iArchive en sous-onglet).
// "icom" reste distinct car iCorrespondance gère le workflow d'approbation
// alors qu'iCom gère les communications inter-services en temps réel.
const MODULES_PAR_ROLE: Record<string, ModuleKey[]> = {
  officier_traitant: ["idocument", "icorrespondance", "icom", "iasted", "iagenda"],
  chef_section: ["idocument", "icorrespondance", "icom", "iasted", "iagenda"],
  directeur_service: ["idocument", "icorrespondance", "icom", "iasted", "iagenda"],
  analyste_cns: ["cellule", "idocument", "icorrespondance", "icom", "iasted", "iagenda"],
  sg_cns: ["sg-cockpit", "idocument", "icorrespondance", "icom", "iasted", "iagenda"],
  rssi: ["audit", "idocument", "icom", "iasted", "iagenda"],
  auditeur: ["audit", "idocument"],
  admin_technique: ["admin", "idocument", "icorrespondance", "iasted", "iagenda"],
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
  idocument: {
    label: "iDocument",
    description: "Gestion électronique de documents + iArchive",
    Icon: FileText,
  },
  icorrespondance: {
    label: "iCorrespondance",
    description: "Courriers officiels avec workflow d'approbation",
    Icon: Mail,
  },
  iasted: {
    label: "iAsted",
    description: "Agent intelligent : chat, appels, contacts, réunions",
    Icon: Bot,
  },
  iagenda: {
    label: "iAgenda",
    description: "Agenda officiel — événements, réunions, échéances",
    Icon: Calendar,
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

  // Migration : force la position du bouton spherique en bas-droite (v2).
  // Reinitialise toute position sauvegardee anterieurement (top-left, etc).
  useEffect(() => {
    const MIGRATION_KEY = "iasted-button-position-migrated-v2";
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.removeItem("iasted-button-position");
      localStorage.setItem(MIGRATION_KEY, "1");
    }
  }, []);

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

  // Hooks SuperAdmin — donne accès au bouton sphérique iAsted + modal chat
  const {
    openaiRTC,
    selectedVoice,
    isChatOpen,
    setIsChatOpen,
  } = useSuperAdmin();

  // Theme toggle (light/dark)
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";

  if (!isAuthenticated || !jwt || !role) {
    return null;
  }

  // Mémorisé pour éviter de recréer une nouvelle référence à chaque render
  // (sinon `iastedSnapshot` est rebuild et `usePublishPageContext` republie
  // en boucle, ce qui pollue le store et peut déstabiliser les abonnés).
  const allowedModules = useMemo(
    () => MODULES_PAR_ROLE[role] ?? (["idocument"] as ModuleKey[]),
    [role],
  );
  const classification = ROLE_CLASSIFICATION[role] ?? "CD";
  const activeMeta = MODULE_META[active];

  const handleLogout = () => {
    clearAuth("user_initiated");
    navigate("/icns/login", { replace: true });
  };

  const sessionEndsIn = expiresAt
    ? Math.max(0, Math.round((expiresAt - now.getTime()) / 60_000))
    : null;

  // Snapshot de contexte publié à iAsted : agent connaît le module actif,
  // les modules accessibles selon le rôle, et les actions exécutables ici.
  // L'agent vocal pourra ainsi répondre à « va au cockpit », « ouvre la cellule »,
  // « crée un dossier », « déconnecte-moi » sans dépendre des regex globales.
  const iastedSnapshot: PageContextSnapshot = useMemo(() => {
    const moduleEntities = allowedModules.map<{
      id: string;
      type: string;
      label: string;
      data?: Record<string, unknown>;
    }>((m) => ({
      id: m,
      type: "module_icns",
      label: MODULE_META[m].label,
      data: { active: m === active, description: MODULE_META[m].description },
    }));

    return {
      module: "Workspace iCNS",
      pathname: "/icns/workspace",
      title: `Workspace iCNS — ${MODULE_META[active].label}`,
      summary:
        `Rôle ${ROLE_LABEL[role] ?? role}, habilitation ${classification}. ` +
        `${allowedModules.length} modules accessibles, module actif : ${MODULE_META[active].label}.`,
      visibleEntities: moduleEntities,
      availableActions: [
        ...allowedModules.map((m) => ({
          id: `switch_module_${m}`,
          label: `Aller vers ${MODULE_META[m].label}`,
          description: `Bascule le module actif vers ${MODULE_META[m].label}.`,
          voiceTriggers: [
            MODULE_META[m].label.toLowerCase(),
            // Alias vocaux étoffés (singulier, pluriel, formes raccourcies)
            ...(m === "sg-cockpit" ? ["cockpit", "cockpit sg", "tableau strategique"] : []),
            ...(m === "cellule" ? ["cellule cns", "cellule centrale", "synthese", "syntheses"] : []),
            ...(m === "dossiers" ? ["dossier", "dossiers", "mes dossiers"] : []),
            ...(m === "idocument" ? ["i document", "documents", "document", "ged", "coffre", "pieces"] : []),
            ...(m === "icorrespondance" ? ["correspondance", "courrier", "courriers", "lettre", "lettres"] : []),
            ...(m === "icom" ? ["communications", "messages", "chat inter agences"] : []),
            ...(m === "iagenda" ? ["agenda", "calendrier", "rendez-vous", "evenements"] : []),
            ...(m === "audit" ? ["journal d'audit", "journal audit", "audit rssi", "rssi"] : []),
            ...(m === "archive" ? ["archives", "iarchive"] : []),
            ...(m === "admin" ? ["administration", "habilitations", "parametres techniques"] : []),
            ...(m === "iasted" ? ["module iasted", "appels", "contacts", "reunions"] : []),
          ],
          run: () => setActive(m),
        })),
        {
          id: "create_dossier",
          label: "Créer un dossier",
          description: "Ouvre l'assistant de création d'un nouveau dossier de renseignement.",
          voiceTriggers: ["créer un dossier", "nouveau dossier", "ouvrir un dossier"],
          run: () => {
            setActive("dossiers" as ModuleKey);
            setCreatingDossier(true);
          },
        },
        {
          id: "logout",
          label: "Se déconnecter",
          description: "Met fin à la session iCNS et redirige vers l'écran de login MFA.",
          requiresConfirmation: true,
          voiceTriggers: ["déconnecte-moi", "déconnexion", "quitter la session"],
          run: () => {
            clearAuth("voice_command");
            navigate("/icns/login", { replace: true });
          },
        },
        {
          id: "toggle_theme",
          label: "Basculer le thème",
          description: "Bascule entre le thème clair et le thème sombre.",
          voiceTriggers: ["bascule le thème", "change le thème", "mode sombre", "mode clair"],
          run: () => setTheme(isDark ? "light" : "dark"),
        },
      ],
    };
  }, [active, allowedModules, role, classification, clearAuth, navigate, isDark, setTheme]);

  usePublishPageContext(iastedSnapshot);

  return (
    <div className="dash-v2 min-h-screen bg-background text-foreground">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
              title={isDark ? "Mode clair" : "Mode sombre"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>

          {/* Actions mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Mode clair" : "Mode sombre"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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

            {/* Modules iCNS étendus */}
            {active === "idocument" && <IDocumentWorkspace />}
            {active === "icorrespondance" && <ICorrespondanceSection />}
            {active === "iasted" && <IAstedSection />}
            {active === "iagenda" && <IAgendaSection />}
          </div>
        </main>
      </div>

      {/* Bouton sphérique iAsted — accès rapide à l'agent depuis tout module */}
      <IAstedButtonFull
        voiceListening={openaiRTC.voiceState === "listening"}
        voiceSpeaking={openaiRTC.voiceState === "speaking"}
        voiceProcessing={
          openaiRTC.voiceState === "connecting" || openaiRTC.voiceState === "thinking"
        }
        audioLevel={openaiRTC.audioLevel}
        onClick={() => {
          if (openaiRTC.isConnected) {
            openaiRTC.disconnect();
          } else {
            // Connexion vocale rapide en mode démo (système prompt par défaut)
            openaiRTC.connect(selectedVoice, undefined);
          }
        }}
        onDoubleClick={() => setIsChatOpen(true)}
      />
      <IAstedPopup
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
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

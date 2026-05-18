// Espace de travail iCNS — Hub par rôle (Phase 3+)
// Affiche les modules iCNS pertinents selon le rôle de l'utilisateur connecté.

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useICNSAuth } from "@/auth/useICNSAuth";
import { ClassificationBanner } from "@/components/dossiers/ClassificationBanner";
import { DossierList } from "@/components/dossiers/DossierList";
import { DossierEditor } from "@/components/dossiers/DossierEditor";
import { NewDossierWizard } from "@/components/dossiers/NewDossierWizard";
import { CommunicationsHub } from "@/components/icom/CommunicationsHub";
import { SGCockpit } from "@/components/sg-cockpit/SGCockpit";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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

export default function ICNSWorkspace() {
  const navigate = useNavigate();
  const { jwt, role, service, isAuthenticated, clearAuth } = useICNSAuth();
  const [active, setActive] = useState<ModuleKey>("dossiers");
  const [openDossierId, setOpenDossierId] = useState<Id<"dossiers_renseignement"> | null>(null);
  const [creatingDossier, setCreatingDossier] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/icns/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!role) return;
    const allowed = MODULES_PAR_ROLE[role] ?? ["dossiers"];
    if (!allowed.includes(active)) setActive(allowed[0]);
  }, [role, active]);

  if (!isAuthenticated || !jwt || !role) {
    return null;
  }

  const allowedModules = MODULES_PAR_ROLE[role] ?? ["dossiers"];

  const handleLogout = () => {
    clearAuth("user_initiated");
    navigate("/icns/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClassificationBanner classification="CD" />

      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">iCNS — Conseil National de Sécurité</h1>
          <p className="text-xs text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5 font-mono">{role}</span>
            {" · "}
            <span className="font-mono">{service}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </header>

      <div className="flex">
        <aside className="w-56 border-r border-border bg-card/40 p-3">
          <nav className="space-y-1 text-sm">
            {allowedModules.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setActive(m);
                  setOpenDossierId(null);
                  setCreatingDossier(false);
                }}
                className={
                  "block w-full rounded-md px-3 py-2 text-left transition-colors " +
                  (active === m ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")
                }
              >
                {labelOf(m)}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
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

          {active === "cellule" && (
            <div className="rounded-md border border-border p-6">
              <h2 className="text-lg font-semibold">Cellule de coordination CNS</h2>
              <p className="text-sm text-muted-foreground">
                Outil de croisement multi-services et production de synthèses. UI complète à
                câbler à `convex/cns/crossing.ts` et `convex/cns/synthesis.ts` (Prompt 4.2).
              </p>
            </div>
          )}

          {active === "audit" && (
            <div className="rounded-md border border-border p-6">
              <h2 className="text-lg font-semibold">Audit & RSSI</h2>
              <p className="text-sm text-muted-foreground">
                Consultation du journal d'audit chaîné, vérification d'intégrité, gestion des
                déclassifications. À câbler à `convex/audit_verify.ts` et
                `convex/iarchive/declassification.ts`.
              </p>
            </div>
          )}

          {active === "admin" && (
            <div className="rounded-md border border-border p-6">
              <h2 className="text-lg font-semibold">Administration technique</h2>
              <p className="text-sm text-muted-foreground">
                Gestion des habilitations, services, types de dossier, schémas de référence.
                Sans accès aux contenus chiffrés.
              </p>
            </div>
          )}

          {active === "archive" && (
            <div className="rounded-md border border-border p-6">
              <h2 className="text-lg font-semibold">iArchive</h2>
              <p className="text-sm text-muted-foreground">
                Dossiers archivés (DR 5 ans / CD 10 / SD 30 / TSD 50). Workflow de
                déclassification accessible depuis ce module.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function labelOf(m: ModuleKey): string {
  return (
    {
      dossiers: "Mes dossiers",
      icom: "Communications",
      "sg-cockpit": "Cockpit SG-CNS",
      cellule: "Cellule CNS",
      audit: "Audit / RSSI",
      admin: "Administration",
      archive: "iArchive",
    } as const
  )[m];
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

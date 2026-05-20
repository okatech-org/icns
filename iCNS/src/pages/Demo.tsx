// Comptes de démonstration iCNS — vue exhaustive des 13 services + CNS central
// Référence : NTSAGUI/CNS/CDC/2026/001 §1.3
//
// 45 personas répartis en 4 catégories :
//   - Cellule CNS centrale (8) — SG, analystes, RSSI, auditeur, admin
//   - Services de renseignement (12) — B2, DGDI, DGR, DGSS
//   - Forces de défense (15) — GR, GN, FAG Terre/Air/Marine
//   - Administrations de sécurité (12) — POLICE, SILAM, DGSP, DOUANE
//
// La connexion ici est en mode "démo" — JWT stub en mémoire via
// useICNSAuth + redirect vers /icns/workspace. En production, l'accès
// passe obligatoirement par LoginCardReader (carte agent + PIN + biométrie).

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConvex, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  ArrowLeft,
  Lock,
  Moon,
  Sun,
  LogIn,
  Search as SearchIcon,
  Shield,
  ShieldAlert,
  Eye,
  Users,
  FileSignature,
  Search,
  Archive,
  Settings,
  Anchor,
  Plane,
  Swords,
  Scale,
  Truck,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useICNSAuth } from "@/auth/useICNSAuth";
import emblemGabon from "@/assets/emblem_gabon.png";
import {
  CATEGORIES,
  ICNS_PERSONAS,
  type Persona,
  type ServiceCategorie,
  personasByCategorie,
  uniqueServicesInCategorie,
} from "@/data/icns-personas";

// ──────────────────────────────────────────────────────────────────────
// Icônes par catégorie/role
// ──────────────────────────────────────────────────────────────────────

const ICONS: Record<Persona["iconKey"], React.ReactNode> = {
  shield: <Shield className="h-5 w-5" />,
  shieldAlert: <ShieldAlert className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  fileSignature: <FileSignature className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  archive: <Archive className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  anchor: <Anchor className="h-5 w-5" />,
  plane: <Plane className="h-5 w-5" />,
  swords: <Swords className="h-5 w-5" />,
  scale: <Scale className="h-5 w-5" />,
  truck: <Truck className="h-5 w-5" />,
};

const ROLE_COLOR: Record<Persona["role"], string> = {
  officier_traitant: "from-blue-500 to-blue-700",
  chef_section: "from-indigo-500 to-indigo-700",
  directeur_service: "from-purple-500 to-purple-700",
  analyste_cns: "from-emerald-500 to-emerald-700",
  sg_cns: "from-amber-500 to-red-600",
  rssi: "from-rose-500 to-rose-700",
  auditeur: "from-slate-500 to-slate-700",
  admin_technique: "from-cyan-500 to-cyan-700",
};

const ROLE_LABEL: Record<Persona["role"], string> = {
  officier_traitant: "Officier traitant",
  chef_section: "Chef de section",
  directeur_service: "Directeur",
  analyste_cns: "Analyste CNS",
  sg_cns: "SG-CNS",
  rssi: "RSSI",
  auditeur: "Auditeur",
  admin_technique: "Admin tech.",
};

// ──────────────────────────────────────────────────────────────────────
// Helpers mode démo local (Convex désactivé)
// ──────────────────────────────────────────────────────────────────────

const CONVEX_PLACEHOLDER_MARKERS = [
  "perfect-bullfrog",
  "example",
  "preview",
  "placeholder",
  "icns-convex-disabled",
  "localhost.invalid",
];

/**
 * Détecte si l'URL Convex active est un placeholder. Synchronisé avec
 * la même heuristique dans `main.tsx` : dans ce cas, le backend n'est
 * pas réellement joignable et on bascule sur un flow auth 100 % local.
 */
function isConvexDisabled(): boolean {
  const url = (import.meta.env.VITE_CONVEX_URL ?? "").toLowerCase();
  if (!url) return true;
  return CONVEX_PLACEHOLDER_MARKERS.some((m) => url.includes(m));
}

/** Encode un objet en base64url compact (sans padding) pour le JWT. */
function b64url(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Construit un JWT compact `header.payload.signature` 100 % local, avec
 * le matricule du persona dans `sub`. La signature est mockée — accepté
 * par `useICNSAuth.setAuth` (validation de forme uniquement), et permet
 * à `useCurrentPersona()` de retrouver le persona dans `ICNS_PERSONAS`
 * via le sub décodé.
 */
function makeLocalDemoJwt(matricule: string, expiresAt: number): string {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const payload = b64url({
    sub: matricule,
    exp: Math.floor(expiresAt / 1000),
    iss: "icns-demo-local",
  });
  const sig = `MOCK_${matricule.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  return `${header}.${payload}.${sig}`;
}

// ──────────────────────────────────────────────────────────────────────
// Composant
// ──────────────────────────────────────────────────────────────────────

const Demo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { setAuth } = useICNSAuth();
  const convex = useConvex();
  const authenticate = useMutation(api.auth.authenticate.authenticate);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ServiceCategorie>("cns_central");
  const [search, setSearch] = useState("");
  const [loadingMatricule, setLoadingMatricule] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Recherche transverse (toutes catégories) si une query est saisie
  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return null;
    return ICNS_PERSONAS.filter(
      (p) =>
        p.matricule.toLowerCase().includes(q) ||
        p.prenomNom.toLowerCase().includes(q) ||
        p.serviceCode.toLowerCase().includes(q) ||
        p.serviceLabel.toLowerCase().includes(q) ||
        p.fonction.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q),
    );
  }, [search]);

  const loginAsPersona = async (persona: Persona) => {
    setLoadingMatricule(persona.matricule);
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Si l'instance Convex est désactivée (URL placeholder détectée
    // dans main.tsx), on bascule sur un flow 100 % local : on génère un
    // JWT compact bien formé contenant le matricule dans `sub`. Le store
    // d'auth iCNS l'accepte (validation de forme uniquement), et tous les
    // modules locaux (coffre Zustand, Dossiers cellules, useCurrentPersona)
    // continuent à fonctionner.
    const convexDisabled = isConvexDisabled();

    try {
      if (convexDisabled) {
        const expiresAt = now + 8 * 3600 * 1000;
        const jwt = makeLocalDemoJwt(persona.matricule, expiresAt);
        setAuth({
          jwt,
          expiresAt,
          role: persona.role,
          service: persona.serviceCode,
        });
        toast({
          title: `Connecté · ${persona.prenomNom}`,
          description: `${ROLE_LABEL[persona.role]} · ${persona.serviceLabel} · ${persona.classificationMax} · mode démo local`,
        });
        navigate("/icns/workspace", { replace: true });
        return;
      }

      // ── Flow Convex standard ────────────────────────────────────────
      // 1) Récupérer un challenge frais (stateless côté serveur).
      const challenge = await convex.query(
        api.auth.authenticate.issueChallenge,
        {},
      );

      // 2) Construire un certificat factice valide accepté par le backend
      // en mode dev (issuer commence par "CN=PKI_SOUVERAINE"). La signature
      // est mockée par la convention `MOCK-SIGN:<challenge>`.
      const result = await authenticate({
        certificat: {
          matricule: persona.matricule,
          serialNumber: `DEMO-${persona.matricule}`,
          issuer: "CN=PKI_SOUVERAINE_DEMO",
          notBefore: now - ONE_YEAR,
          notAfter: now + ONE_YEAR,
        },
        challenge: challenge.challenge,
        challengeSigne: `MOCK-SIGN:${challenge.challenge}`,
        adresseIP: "127.0.0.1",
        poste: "DEMO-WEB",
      });

      setAuth({
        jwt: result.jwt,
        expiresAt: result.expiresAt,
        role: result.role,
        service: result.service,
      });
      toast({
        title: `Connecté · ${persona.prenomNom}`,
        description: `${ROLE_LABEL[persona.role]} · ${persona.serviceLabel} · ${persona.classificationMax}`,
      });
      navigate("/icns/workspace", { replace: true });
    } catch (err) {
      const msg = (err as Error).message ?? "Erreur inconnue";
      toast({
        title: "Connexion démo refusée",
        description: msg.includes("Authentification refusée")
          ? `Le persona ${persona.matricule} n'est pas seedé côté backend (lancer "convex run seed:seedICNSDemo").`
          : msg,
        variant: "destructive",
      });
    } finally {
      setLoadingMatricule(null);
    }
  };

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 transition-colors duration-300">
      <header className="sticky top-0 z-50 mb-6 rounded-lg border border-border bg-card/95 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="border border-input">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border p-2">
                <img src={emblemGabon} alt="Emblème" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-xl font-bold text-transparent">
                  Comptes Démo iCNS · Environnement global
                </h1>
                <p className="text-sm text-muted-foreground">
                  {ICNS_PERSONAS.length} personas · 13 services + cellule CNS centrale
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full border border-border">
            {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 pb-12 md:px-6">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Mode démonstration · données fictives · JWT stub en mémoire
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠ En production, l'authentification passe obligatoirement par <strong>carte agent + PIN + biométrie</strong>.{" "}
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="/icns/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/icns/login");
              }}
            >
              Essayer le vrai flux MFA →
            </a>
          </p>
        </div>

        {/* Recherche transverse */}
        <div className="mb-6 mx-auto max-w-2xl">
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, service, rôle…"
              className="w-full bg-transparent text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Effacer
              </button>
            )}
          </div>
          {searchHits && (
            <p className="mt-1 text-xs text-muted-foreground">
              {searchHits.length} résultat{searchHits.length > 1 ? "s" : ""} ·{" "}
              <button
                className="underline underline-offset-2"
                onClick={() => setSearch("")}
              >
                revenir à la vue par catégorie
              </button>
            </p>
          )}
        </div>

        {/* Tabs catégories ou résultats de recherche */}
        {!searchHits ? (
          <>
            <nav className="mb-6 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => {
                const count = personasByCategorie(c.key).length;
                const isActive = activeTab === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setActiveTab(c.key)}
                    className={
                      "rounded-md border px-4 py-2 text-sm font-medium transition-colors " +
                      (isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted")
                    }
                  >
                    {c.label}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <CategoryView categorie={activeTab} loadingMatricule={loadingMatricule} onLogin={loginAsPersona} />
          </>
        ) : (
          <PersonaGrid
            personas={searchHits}
            loadingMatricule={loadingMatricule}
            onLogin={loginAsPersona}
            compact
          />
        )}
      </main>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Vue par catégorie : description + groupement par service
// ──────────────────────────────────────────────────────────────────────

function CategoryView({
  categorie,
  loadingMatricule,
  onLogin,
}: {
  categorie: ServiceCategorie;
  loadingMatricule: string | null;
  onLogin: (p: Persona) => void;
}) {
  const meta = CATEGORIES.find((c) => c.key === categorie)!;
  const services = uniqueServicesInCategorie(categorie);
  const personas = personasByCategorie(categorie);

  if (categorie === "cns_central") {
    // Pas de groupement par service — affichage en grille directe
    return (
      <div>
        <p className="mx-auto mb-6 max-w-3xl text-center text-sm text-muted-foreground">
          {meta.description}
        </p>
        <PersonaGrid personas={personas} loadingMatricule={loadingMatricule} onLogin={onLogin} />
      </div>
    );
  }

  return (
    <div>
      <p className="mx-auto mb-6 max-w-3xl text-center text-sm text-muted-foreground">
        {meta.description}
      </p>
      <div className="space-y-8">
        {services.map((svc) => {
          const servicePersonas = personas.filter((p) => p.serviceCode === svc.code);
          return (
            <section key={svc.code}>
              <header className="mb-3 flex items-center gap-3">
                <h3 className="text-lg font-semibold">{svc.label}</h3>
                <Badge variant="outline" className="font-mono text-xs">
                  {svc.code}
                </Badge>
              </header>
              <PersonaGrid
                personas={servicePersonas}
                loadingMatricule={loadingMatricule}
                onLogin={onLogin}
                compact
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Grille de personas — variante compact (3 colonnes) ou standard (2 cols)
// ──────────────────────────────────────────────────────────────────────

function PersonaGrid({
  personas,
  loadingMatricule,
  onLogin,
  compact = false,
}: {
  personas: Persona[];
  loadingMatricule: string | null;
  onLogin: (p: Persona) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          : "mx-auto grid max-w-6xl gap-4 md:grid-cols-2"
      }
    >
      {personas.map((p) => (
        <PersonaCard
          key={p.matricule}
          persona={p}
          loading={loadingMatricule === p.matricule}
          onLogin={onLogin}
          compact={compact}
        />
      ))}
    </div>
  );
}

function PersonaCard({
  persona,
  loading,
  onLogin,
  compact,
}: {
  persona: Persona;
  loading: boolean;
  onLogin: (p: Persona) => void;
  compact: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md " +
        (compact ? "" : "p-5")
      }
    >
      <div className="mb-3 flex items-start gap-3">
        <div className={`rounded-md bg-gradient-to-br ${ROLE_COLOR[persona.role]} p-2 shadow`}>
          <span className="text-white">{ICONS[persona.iconKey]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{persona.prenomNom}</p>
          <p className="truncate text-xs text-muted-foreground">{persona.grade}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {ROLE_LABEL[persona.role]}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              {persona.matricule}
            </Badge>
            <ClassificationPill c={persona.classificationMax} />
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">Fonction :</span> {persona.fonction}
      </p>
      {!compact && (
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Périmètre BdC :</span> {persona.perimetreBdC}
        </p>
      )}

      <Button
        className="mt-auto w-full"
        size="sm"
        onClick={() => onLogin(persona)}
        disabled={loading}
      >
        <LogIn className="mr-2 h-3 w-3" />
        {loading ? "Connexion…" : "Se connecter"}
      </Button>
    </div>
  );
}

function ClassificationPill({ c }: { c: "DR" | "CD" | "SD" | "TSD" }) {
  const color = {
    DR: "bg-amber-500/20 text-amber-900 dark:text-amber-200",
    CD: "bg-orange-600/20 text-orange-900 dark:text-orange-200",
    SD: "bg-red-700/30 text-red-900 dark:text-red-200",
    TSD: "bg-fuchsia-900/40 text-fuchsia-100",
  }[c];
  return <span className={"rounded px-1.5 py-0.5 text-[10px] font-bold " + color}>{c}</span>;
}

export default Demo;

// Section Documents du Workspace iCNS — Coffre documentaire.
//
// Organisation : 5 sections (Système, Privés, Partagés avec moi, Service,
// CNS-wide). Le partage et la création passent par le store Zustand local
// (cf. `iDocVaultStore`).

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentPersona } from "@/auth/useCurrentPersona";
import {
  useCanShare,
  useEnsureVaultSeeded,
  useVisibleDocuments,
  useVisibleFolders,
} from "@/hooks/useIDocVault";
import { useIDocVaultStore } from "@/stores/iDocVaultStore";
import {
  ICNS_PERSONAS,
  type Persona,
} from "@/data/icns-personas";
import type { VaultFolder } from "@/types/idocument";
import type { VaultSection } from "@/lib/vaultAccess";
import { VaultFolderCard } from "./vault/VaultFolderCard";
import { VaultFileCard } from "./vault/VaultFileCard";
import { ViewModeToggle, type VaultViewMode } from "./vault/ViewModeToggle";
import { SourcePills, type SourceFilter } from "./vault/SourcePills";
import { NewFolderDialog } from "./vault/NewFolderDialog";
import { NewDocumentDialog } from "./vault/NewDocumentDialog";
import { FolderShareDialog } from "./vault/FolderShareDialog";

const SECTION_META: Record<
  VaultSection,
  { label: string; hint: string }
> = {
  system: { label: "Système", hint: "Dossiers techniques" },
  private: { label: "Privés", hint: "Visibles uniquement par vous" },
  shared_with_me: {
    label: "Partagés avec moi",
    hint: "Cibles : votre compte, votre rôle ou un service inclus",
  },
  service: { label: "Mon service", hint: "Tous les agents de votre service" },
  cellules: {
    label: "Dossiers cellules",
    hint: "Renseignement partagé par chaque cellule contributrice",
  },
  cns_wide: { label: "CNS-wide", hint: "Visibles par tout iCNS" },
};

const SECTION_ORDER: VaultSection[] = [
  "system",
  "private",
  "shared_with_me",
  "service",
  "cellules",
  "cns_wide",
];

function serviceLabelOf(persona: Persona, code: string): string | undefined {
  if (persona.serviceCode === code) return persona.serviceLabel;
  return ICNS_PERSONAS.find((p) => p.serviceCode === code)?.serviceLabel;
}

export function IDocumentSection() {
  useEnsureVaultSeeded();
  const persona = useCurrentPersona();
  const { bySection, all } = useVisibleFolders();
  const canShareGranted = useCanShare();
  const trashFolder = useIDocVaultStore((s) => s.trashFolder);
  const documents = useVisibleDocuments(null);

  const [view, setView] = useState<VaultViewMode>("grid");
  const [source, setSource] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<VaultFolder | null>(null);
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);

  // Documents du dossier actuellement ouvert (vue détail).
  const openedFolderDocs = useVisibleDocuments(openedFolderId);
  const openedFolder = useMemo(
    () =>
      openedFolderId
        ? useIDocVaultStore.getState().folders.find((f) => f.id === openedFolderId) ?? null
        : null,
    [openedFolderId],
  );
  const filteredOpenedDocs = useMemo(() => {
    let docs = openedFolderDocs;
    if (source !== "all") docs = docs.filter((d) => d.source === source);
    const q = search.trim().toLowerCase();
    if (q) {
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return docs;
  }, [openedFolderDocs, source, search]);

  const filteredBySection = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && source === "all") return bySection;
    const next: Record<VaultSection, VaultFolder[]> = {
      system: [],
      private: [],
      shared_with_me: [],
      service: [],
      cellules: [],
      cns_wide: [],
    };
    for (const section of SECTION_ORDER) {
      next[section] = bySection[section].filter((f) => {
        if (q && !f.name.toLowerCase().includes(q)) return false;
        return true;
      });
    }
    return next;
  }, [bySection, search, source]);

  const totalVisibleDocs = useMemo(() => {
    if (source === "all") return documents.length;
    return documents.filter((d) => d.source === source).length;
  }, [documents, source]);

  if (!persona) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Session non reconnue. Veuillez vous reconnecter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de tête */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">iDocument</h2>
            <p className="text-xs text-muted-foreground">
              {totalVisibleDocs} document{totalVisibleDocs > 1 ? "s" : ""}
              {" · "}
              {all.length} dossier{all.length > 1 ? "s" : ""} visibles
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nouveau dossier
          </Button>
          <Button size="sm" onClick={() => setNewDocOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nouveau document
          </Button>
        </div>
      </header>

      {/* Barre filtres */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/40 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un dossier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <SourcePills value={source} onChange={setSource} />
        <ViewModeToggle value={view} onChange={setView} />
      </div>

      {/* Fil d'Ariane si on est dans un dossier */}
      {openedFolder && (
        <nav className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => setOpenedFolderId(null)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            iDocument
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-semibold text-foreground">{openedFolder.name}</span>
        </nav>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* Vue DÉTAIL d'un dossier ouvert (drill-down)                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      {openedFolder ? (
        <section className="space-y-3">
          <header className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-3 py-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold">{openedFolder.name}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {filteredOpenedDocs.length} document{filteredOpenedDocs.length > 1 ? "s" : ""}
              </span>
              {openedFolder.tags.length > 0 && (
                <div className="hidden flex-wrap gap-1 sm:flex">
                  {openedFolder.tags.map((t) => (
                    <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>
          {filteredOpenedDocs.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-3 h-6 w-6 opacity-40" />
              Aucun document dans ce dossier. Utilisez <span className="font-medium">Nouveau document</span> pour en importer un.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredOpenedDocs.map((doc) => (
                <VaultFileCard
                  key={doc.id}
                  document={doc}
                  fileUrl={doc.fileUrl ?? null}
                  onOpen={(d) => {
                    if (d.fileUrl) window.open(d.fileUrl, "_blank", "noopener");
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
      <div className="space-y-6">
        {SECTION_ORDER.map((section) => {
          const folders = filteredBySection[section];
          if (folders.length === 0) return null;
          const meta = SECTION_META[section];
          return (
            <section key={section} aria-label={meta.label}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {meta.label}
                </h3>
                <span className="text-[10px] text-muted-foreground/70">
                  {meta.hint}
                </span>
              </div>
              <div
                className={
                  view === "list"
                    ? "grid grid-cols-1 gap-1"
                    : "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                }
              >
                {folders.map((f) => (
                  <VaultFolderCard
                    key={f.id}
                    folder={f}
                    serviceLabel={
                      f.visibility.kind === "service"
                        ? serviceLabelOf(persona, f.visibility.service)
                        : undefined
                    }
                    onOpen={(folder) => setOpenedFolderId(folder.id)}
                    onShare={
                      canShareGranted && !f.isSystem
                        ? (folder) => setShareTarget(folder)
                        : undefined
                    }
                    onTrash={
                      !f.isSystem && f.ownerMatricule === persona.matricule
                        ? (folder) => trashFolder(folder.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}

        {all.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucun dossier visible avec votre habilitation ({persona.classificationMax}).
          </div>
        )}
      </div>
      )}

      <NewFolderDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        persona={persona}
      />
      <NewDocumentDialog
        open={newDocOpen}
        onOpenChange={setNewDocOpen}
        persona={persona}
      />
      <FolderShareDialog
        open={shareTarget !== null}
        onOpenChange={(o) => !o && setShareTarget(null)}
        folder={shareTarget}
      />
    </div>
  );
}

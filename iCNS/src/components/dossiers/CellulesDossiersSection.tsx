// Tab « Dossiers de renseignement » — vue par cellule contributrice.
//
// Logique métier (alignée sur la décision du Conseil National de Sécurité) :
//   • un dossier par cellule contributrice (B2, DGDI, DGR, DGSS, GR, GN,
//     FAGT, FAGA, FAGM, POL, SILAM, DGSP, DOUANE)
//   • un agent de cellule voit UNIQUEMENT le dossier de sa cellule
//   • un agent CNS central voit les 13 dossiers (rôle de coordination)
//
// Présentation : alignée sur la section « Documents » du même workspace —
// chaque cellule s'affiche comme un VaultFolderCard macOS, et le drill-down
// affiche les renseignements en VaultFileCard (vignettes A4 portrait).
// La cohérence visuelle entre les deux tabs est ainsi garantie.

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, FileText, FolderLock, Inbox, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCurrentPersona } from "@/auth/useCurrentPersona";
import {
  useEnsureVaultSeeded,
  useVisibleDocuments,
  useVisibleFolders,
} from "@/hooks/useIDocVault";
import { ICNS_PERSONAS } from "@/data/icns-personas";
import type { VaultFolder } from "@/types/idocument";
import { VaultFolderCard } from "@/components/idocument/vault/VaultFolderCard";
import { VaultFileCard } from "@/components/idocument/vault/VaultFileCard";

function serviceMetaOf(serviceCode: string): { label: string; director?: string } {
  const persona = ICNS_PERSONAS.find((p) => p.serviceCode === serviceCode);
  return {
    label: persona?.serviceLabel ?? serviceCode,
    director: ICNS_PERSONAS.find(
      (p) => p.serviceCode === serviceCode && p.role === "directeur_service",
    )?.prenomNom,
  };
}

export function CellulesDossiersSection() {
  useEnsureVaultSeeded();
  const persona = useCurrentPersona();
  const { all } = useVisibleFolders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // On ne prend que les dossiers qui matérialisent une cellule
  // (visibility.service === <serviceCode>).
  const celluleFolders = useMemo(
    () =>
      all.filter(
        (f) => f.visibility.kind === "service" && f.id.startsWith("cellule-"),
      ),
    [all],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return celluleFolders;
    return celluleFolders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [celluleFolders, search]);

  const selected = useMemo(
    () => (selectedId ? celluleFolders.find((f) => f.id === selectedId) ?? null : null),
    [celluleFolders, selectedId],
  );

  if (!persona) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Session non reconnue. Veuillez vous reconnecter.
      </div>
    );
  }

  if (selected) {
    return <CelluleDetailView folder={selected} onBack={() => setSelectedId(null)} />;
  }

  const isCNSCentral = persona.categorie === "cns_central";

  return (
    <div className="space-y-4">
      {/* En-tête aligné avec IDocumentSection ─────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FolderLock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              Dossiers de renseignement
            </h2>
            <p className="text-xs text-muted-foreground">
              {isCNSCentral
                ? `${celluleFolders.length} cellule${celluleFolders.length > 1 ? "s" : ""} contributrice${celluleFolders.length > 1 ? "s" : ""} · vue Secrétariat CNS`
                : `Cellule ${persona.serviceLabel}`}
            </p>
          </div>
        </div>
      </header>

      {/* Barre filtres aligné avec IDocumentSection ──────────────────── */}
      {isCNSCentral && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/40 p-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une cellule ou un tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      {/* Section « Dossiers cellules » avec titre uppercase comme IDocumentSection */}
      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <FolderLock className="mx-auto mb-3 h-6 w-6 opacity-40" />
          Aucun dossier-cellule accessible avec votre habilitation ({persona.classificationMax}).
        </div>
      ) : (
        <section aria-label="Dossiers cellules">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dossiers cellules
            </h3>
            <span className="text-[10px] text-muted-foreground/70">
              Renseignement partagé par chaque cellule contributrice
            </span>
          </div>
          {/* Grille macOS-like : 2 / 3 / 4 / 5 / 6 colonnes (identique IDocumentSection). */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((folder) => {
              const serviceCode =
                folder.visibility.kind === "service" ? folder.visibility.service : "";
              const meta = serviceMetaOf(serviceCode);
              return (
                <VaultFolderCard
                  key={folder.id}
                  folder={folder}
                  serviceLabel={meta.label}
                  onOpen={(f) => setSelectedId(f.id)}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Vue détail d'une cellule (renseignements partagés) — alignée sur le
// drill-down de IDocumentSection (VaultFileCard A4 portrait).
// ──────────────────────────────────────────────────────────────────────

function CelluleDetailView({
  folder,
  onBack,
}: {
  folder: VaultFolder;
  onBack: () => void;
}) {
  const docs = useVisibleDocuments(folder.id);
  const serviceCode = folder.visibility.kind === "service" ? folder.visibility.service : "";
  const meta = useMemo(() => serviceMetaOf(serviceCode), [serviceCode]);

  return (
    <div className="space-y-4">
      {/* Fil d'Ariane aligné avec IDocumentSection */}
      <nav className="flex items-center gap-1.5 text-sm">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dossiers de renseignement
        </button>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-semibold text-foreground">{folder.name}</span>
      </nav>

      <section className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-3 py-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold">{folder.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {docs.length} renseignement{docs.length > 1 ? "s" : ""}
            </span>
            {meta.director && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Dir. {meta.director}</span>
              </>
            )}
            {folder.tags.length > 0 && (
              <div className="hidden flex-wrap gap-1 sm:flex">
                {folder.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {docs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Aucun renseignement partagé par cette cellule pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {docs.map((doc) => (
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

      {/* Note discrète sur le service pour rappeler le contexte. */}
      <p className="text-[11px] text-muted-foreground/80">
        Source : {meta.label}
        {meta.director ? ` · Directeur ${meta.director}` : ""}
      </p>
    </div>
  );
}

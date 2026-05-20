// Dialog de partage d'un dossier vault.
//
// Quatre tabs :
//   - Comptes  : multi-select des matricules (recherche libre)
//   - Rôles    : checkbox des rôles iCNS
//   - Services : checkbox des serviceCode uniques (catalogue ICNS_PERSONAS)
//   - CNS-wide : toggle exclusif
//
// Mode CNS-wide écrase tout : si activé, la visibilité finale = {cns_wide}.
// Sinon, si au moins une cible est sélectionnée → visibility = shared.
// Sinon → visibility = private.

import { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ICNS_PERSONAS,
  type Persona,
  type RoleICNS,
} from "@/data/icns-personas";
import type { VaultFolder, VaultVisibility } from "@/types/idocument";
import { useIDocVaultStore } from "@/stores/iDocVaultStore";

const ALL_ROLES: Array<{ value: RoleICNS; label: string }> = [
  { value: "officier_traitant", label: "Officiers traitants" },
  { value: "chef_section", label: "Chefs de section" },
  { value: "directeur_service", label: "Directeurs de service" },
  { value: "analyste_cns", label: "Analystes CNS" },
  { value: "sg_cns", label: "Secrétariat Général CNS" },
  { value: "rssi", label: "RSSI" },
  { value: "auditeur", label: "Auditeurs" },
  { value: "admin_technique", label: "Admins techniques" },
];

function listUniqueServices(): Array<{ code: string; label: string }> {
  const map = new Map<string, string>();
  for (const p of ICNS_PERSONAS) {
    if (!map.has(p.serviceCode)) map.set(p.serviceCode, p.serviceLabel);
  }
  return Array.from(map.entries())
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

interface FolderShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: VaultFolder | null;
}

export function FolderShareDialog({
  open,
  onOpenChange,
  folder,
}: FolderShareDialogProps) {
  const updateSharing = useIDocVaultStore((s) => s.updateFolderSharing);

  const [matricules, setMatricules] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<Set<RoleICNS>>(new Set());
  const [services, setServices] = useState<Set<string>>(new Set());
  const [cnsWide, setCnsWide] = useState(false);
  const [query, setQuery] = useState("");

  const allServices = useMemo(listUniqueServices, []);

  // Hydrate l'état local depuis la visibilité actuelle du dossier.
  useEffect(() => {
    if (!folder) return;
    const v = folder.visibility;
    setMatricules(
      new Set(v.kind === "shared" ? v.matricules : []),
    );
    setRoles(new Set(v.kind === "shared" ? v.roles : []));
    setServices(
      new Set(
        v.kind === "shared"
          ? v.services
          : v.kind === "service"
            ? [v.service]
            : [],
      ),
    );
    setCnsWide(v.kind === "cns_wide");
    setQuery("");
  }, [folder]);

  const filteredPersonas = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? ICNS_PERSONAS.filter(
          (p) =>
            p.prenomNom.toLowerCase().includes(q) ||
            p.matricule.toLowerCase().includes(q) ||
            p.serviceCode.toLowerCase().includes(q),
        )
      : ICNS_PERSONAS;
    // Affiche les sélectionnés en haut.
    return [...arr].sort((a, b) => {
      const sa = matricules.has(a.matricule) ? 0 : 1;
      const sb = matricules.has(b.matricule) ? 0 : 1;
      return sa - sb || a.prenomNom.localeCompare(b.prenomNom, "fr");
    });
  }, [query, matricules]);

  if (!folder) return null;

  const totalTargets = matricules.size + roles.size + services.size;

  const handleSave = () => {
    let next: VaultVisibility;
    if (cnsWide) {
      next = { kind: "cns_wide" };
    } else if (totalTargets === 0) {
      next = { kind: "private" };
    } else {
      next = {
        kind: "shared",
        matricules: Array.from(matricules),
        roles: Array.from(roles),
        services: Array.from(services),
      };
    }
    updateSharing(folder.id, next);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Partager : « {folder.name} »</DialogTitle>
          <DialogDescription>
            Choisissez les cibles autorisées. Toute cible doit aussi avoir
            l'habilitation ≥ {folder.classification} pour accéder.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="comptes">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comptes">Comptes</TabsTrigger>
            <TabsTrigger value="roles">Rôles</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="cns">CNS-wide</TabsTrigger>
          </TabsList>

          {/* COMPTES */}
          <TabsContent value="comptes" className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, matricule, service)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
                disabled={cnsWide}
              />
            </div>
            <ScrollArea className="h-72 rounded-md border border-border">
              <ul className="divide-y divide-border">
                {filteredPersonas.map((p) => {
                  const checked = matricules.has(p.matricule);
                  return (
                    <li key={p.matricule}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50">
                        <Checkbox
                          checked={checked}
                          disabled={cnsWide}
                          onCheckedChange={(v) => {
                            setMatricules((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(p.matricule);
                              else next.delete(p.matricule);
                              return next;
                            });
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.prenomNom}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            <span className="font-mono">{p.matricule}</span>
                            {" · "}
                            {p.role}
                            {" · "}
                            {p.classificationMax}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
                {filteredPersonas.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                    Aucun agent ne correspond.
                  </li>
                )}
              </ul>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              {matricules.size} compte(s) sélectionné(s).
            </p>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles" className="mt-3">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ALL_ROLES.map((r) => {
                const checked = roles.has(r.value);
                return (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={cnsWide}
                      onCheckedChange={(v) => {
                        setRoles((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(r.value);
                          else next.delete(r.value);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm">{r.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Toute personne occupant l'un de ces rôles aura accès.
            </p>
          </TabsContent>

          {/* SERVICES */}
          <TabsContent value="services" className="mt-3">
            <ScrollArea className="h-72 rounded-md border border-border">
              <ul className="divide-y divide-border">
                {allServices.map((s) => {
                  const checked = services.has(s.code);
                  return (
                    <li key={s.code}>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/50">
                        <Checkbox
                          checked={checked}
                          disabled={cnsWide}
                          onCheckedChange={(v) => {
                            setServices((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(s.code);
                              else next.delete(s.code);
                              return next;
                            });
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{s.label}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {s.code}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </TabsContent>

          {/* CNS-WIDE */}
          <TabsContent value="cns" className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="cns-toggle" className="text-sm font-medium">
                  Visible par tout iCNS
                </Label>
                <p className="text-xs text-muted-foreground">
                  Active le mode CNS-wide. Écrase les sélections par compte,
                  rôle et service.
                </p>
              </div>
              <Switch
                id="cns-toggle"
                checked={cnsWide}
                onCheckedChange={setCnsWide}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <div className="mr-auto text-xs text-muted-foreground">
            {cnsWide
              ? "Visibilité : CNS-wide"
              : totalTargets === 0
                ? "Visibilité : privée (aucune cible)"
                : `Visibilité : partagée (${totalTargets} cible(s))`}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

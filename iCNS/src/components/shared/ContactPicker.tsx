// Sélecteur de contact iCNS — autocomplete sur les 47 personas du catalogue.
//
// Utilisé par iCorrespondance (destinataire), iAsted (participants à une
// réunion), iAgenda (organisateur), etc. Quand on sélectionne un persona,
// les callbacks de saisie libre (nom / organisation / email) sont
// automatiquement remplis, mais l'utilisateur peut toujours les modifier
// (ex. correspondance externe à un destinataire inconnu du catalogue).

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    ICNS_PERSONAS,
    type Persona,
    type ServiceCategorie,
} from "@/data/icns-personas";

const CATEGORY_LABEL: Record<ServiceCategorie, string> = {
    cns_central: "Cellule CNS centrale",
    renseignement: "Services de renseignement",
    force_defense: "Forces de défense",
    securite_admin: "Administrations de sécurité",
};

interface ContactPickerProps {
    /** Persona courant sélectionné (matricule ou null). */
    value: string | null;
    /** Appelé quand un persona est choisi (ou retiré). */
    onChange: (persona: Persona | null) => void;
    /** Forcer un placeholder personnalisé. */
    placeholder?: string;
    /** Liste à utiliser (par défaut : ICNS_PERSONAS). */
    personas?: Persona[];
    /** Exclure certains matricules (ex. masquer l'expéditeur courant). */
    excludeMatricules?: string[];
    className?: string;
    disabled?: boolean;
}

export function ContactPicker({
    value,
    onChange,
    placeholder = "Rechercher un agent (nom, matricule, service)…",
    personas = ICNS_PERSONAS,
    excludeMatricules,
    className,
    disabled,
}: ContactPickerProps) {
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!excludeMatricules?.length) return personas;
        return personas.filter((p) => !excludeMatricules.includes(p.matricule));
    }, [personas, excludeMatricules]);

    const byCategory = useMemo(() => {
        const map = new Map<ServiceCategorie, Persona[]>();
        for (const p of filtered) {
            if (!map.has(p.categorie)) map.set(p.categorie, []);
            map.get(p.categorie)!.push(p);
        }
        return map;
    }, [filtered]);

    const selected = useMemo(
        () => (value ? personas.find((p) => p.matricule === value) ?? null : null),
        [personas, value],
    );

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="flex-1 justify-between font-normal"
                    >
                        {selected ? (
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{selected.prenomNom}</span>
                                <span className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                                    {selected.matricule}
                                </span>
                            </span>
                        ) : (
                            <span className="truncate text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-60" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Rechercher (nom, matricule, service, rôle)…" />
                        <CommandList className="max-h-80">
                            <CommandEmpty>Aucun contact trouvé.</CommandEmpty>
                            {Array.from(byCategory.entries()).map(([cat, list]) => (
                                <CommandGroup key={cat} heading={CATEGORY_LABEL[cat]}>
                                    {list.map((p) => {
                                        const haystack =
                                            `${p.prenomNom} ${p.matricule} ${p.serviceCode} ${p.serviceLabel} ${p.role} ${p.fonction}`;
                                        return (
                                            <CommandItem
                                                key={p.matricule}
                                                value={haystack}
                                                onSelect={() => {
                                                    onChange(p);
                                                    setOpen(false);
                                                }}
                                                className="flex items-start gap-2"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                                                        value === p.matricule ? "opacity-100" : "opacity-0",
                                                    )}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {p.prenomNom}
                                                    </p>
                                                    <p className="truncate text-[11px] text-muted-foreground">
                                                        <span className="font-mono">{p.matricule}</span>
                                                        {" · "}
                                                        {p.serviceLabel}
                                                    </p>
                                                    <p className="truncate text-[10px] text-muted-foreground/80">
                                                        {p.fonction} · {p.role} · {p.classificationMax}
                                                    </p>
                                                </div>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selected && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(null)}
                    aria-label="Retirer le contact sélectionné"
                    disabled={disabled}
                    className="h-9 w-9 shrink-0"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}

/**
 * Génère une adresse e-mail démo lisible à partir du persona, utilisable
 * comme placeholder dans les correspondances internes (aucun envoi réel).
 */
export function demoEmailForPersona(p: Persona): string {
    const [first, ...rest] = p.prenomNom
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s.replace(/[^A-Za-zÀ-ÿ]/g, ""));
    const last = rest.length > 0 ? rest[rest.length - 1] : first ?? "";
    const localPart = `${(first ?? "").charAt(0)}.${last}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    const domain = p.serviceCode.toLowerCase().replace(/_/g, "-");
    return `${localPart}@${domain}.icns.ga`;
}

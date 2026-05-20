// Dialog de création de dossier vault.
//
// Champs : nom, classification (DR/CD/SD/TSD), visibilité (radio
// privé/service/cns_wide ; le mode `shared` se règle après création via
// FolderShareDialog), tags initiaux (CSV).

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Classification, Persona } from "@/data/icns-personas";
import type { VaultVisibility } from "@/types/idocument";
import { useIDocVaultStore } from "@/stores/iDocVaultStore";

const CLASSIFICATIONS: Array<{ value: Classification; label: string }> = [
  { value: "DR", label: "DR — Diffusion Restreinte" },
  { value: "CD", label: "CD — Confidentiel Défense" },
  { value: "SD", label: "SD — Secret Défense" },
  { value: "TSD", label: "TSD — Très Secret Défense" },
];

const CLASSIFICATION_RANK: Record<Classification, number> = {
  DR: 1,
  CD: 2,
  SD: 3,
  TSD: 4,
};

const schema = z.object({
  name: z.string().min(2, "Au moins 2 caractères").max(80),
  classification: z.enum(["DR", "CD", "SD", "TSD"]),
  visibilityKind: z.enum(["private", "service", "cns_wide"]),
  tagsCsv: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona;
}

export function NewFolderDialog({ open, onOpenChange, persona }: NewFolderDialogProps) {
  const createFolder = useIDocVaultStore((s) => s.createFolder);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      classification: "DR",
      visibilityKind: "private",
      tagsCsv: "",
    },
  });

  const visibilityKind = watch("visibilityKind");
  const classification = watch("classification");

  const onSubmit = (values: FormValues) => {
    // Garde-fou : un agent ne peut pas créer un dossier dont la
    // classification dépasse sa propre habilitation maximale.
    if (
      CLASSIFICATION_RANK[values.classification] >
      CLASSIFICATION_RANK[persona.classificationMax]
    ) {
      toast.error(
        `Votre habilitation (${persona.classificationMax}) ne permet pas de créer un dossier ${values.classification}.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      let visibility: VaultVisibility;
      switch (values.visibilityKind) {
        case "private":
          visibility = { kind: "private" };
          break;
        case "service":
          visibility = { kind: "service", service: persona.serviceCode };
          break;
        case "cns_wide":
          visibility = { kind: "cns_wide" };
          break;
      }
      const tags = (values.tagsCsv ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const folder = createFolder({
        name: values.name,
        classification: values.classification,
        visibility,
        tags,
        ownerMatricule: persona.matricule,
      });
      toast.success(`Dossier « ${folder.name} » créé.`);
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
          <DialogDescription>
            Vos dossiers sont privés par défaut. Vous pourrez les partager
            ensuite (réservé chef de section et plus).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Nom du dossier</Label>
            <Input id="folder-name" autoFocus {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="folder-classification">Classification</Label>
            <Select
              value={classification}
              onValueChange={(v) =>
                setValue("classification", v as Classification, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="folder-classification">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATIONS.map((c) => {
                  const disabled =
                    CLASSIFICATION_RANK[c.value] >
                    CLASSIFICATION_RANK[persona.classificationMax];
                  return (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      disabled={disabled}
                    >
                      {c.label} {disabled && "— (au-dessus de votre habilitation)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Visibilité initiale</Label>
            <RadioGroup
              value={visibilityKind}
              onValueChange={(v) =>
                setValue("visibilityKind", v as FormValues["visibilityKind"], {
                  shouldValidate: true,
                })
              }
              className="space-y-1.5"
            >
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 hover:bg-muted/50">
                <RadioGroupItem value="private" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Privé</p>
                  <p className="text-xs text-muted-foreground">
                    Visible uniquement par vous.
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 hover:bg-muted/50">
                <RadioGroupItem value="service" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    Service ({persona.serviceLabel})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tous les agents de votre service avec habilitation
                    suffisante.
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 hover:bg-muted/50">
                <RadioGroupItem value="cns_wide" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">CNS-wide</p>
                  <p className="text-xs text-muted-foreground">
                    Tous les agents iCNS authentifiés (habilitation requise).
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="folder-tags">Tags (séparés par des virgules)</Label>
            <Input
              id="folder-tags"
              placeholder="ex. opération, frontière, urgent"
              {...register("tagsCsv")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Création…" : "Créer le dossier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

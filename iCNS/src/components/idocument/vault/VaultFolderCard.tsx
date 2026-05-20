// Carte dossier macOS-like : icône SVG jaune, nom, compteurs, badges
// classification + visibilité, menu hover (Ouvrir / Partager).
//
// Le bouton « Partager » apparaît uniquement si `onShare` est fourni
// (le parent décide en fonction de canShare(persona)).

import { MoreVertical, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VaultFolder } from "@/types/idocument";
import { DynamicFolderIcon } from "./DynamicFolderIcon";
import { ClassificationDot } from "./ClassificationDot";
import { FolderVisibilityBadge } from "./FolderVisibilityBadge";

interface VaultFolderCardProps {
  folder: VaultFolder;
  serviceLabel?: string;
  onOpen?: (folder: VaultFolder) => void;
  onShare?: (folder: VaultFolder) => void;
  onTrash?: (folder: VaultFolder) => void;
  /** Si true, désactive les interactions et grise la carte (poubelle). */
  trashed?: boolean;
}

export function VaultFolderCard({
  folder,
  serviceLabel,
  onOpen,
  onShare,
  onTrash,
  trashed,
}: VaultFolderCardProps) {
  const hasMenu = !!(onShare || onTrash);

  return (
    <div
      className={
        "group relative flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 transition-colors " +
        (trashed
          ? "opacity-60"
          : "hover:border-border hover:bg-muted/40 focus-within:border-border")
      }
    >
      {/* Badges visibilité en haut à gauche, menu en haut à droite */}
      <div className="absolute left-2 right-2 top-2 flex items-start justify-between">
        <FolderVisibilityBadge
          visibility={folder.visibility}
          serviceLabel={serviceLabel}
        />
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Actions sur ${folder.name}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onShare && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(folder);
                  }}
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" /> Partager
                </DropdownMenuItem>
              )}
              {onTrash && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrash(folder);
                  }}
                >
                  Mettre à la corbeille
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(folder)}
        className="mt-6 flex flex-col items-center gap-1 rounded text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Ouvrir le dossier ${folder.name}`}
      >
        <DynamicFolderIcon className="h-16 w-20" />
        <p className="line-clamp-2 max-w-[10rem] text-sm font-medium leading-tight">
          {folder.name}
        </p>
      </button>

      <div className="flex items-center gap-1.5">
        <ClassificationDot classification={folder.classification} variant="chip" />
        <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {folder.documentCount} doc{folder.documentCount > 1 ? "s" : ""}
        </span>
      </div>

      {folder.tags.length > 0 && (
        <div className="flex max-w-full flex-wrap justify-center gap-1">
          {folder.tags.slice(0, 3).map((t) => (
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
  );
}

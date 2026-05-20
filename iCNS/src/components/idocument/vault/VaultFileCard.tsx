// Carte fichier vault — vignette A4 portrait avec aperçu PDF / image
// natif et overlays (classification, menu contextuel, statut).

import { FileText, FileType, Image as ImageIcon, Clock } from "lucide-react";
import { DocumentSheet } from "@/components/shared/DocumentSheet";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { VaultDocument } from "@/types/idocument";
import { ClassificationDot } from "./ClassificationDot";

interface VaultFileCardProps {
    document: VaultDocument;
    /** URL temporaire blob (mode démo) ou URL signée Supabase. */
    fileUrl?: string | null;
    onOpen?: (doc: VaultDocument) => void;
    contextMenu?: ReactNode;
    isSelected?: boolean;
    className?: string;
}

function isPdfMime(mime?: string, name?: string): boolean {
    if (mime === "application/pdf") return true;
    if (name && /\.pdf$/i.test(name)) return true;
    return false;
}

function isImageMime(mime?: string, name?: string): boolean {
    if (mime?.startsWith("image/")) return true;
    if (name && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)) return true;
    return false;
}

function FileIconForType({
    mime,
    name,
    size = 64,
}: {
    mime?: string;
    name?: string;
    size?: number;
}) {
    if (isImageMime(mime, name)) {
        return <ImageIcon size={size} strokeWidth={1.5} className="text-stone-500" />;
    }
    if (isPdfMime(mime, name)) {
        return <FileText size={size} strokeWidth={1.5} className="text-red-600" />;
    }
    const ext = name?.split(".").pop()?.toLowerCase();
    if (ext === "doc" || ext === "docx") {
        return <FileType size={size} strokeWidth={1.5} className="text-blue-600" />;
    }
    return <FileText size={size} strokeWidth={1.5} className="text-stone-500" />;
}

function formatBytes(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

function formatShortDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function VaultFileCard({
    document,
    fileUrl,
    onOpen,
    contextMenu,
    isSelected,
    className,
}: VaultFileCardProps) {
    const isPdf = isPdfMime(document.mimeType, document.title);
    const isImage = isImageMime(document.mimeType, document.title);

    const overlays = (
        <>
            <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
                <ClassificationDot classification={document.classification} variant="chip" />
            </div>
            {contextMenu && (
                <div
                    className="pointer-events-auto absolute right-1.5 top-1.5 z-20 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu}
                </div>
            )}
            {/* Bandeau bas : titre + date + taille */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-2 text-[10px] text-white">
                <p className="truncate font-medium leading-tight" title={document.title}>
                    {document.title}
                </p>
                <p className="flex items-center justify-between gap-1 text-[9px] opacity-85">
                    <span className="inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatShortDate(document.updatedAt)}
                    </span>
                    {document.size != null && <span>{formatBytes(document.size)}</span>}
                </p>
            </div>
        </>
    );

    // ── Rendu PDF natif via <embed> : fonctionne pour les blob: URLs des
    // fichiers uploadés en démo, comme pour les URLs signées Supabase.
    // On l'isole dans un wrapper plein-cadre (sans DocumentSheet) car
    // l'embed gère lui-même les proportions A4 du PDF.
    if (isPdf && fileUrl) {
        return (
            <div
                className={cn(
                    "group relative overflow-hidden rounded-md border border-border bg-white shadow-sm transition aspect-[210/297]",
                    "cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/60",
                    isSelected && "ring-2 ring-violet-500 ring-offset-2",
                    className,
                )}
                role="button"
                tabIndex={0}
                onClick={() => onOpen?.(document)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onOpen?.(document);
                }}
                aria-label={`Ouvrir ${document.title}`}
            >
                <embed
                    src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH&page=1`}
                    type="application/pdf"
                    className="pointer-events-none h-full w-full"
                />
                {overlays}
            </div>
        );
    }

    return (
        <div className={cn("group relative", isSelected && "ring-2 ring-violet-500 ring-offset-2", className)}>
            <DocumentSheet
                orientation="portrait"
                onClick={onOpen ? () => onOpen(document) : undefined}
                overlays={overlays}
                ariaLabel={`Ouvrir ${document.title}`}
            >
                {isImage && fileUrl ? (
                    <img src={fileUrl} alt={document.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                        <FileIconForType
                            mime={document.mimeType}
                            name={document.title}
                            size={88}
                        />
                        <p className="line-clamp-3 max-w-[80%] break-words text-base font-semibold">
                            {document.title}
                        </p>
                        {document.tags.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1">
                                {document.tags.slice(0, 4).map((t) => (
                                    <span
                                        key={t}
                                        className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DocumentSheet>
        </div>
    );
}

// Sheet de detail d une archive

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Download, ShieldCheck, ShieldAlert, AlertTriangle, Trash2, FileText, Calendar, Hash } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RetentionBadge } from "./RetentionBadge";
import { HashIndicator } from "@/components/shared/HashIndicator";
import { PreviewModal } from "@/components/shared/PreviewModal";
import { useArchiveCertificate, useApplyLegalHold, useReleaseLegalHold, useIssueDestruction } from "@/hooks/useIArchive";
import type { IArchArchiveWithRelations } from "@/types/iarchive";
import { toast } from "sonner";

interface ArchiveDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    archive: IArchArchiveWithRelations | null;
}

export function ArchiveDetailSheet({ open, onOpenChange, archive }: ArchiveDetailSheetProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const { data: certificate } = useArchiveCertificate(archive?.id ?? null);
    const applyHold = useApplyLegalHold();
    const releaseHold = useReleaseLegalHold();
    const destroy = useIssueDestruction();

    if (!archive) return null;

    const handleApplyHold = async () => {
        const reason = prompt("Motif de la mise sous scelle :");
        if (!reason?.trim()) return;
        try {
            await applyHold.mutateAsync({ id: archive.id, reason: reason.trim() });
            toast.success("Archive placee sous scelle");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    const handleReleaseHold = async () => {
        if (!confirm("Lever la mise sous scelle de cette archive ?")) return;
        try {
            await releaseHold.mutateAsync(archive.id);
            toast.success("Mise sous scelle levee");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    const handleDestroy = async () => {
        const reason = prompt("Motif de destruction (obligatoire) :");
        if (!reason?.trim()) return;
        if (!confirm(`DESTRUCTION DEFINITIVE de "${archive.title}". Confirmer ?`)) return;
        try {
            await destroy.mutateAsync({
                archiveId: archive.id,
                reason: reason.trim(),
                method: "manual_request",
            });
            toast.success("Archive detruite, certificat de destruction emis");
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-[540px] sm:max-w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-start gap-2">
                            <FileText className="h-5 w-5 mt-0.5 shrink-0" />
                            <span>{archive.title}</span>
                        </SheetTitle>
                        <SheetDescription>
                            {archive.description || "Aucune description"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                        <div className="flex flex-wrap gap-2">
                            <RetentionBadge archive={archive} />
                            {archive.category && (
                                <Badge variant="outline" style={{ borderColor: archive.category.color ?? undefined }}>
                                    {archive.category.name}
                                </Badge>
                            )}
                        </div>

                        {archive.file_url && (
                            <div className="flex gap-2">
                                <Button onClick={() => setPreviewOpen(true)} className="flex-1">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Apercu
                                </Button>
                                <Button asChild variant="outline">
                                    <a href={archive.file_url} download={archive.file_name ?? undefined}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Telecharger
                                    </a>
                                </Button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Fichier scelle
                            </h4>
                            <dl className="space-y-2 text-sm">
                                <Row label="Nom" value={archive.file_name ?? "—"} />
                                <Row label="Taille" value={archive.file_size ? `${(archive.file_size / 1024 / 1024).toFixed(2)} Mo` : "—"} />
                                <Row label="Type MIME" value={archive.mime_type ?? "—"} mono />
                                <div className="flex justify-between items-center gap-4">
                                    <dt className="text-muted-foreground flex items-center gap-1.5">
                                        <Hash className="h-3.5 w-3.5" />
                                        Empreinte
                                    </dt>
                                    <dd>
                                        <HashIndicator hash={archive.sha256_hash} />
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Cycle de vie
                            </h4>
                            <dl className="space-y-2 text-sm">
                                <Row label="Duree de retention" value={
                                    archive.retention_years
                                        ? `${archive.retention_years} ans`
                                        : archive.is_vault
                                        ? "Perpetuelle"
                                        : "—"
                                } />
                                {archive.counting_start_date && (
                                    <Row label="Debut comptage" value={format(new Date(archive.counting_start_date), "d MMM yyyy", { locale: fr })} />
                                )}
                                {archive.active_until && (
                                    <Row label="Fin phase active" value={format(new Date(archive.active_until), "d MMM yyyy", { locale: fr })} />
                                )}
                                {archive.semi_active_until && (
                                    <Row label="Fin phase semi-active" value={format(new Date(archive.semi_active_until), "d MMM yyyy", { locale: fr })} />
                                )}
                                {archive.retention_expires_at && (
                                    <Row label="Date d expiration" value={format(new Date(archive.retention_expires_at), "d MMMM yyyy", { locale: fr })} />
                                )}
                                <Row label="Reference OHADA" value={archive.category?.ohada_reference ?? "—"} />
                            </dl>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Certificat d archivage
                            </h4>
                            {certificate ? (
                                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-semibold">{certificate.certificate_number}</span>
                                        <Badge variant={certificate.status === "valid" ? "default" : "destructive"}>
                                            <ShieldCheck className="h-3 w-3 mr-1" />
                                            {certificate.status === "valid" ? "Valide" : "Revoque"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Emis le {format(new Date(certificate.issued_at), "d MMMM yyyy", { locale: fr })}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Aucun certificat emis</p>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Actions
                            </h4>
                            <div className="flex flex-col gap-2">
                                {archive.legal_hold_applied_at ? (
                                    <Button variant="outline" onClick={handleReleaseHold}>
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        Lever la mise sous scelle
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={handleApplyHold}>
                                        <ShieldAlert className="h-4 w-4 mr-2" />
                                        Mise sous scelle (legal hold)
                                    </Button>
                                )}
                                {archive.status !== "destroyed" && (
                                    <Button variant="destructive" onClick={handleDestroy}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Detruire definitivement
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Archivee le {format(new Date(archive.archived_at), "d MMM yyyy HH:mm", { locale: fr })}
                            </p>
                            {archive.original_creation_date && (
                                <p className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Document original cree le {format(new Date(archive.original_creation_date), "d MMM yyyy", { locale: fr })}
                                </p>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <PreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title={archive.title}
                fileUrl={archive.file_url}
                fileName={archive.file_name}
                mimeType={archive.mime_type}
            />
        </>
    );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={mono ? "font-mono text-xs" : "truncate"}>{value}</dd>
        </div>
    );
}

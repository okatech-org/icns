// Sheet de detail d un dossier de correspondance

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, AlertCircle, Eye, Download, Send, Printer, Archive, Paperclip } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "./StatusBadge";
import { ApprovalActions } from "./ApprovalActions";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { HashIndicator } from "@/components/shared/HashIndicator";
import { PreviewModal } from "@/components/shared/PreviewModal";
import { useICorrFolder, useICorrDocuments, useDeliverICorr } from "@/hooks/useICorrespondance";
import type { ICorrDocument } from "@/types/icorrespondance";
import { toast } from "sonner";

interface CorrespondanceDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folderId: string | null;
}

export function CorrespondanceDetailSheet({ open, onOpenChange, folderId }: CorrespondanceDetailSheetProps) {
    const [previewDoc, setPreviewDoc] = useState<ICorrDocument | null>(null);
    const { data: folder } = useICorrFolder(folderId);
    const { data: documents } = useICorrDocuments(folderId);
    const deliver = useDeliverICorr();

    if (!folder) return null;

    const handleDeliver = async (method: "PRINT" | "EMAIL") => {
        try {
            await deliver.mutateAsync({ id: folder.id, method });
            toast.success(method === "PRINT" ? "Marque comme remis" : "Envoye par email");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-start gap-2">
                            {folder.is_urgent && <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />}
                            <Mail className="h-5 w-5 mt-0.5 shrink-0" />
                            <span>{folder.name}</span>
                        </SheetTitle>
                        <SheetDescription className="space-y-1">
                            {folder.reference_number && (
                                <span className="block font-mono text-xs">{folder.reference_number}</span>
                            )}
                            {folder.correspondence_type && (
                                <Badge variant="outline" className="text-xs">
                                    {folder.correspondence_type}
                                </Badge>
                            )}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 mt-6">
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={folder.status} />
                            {folder.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                            {folder.is_internal ? (
                                <Badge variant="secondary">Interne</Badge>
                            ) : (
                                <Badge variant="secondary">Externe</Badge>
                            )}
                        </div>

                        <ApprovalActions folder={folder} />

                        {folder.status === "APPROVED" && (
                            <div className="flex gap-2">
                                <Button onClick={() => handleDeliver("PRINT")} variant="outline" className="flex-1">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Remis (impression)
                                </Button>
                                {folder.recipient_email && (
                                    <Button onClick={() => handleDeliver("EMAIL")} className="flex-1">
                                        <Send className="h-4 w-4 mr-2" />
                                        Envoyer par email
                                    </Button>
                                )}
                            </div>
                        )}

                        <Tabs defaultValue="info">
                            <TabsList className="w-full">
                                <TabsTrigger value="info" className="flex-1">Informations</TabsTrigger>
                                <TabsTrigger value="docs" className="flex-1">
                                    Pieces ({documents?.length ?? 0})
                                </TabsTrigger>
                                <TabsTrigger value="workflow" className="flex-1">Parcours</TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="space-y-4 mt-4">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Destinataire
                                    </h4>
                                    <dl className="space-y-2 text-sm">
                                        <Row label="Nom" value={folder.recipient_name ?? "—"} />
                                        <Row label="Organisation" value={folder.recipient_organization ?? "—"} />
                                        <Row label="Email" value={folder.recipient_email ?? "—"} />
                                    </dl>
                                </div>

                                <Separator />

                                {folder.comment && (
                                    <>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                Contenu
                                            </h4>
                                            <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3">
                                                {folder.comment}
                                            </p>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {folder.rejection_reason && (
                                    <>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-destructive uppercase tracking-wider">
                                                Motif de rejet
                                            </h4>
                                            <p className="text-sm whitespace-pre-wrap rounded-lg bg-destructive/10 p-3">
                                                {folder.rejection_reason}
                                            </p>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <p>Cree le {format(new Date(folder.created_at), "d MMM yyyy HH:mm", { locale: fr })}</p>
                                    {folder.approved_at && (
                                        <p>Approuve le {format(new Date(folder.approved_at), "d MMM yyyy HH:mm", { locale: fr })}</p>
                                    )}
                                    {folder.delivered_at && (
                                        <p>Remis le {format(new Date(folder.delivered_at), "d MMM yyyy HH:mm", { locale: fr })}</p>
                                    )}
                                    {folder.sent_at && (
                                        <p>Envoye le {format(new Date(folder.sent_at), "d MMM yyyy HH:mm", { locale: fr })}</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="docs" className="mt-4 space-y-2">
                                {!documents || documents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        Aucune piece jointe
                                    </p>
                                ) : (
                                    documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-3 rounded-lg border p-3"
                                        >
                                            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{doc.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} Mo` : "—"}
                                                    </span>
                                                    <HashIndicator hash={doc.content_hash} />
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewDoc(doc)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {doc.file_url && (
                                                <Button asChild variant="ghost" size="icon">
                                                    <a href={doc.file_url} download={doc.name}>
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="workflow" className="mt-4">
                                <WorkflowTimeline folderId={folder.id} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </SheetContent>
            </Sheet>

            {previewDoc && (
                <PreviewModal
                    open={!!previewDoc}
                    onOpenChange={(o) => !o && setPreviewDoc(null)}
                    title={previewDoc.name}
                    fileUrl={previewDoc.file_url}
                    fileName={previewDoc.name}
                    mimeType={previewDoc.mime_type}
                />
            )}
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate">{value}</dd>
        </div>
    );
}

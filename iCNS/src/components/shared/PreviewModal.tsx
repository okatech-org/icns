// Modale de previsualisation pour PDF, images, et autres fichiers
// MVP : iframe pour PDF, balise img pour images, fallback texte pour le reste

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText } from "lucide-react";

interface PreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    fileUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
}

export function PreviewModal({ open, onOpenChange, title, fileUrl, fileName, mimeType }: PreviewModalProps) {
    const isPdf = mimeType?.startsWith("application/pdf");
    const isImage = mimeType?.startsWith("image/");
    const isText = mimeType?.startsWith("text/");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <span className="truncate">{title}</span>
                        {fileUrl && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button asChild variant="outline" size="sm">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Ouvrir
                                    </a>
                                </Button>
                                <Button asChild variant="default" size="sm">
                                    <a href={fileUrl} download={fileName ?? undefined}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Telecharger
                                    </a>
                                </Button>
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden bg-muted/30">
                    {!fileUrl ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p>Aucun fichier disponible</p>
                        </div>
                    ) : isPdf || isText ? (
                        <iframe
                            src={fileUrl}
                            title={title}
                            className="w-full h-full border-0"
                        />
                    ) : isImage ? (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <img
                                src={fileUrl}
                                alt={fileName ?? title}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 p-6">
                            <FileText className="h-12 w-12" />
                            <p className="text-sm text-center">
                                Apercu non disponible pour ce type de fichier ({mimeType ?? "inconnu"})
                            </p>
                            <Button asChild>
                                <a href={fileUrl} download={fileName ?? undefined}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Telecharger pour ouvrir
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

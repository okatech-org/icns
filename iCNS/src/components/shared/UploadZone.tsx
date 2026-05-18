// Zone d upload generique reutilisable par iDocument, iArchive, iCorrespondance
// Calcule SHA-256 cote client + upload Supabase Storage + retourne metadonnees

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadService, type IDocBucket } from "@/services/idocument/uploadService";
import type { IDocUploadResult } from "@/types/idocument";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
    bucket: IDocBucket;
    onUploadComplete: (result: IDocUploadResult) => void;
    onError?: (error: Error) => void;
    accept?: Record<string, string[]>;
    maxSizeMB?: number;
    className?: string;
    label?: string;
    sublabel?: string;
}

export function UploadZone({
    bucket,
    onUploadComplete,
    onError,
    accept,
    maxSizeMB = 50,
    className,
    label = "Glissez un fichier ici ou cliquez pour parcourir",
    sublabel = "PDF, Word, Excel, image — 50 Mo maximum",
}: UploadZoneProps) {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [completed, setCompleted] = useState<IDocUploadResult | null>(null);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;
            const file = acceptedFiles[0];
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.error(`Fichier trop volumineux (max ${maxSizeMB} Mo)`);
                return;
            }
            setUploading(true);
            setProgress(0);
            try {
                const result = await uploadService.upload({
                    bucket,
                    file,
                    onProgress: setProgress,
                });
                setCompleted(result);
                onUploadComplete(result);
                toast.success("Fichier televerse");
            } catch (err) {
                const error = err instanceof Error ? err : new Error("Echec upload");
                toast.error(error.message);
                onError?.(error);
            } finally {
                setUploading(false);
            }
        },
        [bucket, maxSizeMB, onUploadComplete, onError]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        disabled: uploading,
    });

    const reset = () => {
        setCompleted(null);
        setProgress(0);
    };

    if (completed) {
        return (
            <div className={cn("border-2 border-dashed border-green-500/50 bg-green-50 dark:bg-green-950/20 rounded-2xl p-6", className)}>
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{completed.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {(completed.file_size / 1024 / 1024).toFixed(2)} Mo · SHA-256 calcule
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8 shrink-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                uploading && "pointer-events-none opacity-70",
                className
            )}
        >
            <input {...getInputProps()} />
            {uploading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm font-medium">Calcul du hash et upload en cours...</p>
                    <Progress value={progress} className="w-full max-w-xs" />
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10">
                        {isDragActive ? (
                            <FileText className="h-6 w-6 text-primary" />
                        ) : (
                            <Upload className="h-6 w-6 text-primary" />
                        )}
                    </div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sublabel}</p>
                </div>
            )}
        </div>
    );
}

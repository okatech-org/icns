import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, File, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedFile {
    id: string;
    file: File;
    status: 'uploading' | 'analyzing' | 'completed' | 'error';
    progress: number;
    analysis?: any;
    error?: string;
}

interface DocumentUploadZoneProps {
    onDocumentAnalyzed?: (documentId: string, analysis: any) => void;
    onFileSelect?: (file: File) => Promise<void>;
    isProcessing?: boolean;
    label?: string;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({ onDocumentAnalyzed }) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        // Validation des fichiers
        const validFiles = acceptedFiles.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
            ];

            if (file.size > maxSize) {
                toast({
                    title: 'Fichier trop volumineux',
                    description: `${file.name} dépasse la limite de 10MB`,
                    variant: 'destructive',
                });
                return false;
            }

            if (!validTypes.includes(file.type)) {
                toast({
                    title: 'Type de fichier non supporté',
                    description: `${file.name} n'est pas un PDF, image ou document Word`,
                    variant: 'destructive',
                });
                return false;
            }

            return true;
        });

        // Ajouter les fichiers à la liste avec statut 'uploading'
        const newFiles: UploadedFile[] = validFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'uploading',
            progress: 0,
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Uploader chaque fichier
        for (const uploadedFile of newFiles) {
            await uploadAndAnalyzeFile(uploadedFile);
        }
    }, [toast]);

    const uploadAndAnalyzeFile = async (uploadedFile: UploadedFile) => {
        try {
            // 1. Upload vers Supabase Storage
            updateFileStatus(uploadedFile.id, 'uploading', 25);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const fileExt = uploadedFile.file.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}_${uploadedFile.file.name}`;

            const { error: uploadError } = await supabase.storage
                .from('documents-presidentiels')
                .upload(filePath, uploadedFile.file);

            if (uploadError) throw uploadError;

            updateFileStatus(uploadedFile.id, 'uploading', 50);

            // 2. Créer l'entrée dans la table documents
            const { data: document, error: docError } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    filename: uploadedFile.file.name,
                    file_path: filePath,
                    file_type: uploadedFile.file.type,
                    file_size: uploadedFile.file.size,
                })
                .select()
                .single();

            if (docError || !document) throw docError || new Error('Failed to create document record');

            updateFileStatus(uploadedFile.id, 'analyzing', 75);

            // 3. Déclencher l'analyse OCR via Edge Function
            const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
                'document-ocr',
                {
                    body: { documentId: document.id },
                }
            );

            if (analysisError) throw analysisError;

            updateFileStatus(uploadedFile.id, 'completed', 100, analysisResult.analysis);

            toast({
                title: '✅ Document analysé',
                description: `${uploadedFile.file.name} a été traité avec succès`,
            });

            // Callback avec les résultats
            if (onDocumentAnalyzed) {
                onDocumentAnalyzed(document.id, analysisResult.analysis);
            }

        } catch (error: any) {
            console.error('Error uploading/analyzing file:', error);
            updateFileStatus(uploadedFile.id, 'error', 0, null, error.message);

            toast({
                title: 'Erreur',
                description: `Impossible de traiter ${uploadedFile.file.name}`,
                variant: 'destructive',
            });
        }
    };

    const updateFileStatus = (
        fileId: string,
        status: UploadedFile['status'],
        progress: number,
        analysis?: any,
        error?: string
    ) => {
        setFiles(prev =>
            prev.map(f =>
                f.id === fileId
                    ? { ...f, status, progress, analysis, error }
                    : f
            )
        );
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
        },
        multiple: true,
    });

    const getFileIcon = (file: File) => {
        if (file.type === 'application/pdf') return <FileText className="w-8 h-8" />;
        if (file.type.startsWith('image/')) return <Image className="w-8 h-8" />;
        return <File className="w-8 h-8" />;
    };

    const getStatusColor = (status: UploadedFile['status']) => {
        switch (status) {
            case 'uploading': return 'text-blue-500';
            case 'analyzing': return 'text-yellow-500';
            case 'completed': return 'text-green-500';
            case 'error': return 'text-red-500';
        }
    };

    const getStatusLabel = (status: UploadedFile['status']) => {
        switch (status) {
            case 'uploading': return 'Upload en cours...';
            case 'analyzing': return 'Analyse IA...';
            case 'completed': return 'Terminé';
            case 'error': return 'Erreur';
        }
    };

    return (
        <div className="space-y-4">
            {/* Zone de drop */}
            <Card
                {...getRootProps()}
                className={`p-8 border-2 border-dashed cursor-pointer transition-all ${isDragActive
                        ? 'border-primary bg-primary/5 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
            >
                <input {...getInputProps()} />
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-0">
                    <Upload className={`w-12 h-12 ${isDragActive ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                    <div>
                        <p className="text-lg font-semibold">
                            {isDragActive ? 'Déposez les fichiers ici' : 'Glissez-déposez des documents'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            PDF, Images (JPG, PNG) ou Documents Word • Max 10MB
                        </p>
                    </div>
                    <Button variant="outline" size="sm" type="button">
                        Ou cliquez pour parcourir
                    </Button>
                </CardContent>
            </Card>

            {/* Liste des fichiers uploadés */}
            <AnimatePresence>
                {files.map(uploadedFile => (
                    <motion.div
                        key={uploadedFile.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icône */}
                                    <div className={`flex-shrink-0 ${getStatusColor(uploadedFile.status)}`}>
                                        {uploadedFile.status === 'completed' ? (
                                            <CheckCircle className="w-8 h-8" />
                                        ) : uploadedFile.status === 'uploading' || uploadedFile.status === 'analyzing' ? (
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                        ) : (
                                            getFileIcon(uploadedFile.file)
                                        )}
                                    </div>

                                    {/* Informations */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{uploadedFile.file.name}</p>
                                        <p className={`text-xs mt-1 ${getStatusColor(uploadedFile.status)}`}>
                                            {getStatusLabel(uploadedFile.status)}
                                        </p>

                                        {/* Progress bar */}
                                        {uploadedFile.status !== 'completed' && uploadedFile.status !== 'error' && (
                                            <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                                        )}

                                        {/* Résumé de l'analyse */}
                                        {uploadedFile.status === 'completed' && uploadedFile.analysis && (
                                            <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                                <p><strong>Urgence:</strong> {uploadedFile.analysis.urgency_score}/10</p>
                                                <p><strong>Sentiment:</strong> {uploadedFile.analysis.sentiment}</p>
                                                {uploadedFile.analysis.key_points && uploadedFile.analysis.key_points.length > 0 && (
                                                    <p><strong>Points clés:</strong> {uploadedFile.analysis.key_points.length} identifiés</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Message d'erreur */}
                                        {uploadedFile.status === 'error' && uploadedFile.error && (
                                            <p className="mt-2 text-xs text-red-500">{uploadedFile.error}</p>
                                        )}
                                    </div>

                                    {/* Bouton supprimer */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(uploadedFile.id)}
                                        className="flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

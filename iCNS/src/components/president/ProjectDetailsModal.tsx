import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, Image as ImageIcon, FileText, Activity } from "lucide-react";

export type ProjectType = 'presidential' | 'state' | 'construction';

interface ProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    projectType: ProjectType;
}

export function ProjectDetailsModal({ isOpen, onClose, projectId, projectType }: ProjectDetailsModalProps) {
    const { toast } = useToast();
    const [project, setProject] = useState<any>(null);
    const [updates, setUpdates] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectData();
        } else {
            setProject(null);
            setUpdates([]);
            setPhotos([]);
        }
    }, [isOpen, projectId, projectType]);

    const loadProjectData = async () => {
        setLoading(true);
        try {
            let tableName = '';
            let updatesTable = '';
            let photosTable = '';

            switch (projectType) {
                case 'presidential':
                    tableName = 'projets_presidentiels';
                    updatesTable = 'projet_presidentiel_updates';
                    break;
                case 'state':
                    tableName = 'projets_etat';
                    break;
                case 'construction':
                    tableName = 'chantiers';
                    updatesTable = 'chantier_updates';
                    photosTable = 'chantier_photos';
                    break;
            }

            // Load project details
            const { data: projectData, error: projectError } = await supabase
                .from(tableName as any)
                .select("*")
                .eq("id", projectId)
                .single();

            if (projectError) throw projectError;
            setProject(projectData);

            // Load updates if applicable
            if (updatesTable) {
                const { data: updatesData } = await supabase
                    .from(updatesTable as any)
                    .select("*")
                    .eq(projectType === 'construction' ? "chantier_id" : "project_id", projectId)
                    .order("date", { ascending: false });

                if (updatesData) setUpdates(updatesData);
            }

            // Load photos if applicable
            if (photosTable) {
                const { data: photosData } = await supabase
                    .from(photosTable as any)
                    .select("*")
                    .eq("chantier_id", projectId)
                    .order("created_at", { ascending: false });

                if (photosData) setPhotos(photosData);
            }

        } catch (error: any) {
            console.error("Error loading project:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les détails du projet",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'delayed': return 'bg-red-500';
            case 'planned': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Terminé';
            case 'in_progress': return 'En cours';
            case 'delayed': return 'Retardé';
            case 'planned': return 'Planifié';
            default: return status;
        }
    };

    const formatCurrency = (amount: number) => {
        if (!amount) return '-';
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)} Mrd FCFA`;
        } else if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)} M FCFA`;
        }
        return `${amount.toLocaleString()} FCFA`;
    };

    if (!project && !loading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                {project?.name || project?.title}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {projectType === 'presidential' ? 'Projet Présidentiel' :
                                    projectType === 'construction' ? 'Chantier & Infrastructure' :
                                        'Projet de l\'État'}
                            </DialogDescription>
                        </div>
                        <Badge className={`${getStatusColor(project?.status)} text-white border-0`}>
                            {getStatusLabel(project?.status)}
                        </Badge>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 text-center text-muted-foreground">Chargement des détails...</div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-muted/30 p-4 rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Budget
                                </div>
                                <div className="font-semibold text-lg">{formatCurrency(project?.budget)}</div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Progression
                                </div>
                                <div className="font-semibold text-lg">{project?.progress || 0}%</div>
                                <Progress value={project?.progress || 0} className="h-1.5 mt-2" />
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Localisation
                                </div>
                                <div className="font-semibold text-lg truncate" title={project?.location}>
                                    {project?.location || 'Nationale'}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Échéance
                                </div>
                                <div className="font-semibold text-lg">
                                    {project?.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : '-'}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-card border rounded-lg p-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Description
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {project?.description || "Aucune description disponible."}
                            </p>
                        </div>

                        {/* Tabs for Updates, Photos, Details */}
                        <Tabs defaultValue="updates" className="w-full">
                            <TabsList>
                                <TabsTrigger value="updates">Suivi & Mises à jour</TabsTrigger>
                                {photos.length > 0 && <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>}
                                <TabsTrigger value="details">Détails Techniques</TabsTrigger>
                            </TabsList>

                            <TabsContent value="updates" className="mt-4">
                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                    {updates.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                            Aucune mise à jour récente
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {updates.map((update) => (
                                                <div key={update.id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                                                    <div className="mb-1 text-sm text-muted-foreground">
                                                        {new Date(update.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </div>
                                                    <h4 className="font-medium mb-1">{update.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{update.content || update.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="photos" className="mt-4">
                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {photos.map((photo) => (
                                            <div key={photo.id} className="aspect-video rounded-lg overflow-hidden border bg-muted relative group">
                                                {photo.url ? (
                                                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                                                    {photo.caption}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="details" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Informations Générales</h4>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Ministère de tutelle</dt>
                                                <dd className="font-medium">{project?.ministry || '-'}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Chef de projet</dt>
                                                <dd className="font-medium">{project?.manager || '-'}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Date de début</dt>
                                                <dd className="font-medium">{project?.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : '-'}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Performance</h4>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Budget consommé</dt>
                                                <dd className="font-medium">{formatCurrency(project?.spent_budget || 0)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Taux de consommation</dt>
                                                <dd className="font-medium">
                                                    {project?.budget ? Math.round(((project.spent_budget || 0) / project.budget) * 100) : 0}%
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

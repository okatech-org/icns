import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trash2, FileText, Layout, Eye, Edit, X, Grid, Code } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { generateOfficialPDFWithURL } from '@/utils/generateOfficialPDF';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    structure: any;
    created_at: string;
}

interface DocumentTemplatesManagerProps {
    serviceRole?: string;
}

export const DocumentTemplatesManager = ({ serviceRole = 'president' }: DocumentTemplatesManagerProps) => {
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [generatingPreviews, setGeneratingPreviews] = useState(false);
    const { toast } = useToast();

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        structure: '{}'
    });

    // Visual Editor State
    const [visualConfig, setVisualConfig] = useState({
        layout: 'standard_modern',
        marginTop: 60,
        marginBottom: 60,
        fontFamily: 'Roboto',
        fontSize: 12,
        showLogo: true
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Regenerate previews when templates or serviceRole changes
    useEffect(() => {
        if (templates.length > 0) {
            generateAllPreviews();
        }
    }, [templates, serviceRole]);

    // Sync Visual Config with JSON Structure
    useEffect(() => {
        try {
            const structure = JSON.parse(formData.structure);
            setVisualConfig({
                layout: structure.layout || 'standard_modern',
                marginTop: structure.margins?.top || 60,
                marginBottom: structure.margins?.bottom || 60,
                fontFamily: structure.styles?.bodyText?.font || 'Roboto',
                fontSize: structure.styles?.bodyText?.fontSize || 12,
                showLogo: structure.header?.showLogo !== false
            });
        } catch (e) {
            // Ignore JSON parse errors while typing
        }
    }, [formData.structure]);

    const updateStructureFromVisual = (key: string, value: any) => {
        try {
            const currentStructure = JSON.parse(formData.structure);
            let newStructure = { ...currentStructure };

            if (key === 'layout') newStructure.layout = value;
            if (key === 'marginTop') newStructure.margins = { ...newStructure.margins, top: value };
            if (key === 'marginBottom') newStructure.margins = { ...newStructure.margins, bottom: value };
            if (key === 'fontFamily') {
                newStructure.styles = {
                    ...newStructure.styles,
                    bodyText: { ...newStructure.styles?.bodyText, font: value }
                };
            }
            if (key === 'fontSize') {
                newStructure.styles = {
                    ...newStructure.styles,
                    bodyText: { ...newStructure.styles?.bodyText, fontSize: value }
                };
            }

            setFormData(prev => ({ ...prev, structure: JSON.stringify(newStructure, null, 2) }));
            setVisualConfig(prev => ({ ...prev, [key]: value }));
        } catch (e) {
            console.error("Error updating structure from visual editor", e);
        }
    };

    const generateAllPreviews = async () => {
        setGeneratingPreviews(true);

        // Create an array of promises for parallel generation
        const previewPromises = templates.map(async (template) => {
            try {
                // Extract layout style from structure if present
                const structure = typeof template.structure === 'string'
                    ? JSON.parse(template.structure)
                    : template.structure;

                const templateStyle = structure?.layout || 'standard_modern';

                // Determine document type based on template name or default
                let docType: any = 'lettre';
                const nameLower = template.name.toLowerCase();
                if (nameLower.includes('décret') || nameLower.includes('decret')) docType = 'decret';
                else if (nameLower.includes('communiqué') || nameLower.includes('communique')) docType = 'communique';
                else if (nameLower.includes('note')) docType = 'note';
                else if (nameLower.includes('arrêté')) docType = 'arrete'; // Fallback to lettre usually but good to know

                // Generate a dummy PDF for preview
                const { url } = await generateOfficialPDFWithURL({
                    type: docType,
                    recipient: 'Destinataire',
                    subject: 'Aperçu du Modèle',
                    content_points: [
                        'Ceci est un aperçu visuel du modèle.',
                        'Il utilise les paramètres de votre service.',
                        'La mise en page reflète le style sélectionné.'
                    ],
                    serviceContext: serviceRole,
                    templateStyle: templateStyle
                });

                return { id: template.id, url };
            } catch (e) {
                console.error(`Failed to generate preview for template ${template.name}`, e);
                return null;
            }
        });

        // Wait for all promises to settle
        const results = await Promise.allSettled(previewPromises);

        const newPreviews: Record<string, string> = {};

        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                newPreviews[result.value.id] = result.value.url;
            }
        });

        setPreviews(prev => ({ ...prev, ...newPreviews }));
        setGeneratingPreviews(false);
    };

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('document_templates' as any)
                .select('*')
                .order('name');

            if (error) throw error;
            setTemplates((data as any) || []);
        } catch (error: any) {
            console.error('Error fetching templates:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les modèles.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditTemplate = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            structure: typeof template.structure === 'string' ? template.structure : JSON.stringify(template.structure, null, 2)
        });
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setFormData({
            name: 'Nouveau Modèle',
            description: '',
            structure: JSON.stringify({
                layout: 'standard_modern',
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                styles: {
                    bodyText: { fontSize: 12, font: 'Times' }
                }
            }, null, 2)
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({
                title: "Erreur",
                description: "Le nom du modèle est requis.",
                variant: "destructive"
            });
            return;
        }

        let parsedStructure = {};
        try {
            parsedStructure = JSON.parse(formData.structure);
        } catch (e) {
            toast({
                title: "Erreur JSON",
                description: "La structure JSON est invalide.",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                structure: parsedStructure
            };

            let error;
            if (selectedTemplate) {
                // Update
                const { error: updateError } = await supabase
                    .from('document_templates' as any)
                    .update(payload)
                    .eq('id', selectedTemplate.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('document_templates' as any)
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Modèle enregistré avec succès.",
            });
            fetchTemplates();
            setIsEditing(false);
            setSelectedTemplate(null);
        } catch (error: any) {
            console.error('Error saving template:', error);
            toast({
                title: "Erreur",
                description: "Erreur lors de l'enregistrement: " + error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;

        try {
            const { error } = await supabase
                .from('document_templates' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Modèle supprimé.",
            });
            fetchTemplates();
            setIsEditing(false);
            setSelectedTemplate(null);
        } catch (error: any) {
            console.error('Error deleting template:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le modèle.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Modèles Disponibles</h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        Aperçu généré avec le style du service : <Badge variant="outline">{serviceRole.toUpperCase()}</Badge>
                    </div>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" /> Créer un modèle
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-lg">
                    <Layout className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">Aucun modèle</h3>
                    <p className="text-muted-foreground mb-4">Commencez par créer votre premier modèle de document.</p>
                    <Button onClick={handleCreateNew}>Créer un modèle</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Card key={template.id} className="group hover:shadow-md transition-all duration-200 overflow-hidden border-muted flex flex-col">
                            {/* Preview Container - A4 Ratio */}
                            <div className="relative w-full pt-[141.4%] bg-muted/30 border-b overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {previews[template.id] ? (
                                        <div className="w-full h-full relative">
                                            {/* Full Card Iframe with correct scaling */}
                                            <iframe
                                                src={`${previews[template.id]}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                                className="w-full h-full absolute inset-0 pointer-events-none"
                                                style={{ border: 'none', objectFit: 'contain' }}
                                                tabIndex={-1}
                                                title={`Preview ${template.name}`}
                                            />
                                            {/* Transparent overlay to prevent iframe interaction but allow clicks */}
                                            <div className="absolute inset-0 bg-transparent z-10" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            {generatingPreviews ? (
                                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            ) : (
                                                <FileText className="h-12 w-12 opacity-20" />
                                            )}
                                            <span className="text-xs mt-2">{generatingPreviews ? 'Génération...' : 'Aperçu indisponible'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                                    <Button variant="secondary" size="sm" className="pointer-events-auto shadow-lg" onClick={() => handleEditTemplate(template)}>
                                        <Edit className="h-4 w-4 mr-2" /> Modifier
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-4 flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold truncate" title={template.name}>{template.name}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2" title={template.description}>
                                            {template.description || "Aucune description"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2 border-b">
                        <DialogTitle>{selectedTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}</DialogTitle>
                        <DialogDescription>
                            Personnalisez la structure et l'apparence du document.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                        {/* Left: Editor */}
                        <div className="flex flex-col border-r bg-muted/10">
                            <div className="p-6 pb-0 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: Lettre de mission"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Usage..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <Tabs defaultValue="visual" className="flex-1 flex flex-col mt-4">
                                <div className="px-6">
                                    <TabsList className="w-full">
                                        <TabsTrigger value="visual" className="flex-1"><Grid className="w-4 h-4 mr-2" /> Éditeur Visuel</TabsTrigger>
                                        <TabsTrigger value="code" className="flex-1"><Code className="w-4 h-4 mr-2" /> Éditeur JSON</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="visual" className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium flex items-center text-primary"><Layout className="w-4 h-4 mr-2" /> Mise en page</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Style Global</Label>
                                                <Select
                                                    value={visualConfig.layout}
                                                    onValueChange={(val) => updateStructureFromVisual('layout', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choisir un style" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="standard_modern">Standard Moderne</SelectItem>
                                                        <SelectItem value="executive_dynamic">Exécutif Dynamique</SelectItem>
                                                        <SelectItem value="solemn_prestige">Solennel Prestige</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Police du corps</Label>
                                                <Select
                                                    value={visualConfig.fontFamily}
                                                    onValueChange={(val) => updateStructureFromVisual('fontFamily', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Police" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Roboto">Roboto (Sans-Serif)</SelectItem>
                                                        <SelectItem value="Times">Times New Roman (Serif)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium flex items-center text-primary"><Grid className="w-4 h-4 mr-2" /> Marges & Espacement</h4>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Label>Marge Haut ({visualConfig.marginTop}pt)</Label>
                                                </div>
                                                <Slider
                                                    value={[visualConfig.marginTop]}
                                                    min={20}
                                                    max={150}
                                                    step={5}
                                                    onValueChange={(vals) => updateStructureFromVisual('marginTop', vals[0])}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Label>Marge Bas ({visualConfig.marginBottom}pt)</Label>
                                                </div>
                                                <Slider
                                                    value={[visualConfig.marginBottom]}
                                                    min={20}
                                                    max={150}
                                                    step={5}
                                                    onValueChange={(vals) => updateStructureFromVisual('marginBottom', vals[0])}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Label>Taille Police ({visualConfig.fontSize}pt)</Label>
                                                </div>
                                                <Slider
                                                    value={[visualConfig.fontSize]}
                                                    min={8}
                                                    max={16}
                                                    step={1}
                                                    onValueChange={(vals) => updateStructureFromVisual('fontSize', vals[0])}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="code" className="flex-1 p-6 pt-0 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="structure">Structure JSON</Label>
                                        <Badge variant="secondary" className="font-mono text-xs">Avancé</Badge>
                                    </div>
                                    <Textarea
                                        id="structure"
                                        value={formData.structure}
                                        onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                                        className="font-mono text-xs flex-1 resize-none"
                                        placeholder="{ ... }"
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="bg-muted/30 flex flex-col h-full overflow-hidden relative">
                            <div className="p-2 border-b bg-white/50 backdrop-blur text-xs font-medium text-center text-muted-foreground flex justify-between items-center px-4">
                                <span>Aperçu en temps réel</span>
                                <Badge variant="outline">{serviceRole}</Badge>
                            </div>
                            <div className="flex-1 p-8 flex items-center justify-center overflow-hidden bg-slate-100">
                                {/* A4 Paper Simulation */}
                                <div className="bg-white shadow-xl w-[210mm] h-[297mm] max-h-full max-w-full relative transform scale-90 origin-center transition-transform duration-300">
                                    {selectedTemplate && previews[selectedTemplate.id] ? (
                                        <iframe
                                            src={`${previews[selectedTemplate.id]}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                            className="w-full h-full"
                                            style={{ border: 'none' }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <Eye className="h-16 w-16 mb-4 opacity-20" />
                                            <p>Enregistrez pour voir l'aperçu</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t bg-white">
                        {selectedTemplate && (
                            <Button
                                variant="destructive"
                                onClick={() => handleDelete(selectedTemplate.id)}
                                className="mr-auto"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

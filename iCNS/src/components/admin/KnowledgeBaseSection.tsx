import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, RefreshCw, FileText, Database, Brain } from 'lucide-react';
import { IASTED_AUTHORIZED_ROLES, type AppRole } from '@/config/role-contexts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeExplorer } from './intelligence/KnowledgeExplorer';

interface KnowledgeDoc {
    id: string;
    title: string;
    file_path: string;
    file_type: string;
    status: 'indexing' | 'ready' | 'error';
    access_level: AppRole[];
    created_at: string;
}

export const KnowledgeBaseSection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // New Doc Form
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocPath, setNewDocPath] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(['admin', 'president']);

    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [intelligenceCount, setIntelligenceCount] = useState<number>(0);

    useEffect(() => {
        fetchDocuments();
        fetchIntelligenceStats();
    }, []);

    const fetchIntelligenceStats = async () => {
        try {
            // Count items with embeddings (indexed)
            const { count, error } = await supabase
                .from('intelligence_items')
                .select('*', { count: 'exact', head: true })
                .not('embedding', 'is', null);

            if (error) throw error;
            setIntelligenceCount(count || 0);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('knowledge_base')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data as any[]);
        } catch (error: any) {
            console.error('Error fetching documents:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger la base de connaissances",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            // Auto-fill title if empty
            if (!newDocTitle) {
                setNewDocTitle(e.target.files[0].name.split('.')[0]);
            }
        }
    };

    const handleAddDocument = async () => {
        if (!newDocTitle || !selectedFile) return;

        setUploading(true);
        try {
            // 1. Upload file to storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('knowledge-base')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // 2. Create record in knowledge_base table
            const { error: dbError } = await (supabase as any)
                .from('knowledge_base')
                .insert({
                    title: newDocTitle,
                    file_path: filePath,
                    file_type: fileExt,
                    status: 'indexing',
                    access_level: selectedRoles
                });

            if (dbError) throw dbError;

            // 3. Trigger indexing (could be automatic via trigger, but for now we just notify)
            // In a real scenario, an Edge Function would pick this up via webhook or trigger

            toast({
                title: "Document ajouté",
                description: "Le document est en cours d'indexation"
            });
            setIsAddDialogOpen(false);
            setNewDocTitle('');
            setSelectedFile(null);
            fetchDocuments();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (id: string, filePath: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        try {
            // 1. Delete from storage
            const { error: storageError } = await supabase.storage
                .from('knowledge-base')
                .remove([filePath]);

            if (storageError) console.warn('Storage delete error:', storageError);

            // 2. Delete from database
            const { error } = await (supabase as any)
                .from('knowledge_base')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Document supprimé",
                description: "Le document a été retiré de la base"
            });
            fetchDocuments();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleReindex = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('knowledge_base')
                .update({ status: 'indexing' })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Ré-indexation lancée",
                description: "Le statut sera mis à jour une fois terminé"
            });
            fetchDocuments();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleIndexHistory = async () => {
        try {
            setLoading(true);
            // Call Edge Function to process pending items
            const { data, error } = await supabase.functions.invoke('process-intelligence-batch');

            if (error) throw error;

            toast({
                title: "Indexation lancée",
                description: `${data.processed || 0} éléments envoyés pour indexation.`
            });

            // Refresh stats after a short delay to allow processing to start
            setTimeout(fetchIntelligenceStats, 2000);
        } catch (error: any) {
            console.error('Indexing error:', error);
            toast({
                title: "Erreur",
                description: "Échec du lancement de l'indexation de l'historique",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ready':
                return <Badge className="bg-green-500">Prêt</Badge>;
            case 'indexing':
                return <Badge variant="secondary" className="animate-pulse">Indexation...</Badge>;
            case 'error':
                return <Badge variant="destructive">Erreur</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };



    const handlePurgeIntelligence = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer TOUTE la mémoire de veille ? Cette action est irréversible.")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('intelligence_items')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

            if (error) throw error;

            toast({
                title: "Mémoire effacée",
                description: "Tout l'historique de veille a été supprimé.",
            });
            fetchIntelligenceStats();
        } catch (error) {
            console.error('Error purging intelligence:', error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de supprimer l'historique.",
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (role: AppRole) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    // ... (keep existing imports and state)
    // Add import for KnowledgeExplorer
    // import { KnowledgeExplorer } from './intelligence/KnowledgeExplorer'; // This will be added at top of file by auto-import or manual edit if needed.
    // Since I can't easily add import at top with replace_file_content if I target the bottom, I will assume I need to add the import separately or rewrite the file.
    // Actually, I'll rewrite the return statement to use Tabs.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Base de Connaissances (RAG)</h2>
                    <p className="text-muted-foreground">
                        Gérez les documents de référence et explorez la mémoire de l'IA.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePurgeIntelligence} disabled={loading} className="text-destructive hover:bg-destructive/10 border-destructive/20">
                        <Trash2 className="mr-2 h-4 w-4" /> Réinitialiser
                    </Button>
                    <Button variant="outline" onClick={handleIndexHistory} disabled={loading}>
                        <Database className="mr-2 h-4 w-4" /> Indexer l'historique
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Upload className="mr-2 h-4 w-4" /> Ajouter un document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un document</DialogTitle>
                                <CardDescription>
                                    Référencez un document pour l'indexation vectorielle.
                                </CardDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre du document</Label>
                                    <Input
                                        id="title"
                                        value={newDocTitle}
                                        onChange={(e) => setNewDocTitle(e.target.value)}
                                        placeholder="ex: Constitution Gabonaise"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="file">Fichier (PDF, DOCX, TXT)</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rôles autorisés</Label>
                                    <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-[200px] overflow-y-auto">
                                        {IASTED_AUTHORIZED_ROLES.map(role => (
                                            <div key={role} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`role-${role}`}
                                                    checked={selectedRoles.includes(role)}
                                                    onCheckedChange={() => toggleRole(role)}
                                                />
                                                <label
                                                    htmlFor={`role-${role}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {role}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                                <Button onClick={handleAddDocument} disabled={uploading || !newDocTitle || !selectedFile}>
                                    {uploading ? 'Upload...' : 'Ajouter'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="explorer" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="explorer" className="flex items-center gap-2">
                        <Brain className="h-4 w-4" /> Explorateur
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Gestion des Documents
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="explorer" className="space-y-4">
                    <KnowledgeExplorer />
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    Mémoire de Veille (Automatique)
                                </CardTitle>
                                <CardDescription>
                                    Informations collectées automatiquement (Web, Réseaux Sociaux)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-primary">{intelligenceCount}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Éléments vectorisés et accessibles par l'IA
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Documents de Référence (Manuel)
                                </CardTitle>
                                <CardDescription>
                                    Fichiers officiels uploadés manuellement
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{documents.length}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Documents indexés dans la base
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" /> Liste des Documents
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => { fetchDocuments(); fetchIntelligenceStats(); }}>
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Titre</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Accès</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Aucun document manuel. La base de connaissances utilise également les {intelligenceCount} éléments de veille.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        {doc.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground ml-6">{doc.file_path}</div>
                                                </TableCell>
                                                <TableCell className="uppercase text-xs">{doc.file_type}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.access_level.slice(0, 2).map(role => (
                                                            <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>
                                                        ))}
                                                        {doc.access_level.length > 2 && (
                                                            <Badge variant="outline" className="text-[10px]">+{doc.access_level.length - 2}</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleReindex(doc.id)}
                                                            title="Ré-indexer"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

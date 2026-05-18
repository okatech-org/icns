import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, PenTool, MessageSquare, CheckCircle, XCircle, Download, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentSignerModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string | null;
    onSigned?: () => void;
}

export function DocumentSignerModal({ isOpen, onClose, documentId, onSigned }: DocumentSignerModalProps) {
    const { toast } = useToast();
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [signing, setSigning] = useState(false);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("preview");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (isOpen && documentId) {
            loadDocument();
            loadComments();
        } else {
            setDocument(null);
            setComments([]);
        }
    }, [isOpen, documentId]);

    const loadDocument = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("decrets_ordonnances")
                .select("*")
                .eq("id", documentId)
                .single();

            if (error) throw error;
            setDocument(data);
        } catch (error: any) {
            console.error("Error loading document:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger le document",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const { data, error } = await supabase
                .from("decret_comments")
                .select("*, auth_users:user_id(email)") // Assuming we can join or fetch user info
                .eq("decret_id", documentId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim() || !documentId) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from("decret_comments")
                .insert({
                    decret_id: documentId,
                    user_id: user.id,
                    comment: comment.trim(),
                    comment_type: "review"
                });

            if (error) throw error;

            setComment("");
            loadComments();
            toast({
                title: "Commentaire ajouté",
                description: "Votre commentaire a été enregistré",
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleSign = async () => {
        if (!documentId) return;

        // In a real implementation, we would capture the signature from canvas
        // For now, we simulate the signature process
        const signatureData = canvasRef.current?.toDataURL() || "simulated_signature";

        setSigning(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // 1. Record signature
            const { error: sigError } = await supabase
                .from("decret_signatures")
                .insert({
                    decret_id: documentId,
                    signed_by: user.id,
                    signature_data: signatureData,
                    user_agent: navigator.userAgent
                });

            if (sigError) throw sigError;

            // 2. Update document status
            const { error: docError } = await supabase
                .from("decrets_ordonnances")
                .update({
                    status: "signed",
                    signed_at: new Date().toISOString(),
                    signed_by: user.id
                })
                .eq("id", documentId);

            if (docError) throw docError;

            toast({
                title: "Document signé",
                description: "Le document a été validé et signé avec succès",
            });

            if (onSigned) onSigned();
            onClose();
        } catch (error: any) {
            console.error("Error signing document:", error);
            toast({
                title: "Erreur",
                description: "Échec de la signature du document",
                variant: "destructive",
            });
        } finally {
            setSigning(false);
        }
    };

    const handleRequestRevision = async () => {
        if (!documentId) return;
        if (!comment.trim()) {
            toast({
                title: "Commentaire requis",
                description: "Veuillez expliquer la raison de la demande de révision",
                variant: "destructive",
            });
            return;
        }

        try {
            // Add comment first
            await handleAddComment();

            // Update status
            const { error } = await supabase
                .from("decrets_ordonnances")
                .update({
                    status: "revision_needed",
                    revision_notes: comment
                })
                .eq("id", documentId);

            if (error) throw error;

            toast({
                title: "Révision demandée",
                description: "Le statut du document a été mis à jour",
            });

            if (onSigned) onSigned(); // Refresh parent list
            onClose();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Canvas drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    if (!document && !loading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                {document?.reference} - {document?.title}
                            </DialogTitle>
                            <DialogDescription>
                                {document?.type === 'decree' ? 'Décret' : 'Ordonnance'} • Créé le {new Date(document?.created_at).toLocaleDateString()}
                            </DialogDescription>
                        </div>
                        <Badge variant={
                            document?.status === 'signed' ? 'default' :
                                document?.status === 'pending' ? 'secondary' :
                                    'destructive'
                        }>
                            {document?.status === 'signed' ? 'Signé' :
                                document?.status === 'pending' ? 'En attente' :
                                    document?.status === 'revision_needed' ? 'Révision requise' :
                                        document?.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col border-r">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <div className="px-4 border-b bg-muted/30">
                                <TabsList className="bg-transparent">
                                    <TabsTrigger value="preview" className="data-[state=active]:bg-background">Aperçu</TabsTrigger>
                                    <TabsTrigger value="signature" className="data-[state=active]:bg-background">Signature</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="preview" className="flex-1 p-0 m-0 overflow-hidden">
                                <ScrollArea className="h-full p-8">
                                    <div className="max-w-2xl mx-auto bg-white text-black p-12 shadow-sm min-h-[800px] border">
                                        <div className="text-center mb-8">
                                            <h1 className="font-serif font-bold text-2xl uppercase mb-2">République Gabonaise</h1>
                                            <div className="text-sm uppercase tracking-widest mb-6">Union - Travail - Justice</div>
                                            <div className="w-20 h-1 bg-black mx-auto mb-8"></div>
                                            <h2 className="font-serif font-bold text-xl mb-4">{document?.title}</h2>
                                            <div className="text-sm font-mono mb-8">Réf: {document?.reference}</div>
                                        </div>

                                        <div className="font-serif leading-relaxed text-justify space-y-4">
                                            {document?.content ? (
                                                <div dangerouslySetInnerHTML={{ __html: document.content.replace(/\n/g, '<br/>') }} />
                                            ) : (
                                                <p className="text-gray-400 italic text-center">[Contenu du document non disponible]</p>
                                            )}
                                        </div>

                                        <div className="mt-16 flex justify-end">
                                            <div className="text-center w-64">
                                                <div className="mb-4">Fait à Libreville, le {new Date().toLocaleDateString()}</div>
                                                <div className="font-bold mb-12">Le Président de la République</div>
                                                {document?.status === 'signed' && (
                                                    <div className="font-script text-2xl text-blue-900 transform -rotate-6">
                                                        Signé numériquement
                                                    </div>
                                                )}
                                                <div className="border-t border-black pt-2 mt-2">
                                                    {/* Signature placeholder */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="signature" className="flex-1 p-6 flex flex-col items-center justify-center bg-muted/10">
                                <div className="w-full max-w-lg space-y-4">
                                    <div className="text-center mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Apposer votre signature</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Utilisez le pavé ci-dessous pour signer le document numériquement.
                                            Cette action a valeur légale.
                                        </p>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-1 cursor-crosshair">
                                        <canvas
                                            ref={canvasRef}
                                            width={500}
                                            height={200}
                                            className="w-full h-[200px] touch-none"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <Button variant="ghost" size="sm" onClick={clearSignature}>
                                            Effacer
                                        </Button>
                                        <span>Signé par: {document?.signed_by ? 'Président' : 'En attente'}</span>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar - Comments & History */}
                    <div className="w-80 flex flex-col bg-muted/10">
                        <div className="p-4 border-b font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Commentaires & Historique
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {comments.length === 0 ? (
                                    <div className="text-center text-muted-foreground text-sm py-8">
                                        Aucun commentaire
                                    </div>
                                ) : (
                                    comments.map((c) => (
                                        <div key={c.id} className="bg-background p-3 rounded-lg border text-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    Utilisateur
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p>{c.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-background">
                            <Textarea
                                placeholder="Ajouter un commentaire ou une note de révision..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="mb-2 min-h-[80px]"
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={handleAddComment}
                                disabled={!comment.trim()}
                            >
                                Ajouter une note
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-background">
                    <div className="flex justify-between w-full items-center">
                        <Button variant="outline" onClick={onClose}>
                            Fermer
                        </Button>

                        <div className="flex gap-2">
                            {document?.status !== 'signed' && (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={handleRequestRevision}
                                        disabled={signing || loading}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Demander révision
                                    </Button>

                                    {activeTab === 'signature' ? (
                                        <Button
                                            onClick={handleSign}
                                            disabled={signing || loading}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {signing ? "Signature..." : "Valider et Signer"}
                                        </Button>
                                    ) : (
                                        <Button onClick={() => setActiveTab('signature')}>
                                            <PenTool className="w-4 h-4 mr-2" />
                                            Passer à la signature
                                        </Button>
                                    )}
                                </>
                            )}

                            {document?.status === 'signed' && (
                                <Button variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Télécharger PDF
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

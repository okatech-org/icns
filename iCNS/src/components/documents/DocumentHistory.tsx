import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, Download, Trash2, Clock, HardDrive } from "lucide-react";
import { documentGenerationService } from "@/services/documentGenerationService";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  template_used: string;
  file_size: number;
  storage_url: string;
  created_at: string;
  file_path: string;
}

export const DocumentHistory = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await documentGenerationService.getUserDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const url = await documentGenerationService.getDocumentUrl(doc.file_path);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.document_name;
      link.click();
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Supprimer "${doc.document_name}" ?`)) return;

    try {
      await documentGenerationService.deleteDocument(doc.id, doc.file_path);
      setDocuments(documents.filter((d) => d.id !== doc.id));
      toast.success("Document supprimé");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "decret":
        return "destructive";
      case "rapport":
        return "default";
      case "note":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Historique des documents
        </CardTitle>
        <CardDescription>
          {documents.length} document{documents.length > 1 ? "s" : ""} généré{documents.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Aucun document généré</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <FileText className="h-5 w-5 mt-1 text-primary" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium leading-none">{doc.document_name}</h4>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={getTypeColor(doc.document_type)}>
                        {doc.template_used}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(doc.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

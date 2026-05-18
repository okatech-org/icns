import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeedbackDocumentsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentPaths: string[];
  feedbackId: string;
}

export const FeedbackDocumentsViewer = ({
  isOpen,
  onClose,
  documentPaths,
  feedbackId,
}: FeedbackDocumentsViewerProps) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<{ path: string; url: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && documentPaths.length > 0) {
      loadDocuments();
    }
  }, [isOpen, documentPaths]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await Promise.all(
        documentPaths.map(async (path) => {
          const { data } = await supabase.storage
            .from("role-feedback-docs")
            .createSignedUrl(path, 3600); // 1 hour expiry

          const fileType = path.toLowerCase().endsWith(".pdf") ? "pdf" : "image";

          return {
            path,
            url: data?.signedUrl || "",
            type: fileType,
          };
        })
      );

      setDocuments(docs.filter((doc) => doc.url));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("role-feedback-docs")
        .download(path);

      if (error) throw error;

      const fileName = path.split("/").pop() || "document";
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: `${fileName} a été téléchargé`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  const getFileName = (path: string) => {
    return path.split("/").pop() || "document";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents joints ({documentPaths.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun document disponible
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {doc.type === "pdf" ? (
                      <FileText className="h-6 w-6 text-primary" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getFileName(doc.path)}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {doc.type === "pdf" ? "PDF" : "Image"}
                    </p>

                    {doc.type === "image" && (
                      <div className="mt-3">
                        <img
                          src={doc.url}
                          alt={getFileName(doc.path)}
                          className="max-w-full h-auto rounded-lg border"
                          style={{ maxHeight: "300px" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.path)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

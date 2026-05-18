import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FileText, Download, Loader2 } from "lucide-react";
import { documentGenerationService, DOCUMENT_TEMPLATES } from "@/services/documentGenerationService";

export const DocumentGenerator = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [template, setTemplate] = useState<keyof typeof DOCUMENT_TEMPLATES>("rapport");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressStatus("Démarrage...");

    try {
      const result = await documentGenerationService.generateDocument({
        title,
        content,
        template,
        format,
        onProgress: (prog, status) => {
          setProgress(prog);
          setProgressStatus(status);
        },
      });

      // Create a local URL for preview
      const url = URL.createObjectURL(result.blob);
      setGeneratedPdfUrl(url);

      toast.success("Document généré et sauvegardé !");
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error("Erreur lors de la génération du document");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressStatus("");
    }
  };

  const handleDownload = () => {
    if (generatedPdfUrl) {
      const link = document.createElement("a");
      link.href = generatedPdfUrl;
      const extension = format === "docx" ? "docx" : "pdf";
      link.download = `${template}_${title.replace(/\s+/g, "_")}.${extension}`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générateur de documents
          </CardTitle>
          <CardDescription>
            Créez des documents officiels avec mise en page professionnelle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Type de document</Label>
            <Select value={template} onValueChange={(val) => setTemplate(val as keyof typeof DOCUMENT_TEMPLATES)}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decret">
                  Décret - Le Solennel Prestige
                </SelectItem>
                <SelectItem value="rapport">
                  Rapport - Le Républicain Moderne
                </SelectItem>
                <SelectItem value="note">
                  Note de service - L'Exécutif Dynamique
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format de fichier</Label>
            <Select value={format} onValueChange={(val) => setFormat(val as "pdf" | "docx")}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX (Word/Pages)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre du document</Label>
            <Input
              id="title"
              placeholder="Ex: Décret présidentiel n°2024-001"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              placeholder="Entrez le contenu du document..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isGenerating}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressStatus}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer le document
                </>
              )}
            </Button>

            {generatedPdfUrl && (
              <Button
                onClick={handleDownload}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedPdfUrl && format === "pdf" && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du document</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              src={generatedPdfUrl}
              className="w-full h-[600px] border rounded"
              title="PDF Preview"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

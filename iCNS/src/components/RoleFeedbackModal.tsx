import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from 'zod';

interface RoleFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  userEmail: string;
}

const feedbackSchema = z.object({
  roleDescription: z.string()
    .trim()
    .min(10, 'La description du rôle doit contenir au moins 10 caractères')
    .max(1000, 'La description du rôle ne peut pas dépasser 1000 caractères'),
  workDescription: z.string()
    .trim()
    .min(10, 'La description du travail doit contenir au moins 10 caractères')
    .max(2000, 'La description du travail ne peut pas dépasser 2000 caractères'),
  implementationSuggestions: z.string()
    .trim()
    .max(2000, 'Les suggestions ne peuvent pas dépasser 2000 caractères')
    .optional(),
  userEmail: z.string().email('Email invalide'),
});

export const RoleFeedbackModal = ({ isOpen, onClose, roleName, userEmail }: RoleFeedbackModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    roleDescription: "",
    workDescription: "",
    implementationSuggestions: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
        
        if (!isValidType) {
          toast({
            title: "Type de fichier non valide",
            description: `${file.name} n'est pas une image ou un PDF`,
            variant: "destructive",
          });
        }
        if (!isValidSize) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse la taille maximale de 10MB`,
            variant: "destructive",
          });
        }
        
        return isValidType && isValidSize;
      });
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation avec zod
    try {
      feedbackSchema.parse({
        ...formData,
        userEmail
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);

    try {
      // Upload files to storage
      const uploadedFileUrls: string[] = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userEmail}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('role-feedback-docs')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        uploadedFileUrls.push(filePath);
      }

      // Insert feedback into database
      const { error: insertError } = await supabase
        .from('role_feedback')
        .insert({
          user_email: userEmail,
          role_name: roleName,
          role_description: formData.roleDescription,
          work_description: formData.workDescription,
          implementation_suggestions: formData.implementationSuggestions,
          document_paths: uploadedFileUrls,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Feedback envoyé !",
        description: "Votre contribution a été transmise à l'équipe technique.",
      });

      // Reset form
      setFormData({
        roleDescription: "",
        workDescription: "",
        implementationSuggestions: "",
      });
      setFiles([]);
      onClose();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contribuer au développement</DialogTitle>
          <DialogDescription>
            Partagez votre expertise pour améliorer la plateforme selon les besoins réels de votre fonction
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roleDescription">
              Décrivez votre rôle réel *
            </Label>
            <Textarea
              id="roleDescription"
              placeholder="Quelles sont vos responsabilités quotidiennes ? Quelles décisions prenez-vous ?"
              value={formData.roleDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, roleDescription: e.target.value }))}
              required
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="workDescription">
              Décrivez votre travail quotidien *
            </Label>
            <Textarea
              id="workDescription"
              placeholder="Quels types d'informations consultez-vous ? Quels outils utilisez-vous actuellement ?"
              value={formData.workDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
              required
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="suggestions">
              Suggestions d'implémentation
            </Label>
            <Textarea
              id="suggestions"
              placeholder="Comment la plateforme pourrait-elle mieux répondre à vos besoins ? Quelles fonctionnalités seraient utiles ?"
              value={formData.implementationSuggestions}
              onChange={(e) => setFormData(prev => ({ ...prev, implementationSuggestions: e.target.value }))}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Documents joints (PDF, Images)</Label>
            <div className="mt-2">
              <Input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Cliquez pour ajouter des documents</span>
              </Label>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.roleDescription || !formData.workDescription}
            >
              {loading ? "Envoi en cours..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

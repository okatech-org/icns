import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface DocumentMessageProps {
  fileName: string;
  documentType: string;
  recipient: string;
  subject: string;
  onDownload: () => void;
  onPreview: () => void;
}

export const DocumentMessage: React.FC<DocumentMessageProps> = ({
  fileName,
  documentType,
  recipient,
  subject,
  onDownload,
  onPreview,
}) => {
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lettre: 'Lettre officielle',
      decret: 'Décret',
      rapport: 'Rapport',
      note: 'Note',
      nomination: 'Nomination',
      circulaire: 'Circulaire',
    };
    return labels[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    {getDocumentTypeLabel(documentType)}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1 mb-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[80px]">
                    Destinataire:
                  </span>
                  <span className="text-xs">{recipient}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[80px]">
                    Objet:
                  </span>
                  <span className="text-xs line-clamp-2">{subject}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={onPreview}
                  size="sm"
                  variant="default"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button
                  onClick={onDownload}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DocumentMessage;

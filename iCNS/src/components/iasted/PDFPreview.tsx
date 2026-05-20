import React, { useState, useEffect } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface PDFPreviewProps {
  pdfBlob: Blob;
  fileName: string;
  onClose?: () => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ pdfBlob, fileName, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    // Créer une URL pour le blob PDF
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);

    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBlob]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Document généré</h3>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* PDF Preview */}
          <div className="relative bg-muted/20">
            <iframe
              src={pdfUrl}
              className="w-full h-[500px] border-0"
              title={fileName}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PDFPreview;

import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } from "docx";

export interface DocumentTemplate {
  name: string;
  type: "decret" | "rapport" | "note" | "courrier";
  styles: {
    header: {
      fontSize: number;
      bold: boolean;
      alignment: "left" | "center" | "right";
      font?: string;
      color?: string;
    };
    body: {
      fontSize: number;
      lineHeight: number;
      font?: string;
      alignment?: "left" | "center" | "right" | "justify";
    };
    watermark?: boolean;
  };
  layout: string;
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  "decret": {
    name: "Le Solennel Prestige",
    type: "decret",
    styles: {
      header: { fontSize: 16, bold: true, alignment: "center", font: "Times" },
      body: { fontSize: 12, lineHeight: 1.6, alignment: "justify", font: "Times" },
      watermark: true,
    },
    layout: "solemn_prestige",
  },
  "rapport": {
    name: "Le Républicain Moderne",
    type: "rapport",
    styles: {
      header: { fontSize: 14, bold: true, alignment: "center", font: "Roboto" },
      body: { fontSize: 12, lineHeight: 1.5, font: "Times" },
    },
    layout: "standard_modern",
  },
  "note": {
    name: "L'Exécutif Dynamique",
    type: "note",
    styles: {
      header: { fontSize: 12, bold: true, alignment: "left", color: "#009E60" },
      body: { fontSize: 11, lineHeight: 1.3 },
    },
    layout: "executive_dynamic",
  },
};

export interface GenerateDocumentParams {
  title: string;
  content: string;
  template: keyof typeof DOCUMENT_TEMPLATES;
  format?: "pdf" | "docx";
  metadata?: Record<string, any>;
  onProgress?: (progress: number, status: string) => void;
}

export class DocumentGenerationService {
  async generateDocument(params: GenerateDocumentParams): Promise<{
    blob: Blob;
    fileName: string;
    documentId: string;
  }> {
    const { title, content, template, format = "pdf", metadata, onProgress } = params;
    
    if (format === "docx") {
      return this.generateDOCX(params);
    }
    return this.generatePDF(params);
  }

  async generatePDF(params: GenerateDocumentParams): Promise<{
    blob: Blob;
    fileName: string;
    documentId: string;
  }> {
    const { title, content, template, metadata, onProgress } = params;
    const templateConfig = DOCUMENT_TEMPLATES[template];

    try {
      // Step 1: Initialize PDF
      onProgress?.(10, "Initialisation du document...");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Step 2: Apply template styles
      onProgress?.(30, "Application du template...");
      this.applyTemplate(doc, templateConfig, title, content);

      // Step 3: Generate blob
      onProgress?.(60, "Génération du fichier PDF...");
      const pdfBlob = doc.output("blob");

      // Step 4: Upload to Storage
      onProgress?.(80, "Sauvegarde dans le cloud...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileName = `${template}_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-documents")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Step 5: Save metadata to database
      onProgress?.(90, "Enregistrement des métadonnées...");
      const { data: docData, error: docError } = await supabase
        .from("generated_documents")
        .insert({
          user_id: user.id,
          document_name: title,
          document_type: template,
          template_used: templateConfig.name,
          file_path: filePath,
          file_size: pdfBlob.size,
          storage_url: uploadData.path,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (docError) throw docError;

      onProgress?.(100, "Document généré avec succès !");

      return {
        blob: pdfBlob,
        fileName,
        documentId: docData.id,
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }

  private applyTemplate(
    doc: jsPDF,
    template: DocumentTemplate,
    title: string,
    content: string
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Add watermark if enabled
    if (template.styles.watermark) {
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(60);
      doc.text("CONFIDENTIEL", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: 45,
      });
      doc.setTextColor(0, 0, 0);
    }

    // Header section
    doc.setFontSize(template.styles.header.fontSize);
    if (template.styles.header.bold) {
      doc.setFont("helvetica", "bold");
    }

    let yPosition = margin;

    // Add Republic header for official documents
    if (template.type === "decret") {
      doc.setFontSize(10);
      doc.text("RÉPUBLIQUE GABONAISE", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 7;
      doc.text("Unité - Travail - Justice", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }

    // Title
    doc.setFontSize(template.styles.header.fontSize);
    const titleLines = doc.splitTextToSize(title, pageWidth - 2 * margin);
    doc.text(titleLines, pageWidth / 2, yPosition, { align: template.styles.header.alignment });
    yPosition += titleLines.length * 10 + 10;

    // Body content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(template.styles.body.fontSize);

    const contentLines = doc.splitTextToSize(content, pageWidth - 2 * margin);
    const lineHeight = template.styles.body.lineHeight * template.styles.body.fontSize * 0.35;

    contentLines.forEach((line: string) => {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }
  }

  async getUserDocuments(): Promise<any[]> {
    const { data, error } = await supabase
      .from("generated_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDocumentUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from("generated-documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || "";
  }

  async generateDOCX(params: GenerateDocumentParams): Promise<{
    blob: Blob;
    fileName: string;
    documentId: string;
  }> {
    const { title, content, template, metadata, onProgress } = params;
    const templateConfig = DOCUMENT_TEMPLATES[template];

    try {
      // Step 1: Initialize Document
      onProgress?.(10, "Initialisation du document...");

      const paragraphs: Paragraph[] = [];

      // Add Republic header for official documents
      if (templateConfig.type === "decret") {
        paragraphs.push(
          new Paragraph({
            text: "RÉPUBLIQUE GABONAISE",
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Unité - Travail - Justice",
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          })
        );
      }

      // Step 2: Add title
      onProgress?.(30, "Application du template...");
      paragraphs.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: templateConfig.styles.header.alignment === "center" 
            ? AlignmentType.CENTER 
            : templateConfig.styles.header.alignment === "right"
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT,
          spacing: { after: 400 },
        })
      );

      // Step 3: Add content
      const contentParagraphs = content.split('\n').filter(line => line.trim());
      contentParagraphs.forEach(line => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: templateConfig.styles.body.fontSize * 2, // Word uses half-points
              })
            ],
            alignment: templateConfig.styles.body.alignment === "justify"
              ? AlignmentType.JUSTIFIED
              : templateConfig.styles.body.alignment === "center"
              ? AlignmentType.CENTER
              : templateConfig.styles.body.alignment === "right"
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
            spacing: { 
              after: 200,
              line: Math.round(templateConfig.styles.body.lineHeight * 240)
            },
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      // Step 4: Generate blob
      onProgress?.(60, "Génération du fichier DOCX...");
      const docxBlob = await Packer.toBlob(doc);

      // Step 5: Upload to Storage
      onProgress?.(80, "Sauvegarde dans le cloud...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileName = `${template}_${Date.now()}.docx`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-documents")
        .upload(filePath, docxBlob, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Step 6: Save metadata to database
      onProgress?.(90, "Enregistrement des métadonnées...");
      const { data: docData, error: docError } = await supabase
        .from("generated_documents")
        .insert({
          user_id: user.id,
          document_name: title,
          document_type: template,
          template_used: templateConfig.name,
          file_path: filePath,
          file_size: docxBlob.size,
          storage_url: uploadData.path,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (docError) throw docError;

      onProgress?.(100, "Document généré avec succès !");

      return {
        blob: docxBlob,
        fileName,
        documentId: docData.id,
      };
    } catch (error) {
      console.error("Error generating DOCX:", error);
      throw error;
    }
  }

  async deleteDocument(id: string, filePath: string): Promise<void> {
    // Delete from storage
    await supabase.storage.from("generated-documents").remove([filePath]);

    // Delete from database
    const { error } = await supabase
      .from("generated_documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

export const documentGenerationService = new DocumentGenerationService();

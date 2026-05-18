import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { supabase } from '@/integrations/supabase/client';
import emblemGabon from '@/assets/emblem_gabon.png';

// Flag pour s'assurer qu'on initialise qu'une seule fois
let fontsInitialized = false;

// Helper pour convertir une image URL en Base64 avec timeout
async function getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Image load timeout for ${url}`));
        }, 5000); // 5s timeout

        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } else {
                    reject(new Error('Canvas context is null'));
                }
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = error => {
            clearTimeout(timeoutId);
            reject(error);
        };
        img.src = url;
    });
}

// Fonction pour initialiser les fonts de manière lazy
function initializeFonts() {
    if (!fontsInitialized) {
        // Debug logging
        console.log('Initializing PDFMake fonts...');

        let vfs: any = undefined;

        // Check if pdfFonts IS the vfs (contains font files directly)
        if (pdfFonts && Object.keys(pdfFonts).some(k => k.endsWith('.ttf'))) {
            vfs = pdfFonts;
        }
        // Check if pdfFonts.default IS the vfs
        else if ((pdfFonts as any).default && Object.keys((pdfFonts as any).default).some((k: string) => k.endsWith('.ttf'))) {
            vfs = (pdfFonts as any).default;
        }
        // Standard paths
        else {
            vfs = (pdfFonts as any).pdfMake?.vfs
                || (pdfFonts as any).vfs
                || (pdfFonts as any).default?.pdfMake?.vfs
                || (pdfFonts as any).default?.vfs
                || (window as any).pdfMake?.vfs;
        }

        if (vfs) {
            (pdfMake as any).vfs = vfs;
            console.log('PDFMake VFS assigned successfully. Keys:', Object.keys(vfs).slice(0, 3));

            // Configuration des polices
            (pdfMake as any).fonts = {
                Roboto: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                },
                // Mapping de Times vers Roboto (fallback)
                Times: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                }
            };

            fontsInitialized = true;
        } else {
            console.error('CRITICAL: Failed to find PDFMake VFS. Fonts may not load. pdfFonts keys:', Object.keys(pdfFonts));
        }
    }
}

interface DocumentData {
    type: 'lettre' | 'decret' | 'rapport' | 'circulaire' | 'note' | 'nomination' | 'communique';
    recipient: string;
    subject: string;
    content_points?: string[];
    signature_authority?: string;
    reference?: string;
    date?: string;
    serviceContext?: string; // e.g., 'president', 'admin', 'courrier'
    templateStyle?: 'standard_modern' | 'executive_dynamic' | 'solemn_prestige'; // New parameter
}

interface ServiceSettings {
    header_text: string;
    sub_header_text: string;
    footer_text: string;
    logo_url: string;
    margins: { top: number; bottom: number; left: number; right: number };
    primary_color: string;
    secondary_color: string;
}

const DEFAULT_SETTINGS: ServiceSettings = {
    header_text: 'RÉPUBLIQUE GABONAISE',
    sub_header_text: 'Unité - Travail - Justice',
    footer_text: 'Avenue Président Omar Bongo Ondimba - BP 546 - Libreville - Gabon',
    logo_url: '',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    primary_color: '#1e3a8a',
    secondary_color: '#64748b'
};

async function fetchServiceSettings(serviceRole: string): Promise<ServiceSettings> {
    try {
        const { data, error } = await supabase
            .from('service_document_settings' as any)
            .select('*')
            .eq('service_role', serviceRole)
            .single();

        if (data) {
            const settings = data as any;
            return {
                header_text: settings.header_text || DEFAULT_SETTINGS.header_text,
                sub_header_text: settings.sub_header_text || DEFAULT_SETTINGS.sub_header_text,
                footer_text: settings.footer_text || DEFAULT_SETTINGS.footer_text,
                logo_url: settings.logo_url || '',
                margins: settings.margins ? {
                    top: Number(settings.margins.top) * 2.83, // Convert mm to points (approx)
                    bottom: Number(settings.margins.bottom) * 2.83,
                    left: Number(settings.margins.left) * 2.83,
                    right: Number(settings.margins.right) * 2.83
                } : DEFAULT_SETTINGS.margins,
                primary_color: settings.primary_color || DEFAULT_SETTINGS.primary_color,
                secondary_color: settings.secondary_color || DEFAULT_SETTINGS.secondary_color
            };
        }
    } catch (e) {
        console.warn('Failed to fetch service settings, using defaults', e);
    }
    return DEFAULT_SETTINGS;
}

/**
 * Génère un document officiel PDF pour la Présidence Gabonaise
 * Utilise les paramètres de personnalisation du service et les styles améliorés
 */
export async function generateOfficialPDF(data: DocumentData): Promise<Blob> {
    // Initialiser les fonts au premier appel
    initializeFonts();

    const serviceRole = data.serviceContext || 'president';
    const settings = await fetchServiceSettings(serviceRole);
    const templateStyle = data.templateStyle || 'standard_modern'; // Default to modern

    const currentDate = data.date || new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // --- CONFIGURATION DES STYLES SELON LE TEMPLATE ---
    let docStyles: any = {};
    let watermark: any = null;
    let background: any = null;

    // 1. Le Républicain Moderne (Standard Amélioré)
    if (templateStyle === 'standard_modern') {
        docStyles = {
            header: { fontSize: 14, bold: true, color: settings.primary_color, font: 'Roboto' },
            subheader: { fontSize: 10, italics: true, color: settings.secondary_color, font: 'Roboto' },
            documentType: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 20, 0, 20], decoration: 'underline', color: settings.primary_color, font: 'Roboto' },
            bodyText: { fontSize: 12, lineHeight: 1.5, alignment: 'justify', margin: [0, 10, 0, 10], font: 'Times' },
            listItem: { fontSize: 12, lineHeight: 1.5, margin: [0, 5, 0, 5], font: 'Times' },
            signature: { fontSize: 12, bold: true, margin: [0, 40, 0, 5], font: 'Roboto' }
        };
    }
    // 2. L'Exécutif Dynamique (Style Note)
    else if (templateStyle === 'executive_dynamic') {
        docStyles = {
            header: { fontSize: 12, bold: true, color: '#009E60', font: 'Roboto' }, // Vert Gabon
            subheader: { fontSize: 9, italics: true, color: '#333333', font: 'Roboto' },
            documentType: { fontSize: 16, bold: true, alignment: 'left', margin: [0, 10, 0, 10], color: '#009E60', font: 'Roboto' },
            bodyText: { fontSize: 11, lineHeight: 1.3, alignment: 'left', margin: [0, 8, 0, 8], font: 'Roboto' },
            listItem: { fontSize: 11, margin: [0, 4, 0, 4], font: 'Roboto' },
            signature: { fontSize: 11, bold: true, margin: [0, 30, 0, 5], font: 'Roboto' }
        };
        // Bandeau latéral couleur drapeau (simulé par background ou marge)
        // Pour simplifier, on mettra une ligne colorée dans le header
    }
    // 3. Le Solennel Prestige (Décrets)
    else if (templateStyle === 'solemn_prestige') {
        docStyles = {
            header: { fontSize: 16, bold: true, color: '#000000', alignment: 'center', font: 'Times' },
            subheader: { fontSize: 11, italics: true, color: '#444444', alignment: 'center', font: 'Times' },
            documentType: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 30, 0, 30], font: 'Times' },
            bodyText: { fontSize: 13, lineHeight: 1.6, alignment: 'justify', margin: [0, 12, 0, 12], font: 'Times' },
            listItem: { fontSize: 13, lineHeight: 1.6, margin: [0, 6, 0, 6], font: 'Times' },
            signature: { fontSize: 13, bold: true, margin: [0, 50, 0, 10], alignment: 'center', font: 'Times' }
        };
        // Filigrane (Watermark)
        watermark = { text: 'RÉPUBLIQUE GABONAISE', color: 'gray', opacity: 0.1, bold: true, italics: false };
    }

    // Préparer le logo (convertir en base64)
    let logoBase64 = null;
    try {
        // Utiliser le logo personnalisé s'il existe, sinon l'emblème par défaut
        const logoUrl = settings.logo_url || emblemGabon;
        logoBase64 = await getBase64ImageFromURL(logoUrl);
    } catch (e) {
        console.warn('Impossible de charger le logo', e);
    }

    // --- CONSTRUCTION DU HEADER ---
    const header = {
        columns: [
            {
                width: '*',
                stack: [
                    // Logo centré
                    logoBase64 ? {
                        image: logoBase64,
                        width: 60,
                        alignment: 'center',
                        margin: [0, 0, 0, 5]
                    } : {},
                    { text: settings.header_text, style: 'header', alignment: templateStyle === 'executive_dynamic' ? 'left' : 'center' },
                    { text: settings.sub_header_text, style: 'subheader', alignment: templateStyle === 'executive_dynamic' ? 'left' : 'center', margin: [0, 2, 0, 10] },
                    templateStyle === 'executive_dynamic'
                        ? { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 3, lineColor: '#FCD116' }] } // Jaune
                        : { text: '________', alignment: 'center', margin: [0, 0, 0, 5], color: settings.primary_color },
                ]
            }
        ],
        margin: [0, 20, 0, 30]
    };

    // --- CONSTRUCTION DU FOOTER ---
    const footer = (currentPage: number, pageCount: number) => {
        return {
            columns: [
                { text: settings.footer_text, style: 'footer', alignment: 'center' },
            ],
            margin: [40, 10, 40, 20]
        };
    };

    let documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [
            settings.margins.left,
            settings.margins.top,
            settings.margins.right,
            settings.margins.bottom
        ],
        header: header,
        footer: footer,
        watermark: watermark,
        content: [],
        styles: {
            ...docStyles,
            reference: {
                fontSize: 10,
                italics: true,
                color: settings.secondary_color,
                margin: [0, 0, 0, 15]
            },
            metaInfo: {
                fontSize: 11,
                margin: [0, 5, 0, 5]
            },
            footer: {
                fontSize: 8,
                color: '#94a3b8'
            }
        }
    };

    // Construction selon le type de document (Contenu)
    // Le contenu reste le même, seul le style change
    switch (data.type) {
        case 'lettre':
            documentDefinition.content = [
                { text: 'LETTRE D\'INSTRUCTION', style: 'documentType' },
                { text: data.reference || `Réf: ${serviceRole.toUpperCase().substring(0, 3)}/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, style: 'reference', alignment: templateStyle === 'executive_dynamic' ? 'left' : 'right' },
                { text: `Libreville, le ${currentDate}`, style: 'metaInfo', alignment: 'right' },
                { text: '\n' },
                { text: settings.sub_header_text || 'L\'Expéditeur', style: 'metaInfo', bold: true },
                { text: `à`, style: 'metaInfo', margin: [0, 5, 0, 5] },
                { text: data.recipient, style: 'metaInfo', bold: true },
                { text: '\n' },
                { text: `Objet : ${data.subject}`, style: 'metaInfo', bold: true },
                { text: '\n' },
                {
                    text: data.content_points && data.content_points.length > 0
                        ? `J'ai l'honneur de vous transmettre les instructions suivantes :`
                        : `J'ai l'honneur de vous adresser cette correspondance concernant ${data.subject}.`,
                    style: 'bodyText'
                },
                ...(data.content_points || []).map((point, index) => ({
                    text: `${index + 1}. ${point}`,
                    style: 'listItem',
                    margin: [20, 5, 0, 5]
                })),
                { text: '\n' },
                { text: `Je vous prie d'agréer, ${data.recipient}, l'expression de ma haute considération.`, style: 'bodyText' },
                { text: '\n\n' },
                { text: data.signature_authority || settings.sub_header_text, style: 'signature', alignment: templateStyle === 'executive_dynamic' ? 'left' : 'right' },
            ];
            break;

        case 'decret':
            documentDefinition.content = [
                { text: 'DÉCRET', style: 'documentType' },
                { text: data.reference || `N° ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}/PR/${new Date().getFullYear()}`, style: 'reference', alignment: 'center' },
                { text: currentDate, style: 'metaInfo', alignment: 'center' },
                { text: '\n' },
                { text: (data.subject || 'OBJET DU DÉCRET').toUpperCase(), style: 'metaInfo', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: 'LE PRÉSIDENT DE LA RÉPUBLIQUE,', style: 'bodyText', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] },
                { text: 'Vu les textes en vigueur ;', style: 'listItem', margin: [20, 0, 0, 5] },
                { text: '\n' },
                { text: 'DÉCRÈTE :', style: 'bodyText', bold: true, alignment: 'center' },
                { text: '\n' },
                ...(data.content_points || ['Article 1. Le contenu du décret est inséré ici.']).map((point, index) => ({
                    text: point.startsWith('Article') ? point : `Article ${index + 1}. ${point}`,
                    style: 'listItem',
                    margin: [0, 8, 0, 8],
                    bold: true
                })),
                { text: '\n\n' },
                { text: 'Fait à Libreville, le ' + currentDate, style: 'metaInfo', alignment: 'center' },
                { text: '\n' },
                { text: data.signature_authority || 'Le Président de la République', style: 'signature', alignment: 'center' },
            ];
            break;

        case 'communique':
            documentDefinition.content = [
                { text: 'COMMUNIQUÉ', style: 'documentType' },
                { text: currentDate, style: 'metaInfo', alignment: 'right' },
                { text: '\n' },
                { text: (data.subject || 'TITRE DU COMMUNIQUÉ').toUpperCase(), style: 'header', alignment: 'center', margin: [0, 10, 0, 20] },
                { text: '\n' },
                ...(data.content_points || ['Texte du communiqué...']).map((point) => ({
                    text: point,
                    style: 'bodyText',
                    alignment: 'justify',
                    margin: [0, 5, 0, 5]
                })),
                { text: '\n\n' },
                { text: 'La Présidence de la République', style: 'signature', alignment: 'center' },
            ];
            break;

        case 'rapport':
            documentDefinition.content = [
                { text: 'RAPPORT', style: 'documentType' },
                { text: data.subject.toUpperCase(), style: 'metaInfo', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: `Date : ${currentDate}`, style: 'metaInfo' },
                { text: `Destinataire : ${data.recipient}`, style: 'metaInfo' },
                { text: '\n' },
                { text: 'SYNTHÈSE EXÉCUTIVE', style: 'bodyText', bold: true },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: point,
                    style: 'bodyText',
                    margin: [0, 10, 0, 10]
                })),
                { text: '\n\n' },
                { text: 'CONCLUSION', style: 'bodyText', bold: true },
                { text: '\n' },
                { text: `Ce rapport a été établi pour l'information de ${data.recipient}.`, style: 'bodyText' },
                { text: '\n\n' },
                { text: data.signature_authority || settings.sub_header_text, style: 'signature', alignment: 'right' },
            ];
            break;

        case 'circulaire':
            documentDefinition.content = [
                { text: 'CIRCULAIRE', style: 'documentType' },
                { text: data.reference || `N° ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}/PR/CIRC/${new Date().getFullYear()}`, style: 'reference' },
                { text: currentDate, style: 'metaInfo', alignment: 'right' },
                { text: '\n' },
                { text: `Objet : ${data.subject}`, style: 'metaInfo', bold: true },
                { text: `Destinataires : ${data.recipient}`, style: 'metaInfo' },
                { text: '\n' },
                {
                    text: data.content_points && data.content_points.length > 0
                        ? `Il est porté à votre connaissance les dispositions suivantes :`
                        : `La présente circulaire a pour objet de ${data.subject}.`,
                    style: 'bodyText'
                },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: `${index + 1}. ${point}`,
                    style: 'listItem',
                    margin: [20, 5, 0, 5]
                })),
                { text: '\n\n' },
                { text: `Ces dispositions entrent en vigueur à compter de la date de signature de la présente circulaire.`, style: 'bodyText' },
                { text: '\n\n' },
                { text: data.signature_authority || settings.sub_header_text, style: 'signature', alignment: 'right' },
            ];
            break;

        case 'note':
            documentDefinition.content = [
                { text: 'NOTE À L\'ATTENTION DE', style: 'documentType' },
                { text: data.recipient.toUpperCase(), style: 'metaInfo', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: `Objet : ${data.subject}`, style: 'metaInfo', bold: true },
                { text: `Date : ${currentDate}`, style: 'metaInfo' },
                { text: '\n' },
                ...(data.content_points || []).map((point) => ({
                    text: point,
                    style: 'bodyText'
                })),
                { text: '\n\n' },
                { text: data.signature_authority || settings.sub_header_text, style: 'signature', alignment: 'right' },
            ];
            break;

        case 'nomination':
            documentDefinition.content = [
                { text: 'DÉCRET DE NOMINATION', style: 'documentType' },
                { text: data.reference || `N° ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}/PR/NOM/${new Date().getFullYear()}`, style: 'reference', alignment: 'center' },
                { text: currentDate, style: 'metaInfo', alignment: 'center' },
                { text: '\n' },
                { text: 'LE PRÉSIDENT DE LA RÉPUBLIQUE,', style: 'bodyText', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] },
                { text: '\n' },
                { text: 'DÉCRÈTE :', style: 'bodyText', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: `Article 1. ${data.recipient} est nommé(e) ${data.subject}.`, style: 'bodyText', bold: true },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: `Article ${index + 2}. ${point}`,
                    style: 'listItem',
                    margin: [0, 8, 0, 8]
                })),
                { text: '\n\n' },
                { text: 'Fait à Libreville, le ' + currentDate, style: 'metaInfo', alignment: 'center' },
                { text: '\n' },
                { text: data.signature_authority || 'Le Président de la République', style: 'signature', alignment: 'center' },
            ];
            break;
    }

    // Générer le PDF et retourner le Blob avec timeout
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('PDF generation timeout'));
        }, 10000); // 10s timeout

        try {
            const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

            pdfDocGenerator.getBlob((blob) => {
                clearTimeout(timeoutId);
                resolve(blob);
            });
        } catch (e) {
            clearTimeout(timeoutId);
            reject(e);
        }
    });
}

/**
 * Génère un PDF et retourne une URL de téléchargement
 */
export async function generateOfficialPDFWithURL(data: DocumentData): Promise<{ blob: Blob; url: string; filename: string }> {
    const blob = await generateOfficialPDF(data);
    const url = URL.createObjectURL(blob);

    // Générer un nom de fichier descriptif
    const filename = `${data.type}_${data.recipient.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

    return { blob, url, filename };
}

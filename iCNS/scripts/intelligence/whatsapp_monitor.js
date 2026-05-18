/**
 * WhatsApp Intelligence Monitor (Project Lynx Eye)
 * 
 * Ce script est destiné à tourner sur un serveur externe (VPS, Raspberry Pi, etc.).
 * Il se connecte à WhatsApp via QR Code et écoute les messages des groupes.
 * Les messages pertinents sont envoyés à Supabase.
 * 
 * Installation:
 * npm install whatsapp-web.js qrcode-terminal @supabase/supabase-js dotenv
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utiliser la clé Service Role pour écrire
const supabase = createClient(supabaseUrl, supabaseKey);

// Mots-clés à surveiller (Regex)
const KEYWORDS = /gabon|libreville|oligui|ctri|grève|économie|route|décret|coupure|eau|seeg/i;

// Initialisation du client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
    console.log('Scannez ce QR code avec WhatsApp pour connecter le bot.');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Monitor is ready!');
    console.log('Listening for messages...');
});

client.on('message', async (msg) => {
    try {
        // Ignorer les statuts et les messages médias sans texte
        if (msg.isStatus || !msg.body) return;

        // Récupérer les infos du chat
        const chat = await msg.getChat();

        // On s'intéresse surtout aux groupes
        if (chat.isGroup) {
            // Vérifier si le message contient des mots-clés
            if (KEYWORDS.test(msg.body)) {
                console.log(`🚨 Message pertinent détecté dans ${chat.name}`);

                // Anonymisation basique de l'auteur
                const authorHash = Buffer.from(msg.author || msg.from).toString('base64').substring(0, 10);

                // Envoi vers Supabase
                const { data, error } = await supabase
                    .from('intelligence_items')
                    .insert({
                        source_id: null, // À lier si on gère une table de sources dynamique
                        external_id: msg.id.id,
                        content: msg.body,
                        author: `whatsapp_user_${authorHash}`,
                        category: 'rumeur', // Sera re-qualifié par l'IA
                        summary: `Message du groupe ${chat.name}`, // Sera écrasé par l'IA
                        published_at: new Date(msg.timestamp * 1000).toISOString()
                    });

                if (error) {
                    console.error('❌ Erreur Supabase:', error);
                } else {
                    console.log('✅ Sauvegardé dans Supabase');
                }
            }
        }
    } catch (err) {
        console.error('Erreur de traitement:', err);
    }
});

client.initialize();

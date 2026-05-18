/**
 * Hook pour conversation vocale en temps réel avec OpenAI via WebRTC
 * Plus robuste et direct que l'approche WebSocket
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mergeRoleContexts } from '@/utils/contextMerger';
import { ROLE_CONTEXTS, type AppRole } from '@/config/role-contexts';
import { getRouteKnowledgePrompt } from '@/utils/route-mapping';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

class AudioRecorder {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;

    constructor(private onAudioData: (audioData: Float32Array) => void) { }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.audioContext = new AudioContext({
                sampleRate: 24000,
            });

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                this.onAudioData(new Float32Array(inputData));
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
        } catch (error) {
            console.error('❌ [AudioRecorder] Erreur accès microphone:', error);
            throw error;
        }
    }

    stop() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export interface UseRealtimeVoiceWebRTC {
    isConnected: boolean;
    isConnecting: boolean;
    voiceState: 'idle' | 'listening' | 'processing' | 'speaking' | 'thinking' | 'connecting';
    messages: any[];
    audioLevel: number;
    speechRate: number;
    setSpeechRate: (rate: number) => void;
    connect: (voice?: 'echo' | 'ash' | 'alloy' | 'shimmer', systemPrompt?: string) => Promise<void>;
    disconnect: () => void;
    toggleConversation: (voice?: 'echo' | 'ash' | 'alloy' | 'shimmer') => Promise<void>;
    clearSession: () => void;
}

export const useRealtimeVoiceWebRTC = (onToolCall?: (name: string, args: any) => void): UseRealtimeVoiceWebRTC => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElRef = useRef<HTMLAudioElement | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const [speechRate, setSpeechRate] = useState(1.0); // 0.5 to 2.0
    const speechRateRef = useRef(1.0); // Ref pour éviter les closures

    // Fonction pour appliquer le playbackRate de manière robuste
    const applyPlaybackRate = useCallback((rate: number) => {
        if (audioElRef.current) {
            audioElRef.current.playbackRate = rate;
            console.log('🎚️ [WebRTC] PlaybackRate appliqué:', rate);
        }
    }, []);

    // Mettre à jour le playbackRate quand speechRate change
    useEffect(() => {
        speechRateRef.current = speechRate;
        applyPlaybackRate(speechRate);
    }, [speechRate, applyPlaybackRate]);

    // Réappliquer le playbackRate sur les événements audio
    useEffect(() => {
        const audioEl = audioElRef.current;
        if (!audioEl) return;

        const handlePlay = () => {
            console.log('🎵 [WebRTC] Audio playing, réapplication du playbackRate');
            applyPlaybackRate(speechRateRef.current);
        };

        const handleLoadedData = () => {
            console.log('📦 [WebRTC] Audio data loaded, application du playbackRate');
            applyPlaybackRate(speechRateRef.current);
        };

        audioEl.addEventListener('playing', handlePlay);
        audioEl.addEventListener('loadeddata', handleLoadedData);

        return () => {
            audioEl.removeEventListener('playing', handlePlay);
            audioEl.removeEventListener('loadeddata', handleLoadedData);
        };
    }, [applyPlaybackRate]);
    const currentTranscriptRef = useRef<string>('');
    const systemPromptRef = useRef<string | undefined>(undefined);
    const [pendingVoiceChange, setPendingVoiceChange] = useState<string | null>(null);
    const isConnectingRef = useRef<boolean>(false);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const { toast } = useToast();

    // Fonction pour analyser le volume
    const startAudioAnalysis = useCallback((stream: MediaStream, audioContext: AudioContext) => {
        if (analyserRef.current) return;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculer la moyenne du volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;

            // Normaliser entre 0 et 1 (avec un seuil de bruit)
            const normalized = Math.max(0, (average - 10) / 100); // Ajuster selon sensibilité
            setAudioLevel(prev => prev * 0.8 + normalized * 0.2); // Lissage

            animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
    }, []);

    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        analyserRef.current = null;
    }, []);

    const encodeAudioData = useCallback((float32Array: Float32Array): string => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const uint8Array = new Uint8Array(int16Array.buffer);
        let binary = '';
        const chunkSize = 0x8000;

        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode(...Array.from(chunk));
        }

        return btoa(binary);
    }, []);


    const handleDataChannelMessage = useCallback(async (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 [WebRTC] Message reçu:', data.type);

            switch (data.type) {
                case 'session.created':
                    console.log('✅ [WebRTC] Session créée');
                    setVoiceState('listening');
                    break;

                case 'input_audio_buffer.speech_started':
                    console.log('🗣️ [WebRTC] Parole détectée');
                    setVoiceState('listening');
                    break;

                case 'input_audio_buffer.speech_stopped':
                    console.log('🤐 [WebRTC] Fin de parole');
                    setVoiceState('thinking');
                    break;

                case 'conversation.item.input_audio_transcription.completed':
                    const userTranscript = data.transcript;
                    console.log('📝 [WebRTC] Transcription utilisateur:', userTranscript);
                    currentTranscriptRef.current = userTranscript;

                    setMessages(prev => [...prev, {
                        id: crypto.randomUUID(),
                        role: 'user',
                        content: userTranscript,
                        timestamp: new Date().toISOString()
                    }]);
                    break;

                case 'response.audio_transcript.delta':
                    currentTranscriptRef.current += data.delta;
                    break;

                case 'response.audio_transcript.done':
                    const assistantTranscript = data.transcript || currentTranscriptRef.current;
                    if (assistantTranscript) {
                        console.log('📝 [WebRTC] Transcription assistant:', assistantTranscript);
                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: assistantTranscript,
                            timestamp: new Date().toISOString()
                        }]);
                        currentTranscriptRef.current = '';
                    }
                    break;

                case 'response.audio.delta':
                    if (voiceState !== 'speaking') {
                        setVoiceState('speaking');
                    }
                    break;

                case 'response.audio.done':
                    console.log('✅ [WebRTC] Audio terminé');
                    break;

                case 'response.done':
                    console.log('✅ [WebRTC] Réponse complète');
                    setVoiceState('listening');
                    break;

                case 'response.function_call_arguments.done':
                    const functionName = data.name;
                    const args = JSON.parse(data.arguments);
                    console.log(`🛠️ [WebRTC] Appel d'outil: ${functionName}`, args);

                    // Gérer stop_conversation en interne (déconnexion)
                    if (functionName === 'stop_conversation') {
                        console.log('🛑 [WebRTC] Arrêt de la conversation demandé');
                        setVoiceState('idle');
                        // Fermer la connexion après un court délai (laisser l'AI confirmer)
                        setTimeout(() => {
                            if (pcRef.current) {
                                pcRef.current.close();
                                pcRef.current = null;
                            }
                            if (dcRef.current) {
                                dcRef.current.close();
                                dcRef.current = null;
                            }
                            if (recorderRef.current) {
                                recorderRef.current.stop();
                                recorderRef.current = null;
                            }
                            stopAudioAnalysis();
                            setIsConnected(false);
                            setMessages([]);
                        }, 1500);

                        // Pas besoin de response.create, on arrête
                        break;
                    }

                    // Gérer le changement de voix en interne
                    if (functionName === 'change_voice') {
                        setPendingVoiceChange(args.voice_id);
                    }

                    // Gérer le changement de contexte (Chameleon Mode) pour le Super Admin
                    if (functionName === 'global_navigate' && args.target_role) {
                        console.log('🦎 [WebRTC] Chameleon Mode: Switching context to', args.target_role);
                        const adminContext = ROLE_CONTEXTS['admin'];
                        if (adminContext) {
                            const newContext = mergeRoleContexts(adminContext, args.target_role as AppRole);

                            // Mettre à jour la session avec le nouveau prompt
                            const updateEvent = {
                                type: 'session.update',
                                session: {
                                    instructions: newContext.contextDescription + "\n\n" + (systemPromptRef.current || "")
                                }
                            };
                            dcRef.current?.send(JSON.stringify(updateEvent));
                        }
                    }

                    // Exécuter l'outil côté client et attendre le résultat
                    let toolResult = { success: true, message: "Action exécutée" };

                    if (onToolCall) {
                        try {
                            // Execute tool and get result (support async)
                            const executionResult = await onToolCall(functionName, args);

                            // If result is an object with success property, use it
                            if (executionResult !== undefined && typeof executionResult === 'object' && executionResult !== null) {
                                const result = executionResult as Record<string, any>;
                                if ('success' in result && 'message' in result) {
                                    toolResult = result as { success: boolean; message: string };
                                }
                            }
                            // Otherwise assume success (void or no return means it executed)
                        } catch (error: any) {
                            console.error('❌ [WebRTC] Tool execution error:', error);
                            toolResult = { success: false, message: error.message || "Erreur d'exécution" };
                        }
                    }

                    console.log('📤 [WebRTC] Sending tool result to AI:', toolResult);

                    // Envoyer le résultat réel (success/failure) au modèle
                    const toolOutput = {
                        type: 'conversation.item.create',
                        item: {
                            type: 'function_call_output',
                            call_id: data.call_id,
                            output: JSON.stringify(toolResult)
                        }
                    };
                    dcRef.current?.send(JSON.stringify(toolOutput));

                    // Demander une nouvelle réponse
                    dcRef.current?.send(JSON.stringify({ type: 'response.create' }));
                    break;

                case 'error':
                    console.error('❌ [WebRTC] Erreur:', data.error);
                    toast({
                        title: 'Erreur',
                        description: data.error?.message || 'Une erreur est survenue',
                        variant: 'destructive',
                    });
                    break;
            }
        } catch (error) {
            console.error('❌ [WebRTC] Erreur traitement message:', error);
        }
    }, [voiceState, toast, onToolCall]);



    const connect = useCallback(async (voice: 'echo' | 'ash' | 'shimmer' = 'echo', systemPrompt?: string) => {
        // Preserve systemPrompt for reconnections
        if (systemPrompt) {
            systemPromptRef.current = systemPrompt;
        }

        // Prevent simultaneous connections
        if (pcRef.current || isConnectingRef.current) {
            console.log('⚠️ [WebRTC] Connexion déjà en cours ou active');
            return;
        }

        isConnectingRef.current = true;

        try {
            console.log('🔌 [WebRTC] Connexion...');
            setVoiceState('connecting');

            // 1. Obtenir le token éphémère
            console.log('🔑 [WebRTC] Demande token...');

            // S'assurer d'avoir la session courante
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Non authentifié");
            }

            const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-realtime-token', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (tokenError || !tokenData) {
                throw new Error('Impossible d\'obtenir le token: ' + (tokenError?.message || 'Pas de données'));
            }

            if (!tokenData.client_secret?.value) {
                throw new Error("Token invalide");
            }

            const EPHEMERAL_KEY = tokenData.client_secret.value;
            console.log('✅ [WebRTC] Token obtenu');

            // 2. Créer la connexion peer
            pcRef.current = new RTCPeerConnection();

            // 3. Configurer l'audio distant
            if (!audioElRef.current) {
                audioElRef.current = document.createElement("audio");
                audioElRef.current.autoplay = true;
            }

            pcRef.current.ontrack = (e) => {
                console.log('🎵 [WebRTC] Track audio reçu');
                if (audioElRef.current) {
                    audioElRef.current.srcObject = e.streams[0];

                    // Appliquer immédiatement le playbackRate
                    applyPlaybackRate(speechRateRef.current);

                    // Force l'application après un délai pour s'assurer qu'il est bien pris en compte
                    setTimeout(() => applyPlaybackRate(speechRateRef.current), 100);
                    setTimeout(() => applyPlaybackRate(speechRateRef.current), 500);
                }
            };

            // 4. Ajouter le track audio local
            const ms = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            pcRef.current.addTrack(ms.getTracks()[0]);
            console.log('🎤 [WebRTC] Audio local ajouté');

            // Démarrer l'analyse du volume local
            if (!recorderRef.current) {
                // On utilise l'AudioContext existant ou on en crée un pour l'analyse
                const ac = new AudioContext();
                startAudioAnalysis(ms, ac);
            }

            // 5. Configurer le canal de données
            dcRef.current = pcRef.current.createDataChannel("oai-events");
            dcRef.current.addEventListener("message", handleDataChannelMessage);

            // Attendre que le canal soit ouvert pour envoyer la config
            dcRef.current.addEventListener("open", () => {
                console.log('📡 [WebRTC] Canal de données ouvert, configuration de la voix:', voice);

                // Instructions système enrichies pour le contrôle de l'interface
                // Si un systemPrompt est fourni (depuis SuperAdminContext), on l'utilise avec les compléments
                // Sinon on utilise un prompt par défaut basique
                const baseInstructions = systemPrompt || (voice === 'ash'
                    ? "Vous êtes iAsted, l'assistant vocal intelligent de la Présidence de la République Gabonaise. Vous avez une voix posée, grave et sage, avec un accent africain francophone subtil et distingué."
                    : "Vous êtes iAsted, l'assistant vocal intelligent de la Présidence de la République Gabonaise. Vous êtes professionnel, dynamique et efficace.");

                // Compléter avec les instructions de contrôle (communes à tous les espaces)
                const controlInstructions = `

# OUTILS ET CAPACITÉS
Vous avez accès à plusieurs outils pour interagir avec l'interface :

**Navigation:**
- 'navigate_to_section' : Ouvrir une section spécifique de l'application
- 'global_navigate' : Naviguer vers une autre route/espace

**Interface:**
- 'control_ui' : Changer le thème, ajuster les paramètres d'affichage, vitesse de parole
  - Exemples thème : "Mets le mode sombre" → action='set_theme_dark'
  - "Mets le mode clair" → action='set_theme_light'
  - Exemples VITESSE PHYSIQUE : "Parle plus vite" → action='set_speech_rate', value='1.3'
  - "Accélère", "Parle plus rapidement" → action='set_speech_rate', value='1.3' à '1.5'
  - "Parle plus lentement", "Ralentis" → action='set_speech_rate', value='0.7'
  - "Vitesse normale" → action='set_speech_rate', value='1.0'
  - **⚠️ NE PAS CONFONDRE** : "Résume" ou "Synthétise" = contenu plus court, PAS de vitesse
  - **Plage recommandée vitesse** : x1.2 à x1.5 (rapide), x0.7 à x0.8 (lent), 1.0 = normal
  - **Tu DOIS ajuster ta vitesse physique dès que l'utilisateur le demande**

**Documents:**
- 'generate_document' : Créer un document officiel (décret, note, lettre)
- 'control_document' : Ouvrir/fermer/gérer un document

**Conversation:**
- 'open_chat' / 'close_chat' : Ouvrir/fermer chat interface de chat
- 'change_voice' : Changer la voix (ash, shimmer, echo)
- 'manage_history' : Gérer l'historique de conversation
- 'stop_conversation' : Arrêter la conversation

**Actions:**
- Utilise les outils dès que l'utilisateur le demande
- Sois proactif et propose des actions pertinentes
- IMPORTANT : Salue l'utilisateur au démarrage
`;

                // Obtenir la cartographie des routes disponibles
                const routeKnowledge = getRouteKnowledgePrompt();

                // Combiner tout : contexte utilisateur + routes + outils
                const finalInstructions = `${baseInstructions}

${routeKnowledge}

${controlInstructions}`;


                const event = {
                    type: 'session.update',
                    session: {
                        voice: voice,
                        instructions: finalInstructions,
                        tool_choice: 'auto',
                        tools: [
                            {
                                type: 'function',
                                name: 'open_chat',
                                description: 'Ouvre la fenêtre de chat pour afficher la transcription et l\'historique.'
                            },
                            {
                                type: 'function',
                                name: 'close_chat',
                                description: 'Ferme la fenêtre de chat pour revenir au mode vocal pur.'
                            },
                            {
                                type: 'function',
                                name: 'stop_conversation',
                                description: 'Arrête la conversation vocale et ferme l\'interface.'
                            },
                            {
                                type: 'function',
                                name: 'navigate_to_section',
                                description: 'Navigue vers une section spécifique DANS l\'espace actuel. Utilise cet outil pour ouvrir/déplier des sections locales (ex: dashboard, documents, users). NE PAS utiliser pour changer d\'espace/page (utilise global_navigate pour ça).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        section_id: {
                                            type: 'string',
                                            description: 'ID technique de la section en minuscules et en anglais (ex: "dashboard", "documents", "navigation", "users", "config")'
                                        }
                                    },
                                    required: ['section_id']
                                }
                            },
                            {
                                type: 'function',
                                name: 'global_navigate',
                                description: 'Navigue vers un autre ESPACE ou PAGE de l\'application (changement de route). Utilise cet outil pour aller vers president-space, admin-space, demo, home, etc. NE PAS utiliser pour les sections locales (utilise navigate_to_section pour ça).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        query: {
                                            type: 'string',
                                            description: 'Terme simple ou chemin de la route (ex: "president", "admin", "demo", "home", "/president-space", "/admin-space", "/")'
                                        }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                type: 'function',
                                name: 'change_voice',
                                description: 'Change la voix et la personnalité de l\'assistant.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        voice_id: {
                                            type: 'string',
                                            enum: ['ash', 'shimmer', 'echo'],
                                            description: 'ID de la voix: ash (homme sérieux), shimmer (femme douce), echo (homme standard)'
                                        }
                                    },
                                    required: ['voice_id']
                                }
                            },
                            {
                                type: 'function',
                                name: 'search_web',
                                description: 'Recherche des informations sur internet. Utilise cet outil pour obtenir des informations récentes, des actualités, des données économiques ou tout sujet qui ne figure pas dans ta base de connaissances interne.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        query: {
                                            type: 'string',
                                            description: 'La requête de recherche précise.'
                                        }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                type: 'function',
                                name: 'manage_history',
                                description: 'Gère l\'historique de la conversation (effacer).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        action: {
                                            type: 'string',
                                            enum: ['clear'],
                                            description: 'Action à effectuer: "clear" pour effacer l\'historique visible.'
                                        }
                                    },
                                    required: ['action']
                                }
                            },
                            {
                                type: 'function',
                                name: 'control_ui',
                                description: 'Contrôle les éléments de l\'interface utilisateur (thème, volume, etc.).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        action: {
                                            type: 'string',
                                            enum: ['toggle_theme', 'set_theme_dark', 'set_theme_light', 'toggle_sidebar', 'set_volume', 'set_speech_rate'],
                                            description: 'Action à effectuer.'
                                        },
                                        value: {
                                            type: 'string',
                                            description: 'Valeur optionnelle pour l\'action (ex: niveau de volume, vitesse)'
                                        }
                                    },
                                    required: ['action']
                                }
                            },
                            {
                                type: 'function',
                                name: 'control_document',
                                description: 'Actions sur les documents (ouvrir, fermer, archiver).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        action: {
                                            type: 'string',
                                            enum: ['open_viewer', 'close_viewer', 'archive', 'validate'],
                                            description: 'Action à effectuer sur le document.'
                                        },
                                        document_id: {
                                            type: 'string',
                                            description: 'ID du document concerné (optionnel si contexte évident)'
                                        }
                                    },
                                    required: ['action']
                                }
                            },
                            {
                                type: 'function',
                                name: 'generate_document',
                                description: 'Génère un document officiel (PDF ou Docx).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['decret', 'nomination', 'lettre', 'note'] },
                                        format: { type: 'string', enum: ['pdf', 'docx'] },
                                        recipient: { type: 'string' },
                                        subject: { type: 'string' },
                                        content_points: { type: 'array', items: { type: 'string' } }
                                    },
                                    required: ['type', 'recipient', 'subject']
                                }
                            },
                            {
                                type: 'function',
                                name: 'search_knowledge',
                                description: 'Recherche des informations dans la base de connaissances (WhatsApp, Web, YouTube) pour répondre aux questions sur l\'actualité, la sécurité, l\'économie, etc.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        query: {
                                            type: 'string',
                                            description: 'La question ou les mots-clés à rechercher (ex: "Grève port-gentil", "Rumeurs coup d\'état", "Prix du carburant")'
                                        }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                type: 'function',
                                name: 'manage_history',
                                description: 'Gère l\'historique de la conversation (supprimer, modifier).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        action: {
                                            type: 'string',
                                            enum: ['delete_all', 'delete_last'],
                                            description: 'Action à effectuer sur l\'historique.'
                                        }
                                    },
                                    required: ['action']
                                }
                            },
                            {
                                type: 'function',
                                name: 'logout_user',
                                description: 'Déconnecte l\'utilisateur de sa session actuelle.',
                                parameters: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            },
                            {
                                type: 'function',
                                name: 'global_navigate',
                                description: '[SUPER ADMIN ONLY] Navigue vers n\'importe quelle route. L\'utilisateur peut demander en langage naturel (ex: "va à l\'accueil", "espace président"). Tu DOIS traduire vers le chemin exact en utilisant la cartographie fournie.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        query: { type: 'string', description: 'Demande de l\'utilisateur en langage naturel (ex: "page d\'accueil", "espace président")' },
                                        target_role: { type: 'string', description: 'Rôle associé (optionnel, pour le mode Caméléon)' }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                type: 'function',
                                name: 'security_override',
                                description: '[SUPER ADMIN ONLY] Outrepasse les sécurités (PIN, Cadenas) pour accéder aux zones restreintes.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        action: { type: 'string', enum: ['unlock_admin_access'], description: 'Action de sécurité à effectuer' }
                                    },
                                    required: ['action']
                                }
                            }
                        ]
                    }
                };
                dcRef.current?.send(JSON.stringify(event));
            });

            console.log('📡 [WebRTC] Canal de données créé');

            // 6. Créer l'offre
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            console.log('📤 [WebRTC] Offre créée');

            // 7. Envoyer l'offre à OpenAI
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-4o-realtime-preview-2024-12-17";

            console.log('🌐 [WebRTC] Connexion à OpenAI...');
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp"
                },
            });

            if (!sdpResponse.ok) {
                throw new Error(`OpenAI connection failed: ${sdpResponse.status}`);
            }

            const answer: RTCSessionDescriptionInit = {
                type: "answer",
                sdp: await sdpResponse.text(),
            };

            await pcRef.current.setRemoteDescription(answer);
            console.log('✅ [WebRTC] Connexion établie');

            setIsConnected(true);
            isConnectingRef.current = false;

            toast({
                title: 'Connecté',
                description: 'iAsted est prêt à vous écouter',
            });

            // NOUVEAU: Forcer l'agent à saluer immédiatement
            // On attend que le canal de données soit ouvert, puis on déclenche une réponse
            // Le délai permet au session.update d'être traité avant
            setTimeout(() => {
                if (dcRef.current && dcRef.current.readyState === 'open') {
                    console.log('👋 [WebRTC] Déclenchement de la salutation initiale');
                    dcRef.current.send(JSON.stringify({
                        type: 'response.create',
                        response: {
                            modalities: ['text', 'audio'],
                            instructions: "Saluez immédiatement l'utilisateur de manière brève et professionnelle."
                        }
                    }));
                }
            }, 1000); // Délai de 1 seconde pour s'assurer que tout est prêt

        } catch (error) {
            console.error('❌ [WebRTC] Erreur connexion:', error);
            setVoiceState('idle');

            // Nettoyage en cas d'erreur
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }

            isConnectingRef.current = false;

            toast({
                title: 'Erreur de connexion',
                description: error instanceof Error ? error.message : 'Impossible de se connecter à iAsted',
                variant: 'destructive',
            });
        }
    }, [handleDataChannelMessage, toast, startAudioAnalysis, speechRate]);

    const disconnect = useCallback(async () => {
        console.log('🔌 [WebRTC] Déconnexion...');

        if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
        }

        if (dcRef.current) {
            dcRef.current.close();
            dcRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (audioElRef.current) {
            audioElRef.current.srcObject = null;
        }

        stopAudioAnalysis();
        setIsConnected(false);
        setVoiceState('idle');
        currentTranscriptRef.current = '';

        // Wait for cleanup to complete before allowing reconnection
        await new Promise(resolve => setTimeout(resolve, 300));
    }, [stopAudioAnalysis]);

    // Effet pour gérer le changement de voix asynchrone
    useEffect(() => {
        if (pendingVoiceChange && !isConnectingRef.current) {
            const voice = pendingVoiceChange as 'echo' | 'ash' | 'shimmer';
            console.log('🔄 [WebRTC] Changement de voix demandé:', voice);
            setPendingVoiceChange(null);

            // Séquence de reconnexion avec préservation du systemPrompt
            const performVoiceChange = async () => {
                await disconnect();
                // Petit délai pour assurer le nettoyage
                setTimeout(() => connect(voice, systemPromptRef.current), 500);
            };

            performVoiceChange();
        }
    }, [pendingVoiceChange, disconnect, connect]);



    const toggleConversation = useCallback(async (voice: 'echo' | 'ash' = 'echo', systemPrompt?: string) => {
        if (isConnected) {
            await disconnect();
        } else {
            await connect(voice, systemPrompt);
        }
    }, [isConnected, connect, disconnect]);

    return {
        isConnecting: voiceState === 'connecting',
        voiceState,
        messages,
        isConnected,
        audioLevel, // Expose audio level
        speechRate,
        setSpeechRate: (rate: number) => {
            const clampedRate = Math.max(0.5, Math.min(2.0, rate));
            setSpeechRate(clampedRate);
            if (audioElRef.current) {
                audioElRef.current.playbackRate = clampedRate;
            }
            console.log(`🎤 [WebRTC] Speech rate set to ${clampedRate}x`);
        },
        connect,
        disconnect,
        toggleConversation,
        clearSession: () => setMessages([]),
    };
};

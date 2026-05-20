/**
 * Hook conversationnel iAsted — basé sur la Web Speech API native
 *
 * Le nom historique est conservé pour ne casser aucun appelant. En interne, on
 * a remplacé OpenAI Realtime WebRTC par la pile Web Speech du navigateur :
 *   - SpeechRecognition pour la transcription (STT)
 *   - speechSynthesis pour la voix (TTS)
 *   - un moteur d'intentions local qui mappe la transcription vers les
 *     outils existants (navigate_to_section, control_ui, change_voice, ...).
 *
 * Cela permet à iAsted de parler dès la connexion ET d'exécuter les
 * commandes vocales sans clé API externe ni token éphémère. La sortie
 * `onToolCall(name, args)` est strictement compatible avec l'ancienne
 * implémentation, donc IAstedInterface, PresidentSpace, DgssSpace... ne
 * voient aucune différence côté contrat.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { classifyIntent, type Intent } from '@/lib/iasted/intent-engine';
import { iAstedSoul } from '@/lib/iasted/soul';
import { executePageAction } from '@/lib/iasted/page-context-store';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';
type VoiceId = 'echo' | 'ash' | 'alloy' | 'shimmer';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface UseRealtimeVoiceWebRTC {
    isConnected: boolean;
    isConnecting: boolean;
    voiceState: 'idle' | 'listening' | 'processing' | 'speaking' | 'thinking' | 'connecting';
    messages: any[];
    audioLevel: number;
    speechRate: number;
    setSpeechRate: (rate: number) => void;
    connect: (voice?: VoiceId, systemPrompt?: string) => Promise<void>;
    disconnect: () => void;
    toggleConversation: (voice?: VoiceId) => Promise<void>;
    clearSession: () => void;
}

// ─── Polyfill cross-browser pour SpeechRecognition ────────────────────────
type SpeechRecognitionCtor = new () => any;
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as SpeechRecognitionCtor | null;
}

// ─── Sélection d'une voix française pour la TTS ───────────────────────────
function pickFrenchVoice(synth: SpeechSynthesis, voiceHint: VoiceId): SpeechSynthesisVoice | null {
    const voices = synth.getVoices();
    if (voices.length === 0) return null;

    const wantsFemale = voiceHint === 'shimmer';
    const frenchVoices = voices.filter(v => v.lang?.toLowerCase().startsWith('fr'));

    if (frenchVoices.length === 0) {
        return voices[0] ?? null;
    }

    const maleNames = ['thomas', 'daniel', 'paul', 'henri', 'antoine', 'sebastien', 'jacques'];
    const femaleNames = ['amelie', 'amélie', 'audrey', 'celine', 'céline', 'marie', 'virginie'];

    const isFemale = (v: SpeechSynthesisVoice) =>
        femaleNames.some(n => v.name.toLowerCase().includes(n));
    const isMale = (v: SpeechSynthesisVoice) =>
        maleNames.some(n => v.name.toLowerCase().includes(n));

    if (wantsFemale) {
        const f = frenchVoices.find(isFemale);
        if (f) return f;
    } else {
        const m = frenchVoices.find(isMale);
        if (m) return m;
    }

    return frenchVoices[0];
}

export const useRealtimeVoiceWebRTC = (
    onToolCall?: (name: string, args: any) => any | Promise<any>,
): UseRealtimeVoiceWebRTC => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [speechRate, setSpeechRate] = useState(1.0);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const currentVoiceRef = useRef<VoiceId>('ash');
    const speechRateRef = useRef<number>(1.0);
    const isConnectedRef = useRef<boolean>(false);
    const isSpeakingRef = useRef<boolean>(false);
    const shouldRestartRef = useRef<boolean>(false);

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        speechRateRef.current = speechRate;
    }, [speechRate]);

    const startAudioMeter = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
            mediaStreamRef.current = stream;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;

            const data = new Uint8Array(analyser.frequencyBinCount);
            const loop = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i];
                const avg = sum / data.length;
                const normalized = Math.max(0, (avg - 10) / 100);
                setAudioLevel(prev => prev * 0.8 + normalized * 0.2);
                animFrameRef.current = requestAnimationFrame(loop);
            };
            loop();
            return true;
        } catch (e) {
            console.warn('🎤 [iAsted] Micro indisponible pour la jauge audio:', e);
            return false;
        }
    }, []);

    const stopAudioMeter = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        analyserRef.current = null;
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        setAudioLevel(0);
    }, []);

    const stopRecognition = useCallback(() => {
        shouldRestartRef.current = false;
        const r = recognitionRef.current;
        if (r) {
            try {
                r.onend = null;
                r.onresult = null;
                r.onerror = null;
                r.stop();
            } catch { /* noop */ }
            recognitionRef.current = null;
        }
    }, []);

    const disconnectInternal = useCallback(() => {
        console.log('🔌 [iAsted] Déconnexion');
        shouldRestartRef.current = false;
        stopRecognition();
        stopAudioMeter();

        const synth = synthRef.current ?? (typeof window !== 'undefined' ? window.speechSynthesis : null);
        if (synth) {
            try { synth.cancel(); } catch { /* noop */ }
        }

        isConnectedRef.current = false;
        isSpeakingRef.current = false;
        setIsConnected(false);
        setVoiceState('idle');
        iAstedSoul.sleep(); // reset context, lifecycle, hasGreeted
    }, [stopRecognition, stopAudioMeter]);

    const speak = useCallback(
        (text: string, opts?: { onEnd?: () => void }) => {
            if (!text || typeof window === 'undefined') {
                opts?.onEnd?.();
                return;
            }
            const synth = synthRef.current ?? window.speechSynthesis;
            synthRef.current = synth;
            if (!synth) {
                opts?.onEnd?.();
                return;
            }

            try { synth.cancel(); } catch { /* noop */ }
            try { recognitionRef.current?.stop?.(); } catch { /* noop */ }

            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'fr-FR';
            utter.rate = speechRateRef.current;
            utter.pitch = 1;
            utter.volume = 1;

            const voice = pickFrenchVoice(synth, currentVoiceRef.current);
            if (voice) utter.voice = voice;

            utter.onstart = () => {
                isSpeakingRef.current = true;
                setVoiceState('speaking');
                iAstedSoul.setLifecycle({ isSpeaking: true, isListening: false, isProcessing: false });
            };
            utter.onend = () => {
                isSpeakingRef.current = false;
                if (isConnectedRef.current) {
                    setVoiceState('listening');
                    iAstedSoul.setLifecycle({ isSpeaking: false, isListening: true });
                    try { recognitionRef.current?.start?.(); } catch { /* noop */ }
                }
                opts?.onEnd?.();
            };
            utter.onerror = (e) => {
                console.warn('🔇 [iAsted] Erreur synthèse vocale:', e);
                isSpeakingRef.current = false;
                if (isConnectedRef.current) setVoiceState('listening');
                opts?.onEnd?.();
            };

            setMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: text,
                    timestamp: new Date().toISOString(),
                },
            ]);

            synth.speak(utter);
        },
        [],
    );

    const handleTranscript = useCallback(
        async (transcript: string) => {
            if (!transcript.trim() || isSpeakingRef.current) return;

            console.log('🗣️ [iAsted] Transcription:', transcript);
            setMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: transcript,
                    timestamp: new Date().toISOString(),
                },
            ]);

            setVoiceState('thinking');
            iAstedSoul.setLifecycle({ isProcessing: true, isListening: false });

            const intent: Intent = classifyIntent(transcript);
            iAstedSoul.recordIntent(intent.kind === 'tool' ? intent.tool : intent.kind);

            // ── Branche TOOL : exécute une commande puis confirme à l'oral ──
            if (intent.kind === 'tool') {
                console.log(`🛠️ [iAsted] Tool: ${intent.tool}`, intent.args);
                iAstedSoul.queueAction(intent.tool);

                if (intent.tool === 'change_voice') {
                    const cur = currentVoiceRef.current;
                    const isMaleNow = cur === 'ash' || cur === 'echo';
                    const next = (intent.args.voice_id as VoiceId) || (isMaleNow ? 'shimmer' : 'ash');
                    currentVoiceRef.current = next;
                }

                if (intent.tool === 'control_ui' && intent.args.action === 'set_speech_rate') {
                    const r = parseFloat(intent.args.value ?? '1.0');
                    const clamped = Math.max(0.5, Math.min(2.0, r));
                    setSpeechRate(clamped);
                    speechRateRef.current = clamped;
                }

                let toolResult: any;
                try {
                    // execute_page_action est résolu localement contre le pageContextStore.
                    // Les autres outils sont délégués au handler externe (IAstedInterface).
                    if (intent.tool === 'execute_page_action') {
                        toolResult = await executePageAction(
                            (intent.args.actionId as string) ?? '',
                            intent.args,
                        );
                    } else if (onToolCall) {
                        toolResult = await onToolCall(intent.tool, intent.args);
                    }
                } catch (err) {
                    console.error('❌ [iAsted] Erreur exécution outil:', err);
                    speak("Je n'ai pas pu exécuter cette commande.");
                    return;
                }

                iAstedSoul.completeAction(intent.tool);

                const confirmation =
                    toolResult && typeof toolResult === 'object' && 'message' in toolResult
                        ? String((toolResult as any).message)
                        : intent.say;
                speak(confirmation);

                if (intent.tool === 'stop_conversation') {
                    setTimeout(() => disconnectInternal(), 1500);
                }
                return;
            }

            // ── Branche ANSWER : réponse Q/A ou conversationnelle ──
            if (intent.kind === 'answer') {
                console.log('💬 [iAsted] Answer:', intent.say.slice(0, 80));
                speak(intent.say);
                return;
            }

            // ── Branche UNKNOWN : suggestion adaptée à la page ──
            speak(intent.say);
        },
        [onToolCall, speak, disconnectInternal],
    );

    const startRecognition = useCallback(() => {
        const SR = getSpeechRecognitionCtor();
        if (!SR) {
            toast({
                title: 'Reconnaissance vocale indisponible',
                description: 'Votre navigateur ne prend pas en charge la Web Speech API. Utilisez Chrome, Edge ou Safari récent.',
                variant: 'destructive',
            });
            return false;
        }

        const recognition = new SR();
        recognition.lang = 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('🎙️ [iAsted] Reconnaissance démarrée');
            if (!isSpeakingRef.current) {
                setVoiceState('listening');
                iAstedSoul.setLifecycle({ isListening: true, isSpeaking: false, isProcessing: false });
            }
        };

        recognition.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    const transcript = result[0]?.transcript ?? '';
                    handleTranscript(transcript);
                }
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }
            console.warn('🎙️ [iAsted] Erreur reconnaissance:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                toast({
                    title: 'Microphone bloqué',
                    description: "Autorisez l'accès au microphone puis recliquez sur iAsted.",
                    variant: 'destructive',
                });
                shouldRestartRef.current = false;
                disconnectInternal();
            }
        };

        recognition.onend = () => {
            console.log('🎙️ [iAsted] Reconnaissance terminée');
            if (shouldRestartRef.current && isConnectedRef.current && !isSpeakingRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    /* déjà en cours */
                }
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.warn('🎙️ [iAsted] Impossible de démarrer la reconnaissance:', e);
        }
        return true;
    }, [handleTranscript, toast, disconnectInternal]);

    const connect = useCallback(
        async (voice: VoiceId = 'ash', systemPrompt?: string) => {
            if (isConnectedRef.current) {
                console.log('⚠️ [iAsted] Déjà connecté');
                return;
            }

            setVoiceState('connecting');
            currentVoiceRef.current = voice;

            if (typeof window !== 'undefined') {
                synthRef.current = window.speechSynthesis;
                try { synthRef.current.getVoices(); } catch { /* noop */ }
            }

            const SR = getSpeechRecognitionCtor();
            if (!SR) {
                toast({
                    title: 'Navigateur non compatible',
                    description: 'iAsted requiert Chrome, Edge ou Safari pour la reconnaissance vocale.',
                    variant: 'destructive',
                });
                setVoiceState('idle');
                return;
            }

            await startAudioMeter();

            isConnectedRef.current = true;
            setIsConnected(true);
            shouldRestartRef.current = true;
            iAstedSoul.awaken();

            const ok = startRecognition();
            if (!ok) {
                disconnectInternal();
                return;
            }

            toast({
                title: 'iAsted connecté',
                description: 'Parlez maintenant. Dites "arrête-toi" pour terminer.',
            });

            // ── Salutation contextuelle :
            //    1. Honorific dérivé du persona courant (lui-même dérivé de la route).
            //    2. Mention de l'espace où l'on se trouve, pour confirmer la conscience
            //       contextuelle (« je suis avec vous sur l'espace Président »).
            const soul = iAstedSoul.getState();
            const hour = new Date().getHours();
            const tod = hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir';
            const honorific = soul.persona.honorificFull;
            const page = soul.spatial.page;
            const contextHint = page.module && page.module !== 'Général'
                ? ` Je suis avec vous sur ${page.label}.`
                : '';
            const greeting = `${tod} ${honorific}, je suis à votre écoute.${contextHint}`;

            iAstedSoul.markGreeted();
            // Note : `systemPrompt` est ignoré ici — la persona vient du soul, plus fiable.
            void systemPrompt;
            setTimeout(() => speak(greeting), 300);
        },
        [toast, startAudioMeter, startRecognition, disconnectInternal, speak],
    );

    const disconnect = useCallback(() => {
        disconnectInternal();
    }, [disconnectInternal]);

    const toggleConversation = useCallback(
        async (voice: VoiceId = 'ash') => {
            if (isConnectedRef.current) disconnect();
            else await connect(voice);
        },
        [connect, disconnect],
    );

    useEffect(() => {
        return () => {
            disconnectInternal();
        };
    }, [disconnectInternal]);

    return {
        isConnecting: voiceState === 'connecting',
        voiceState,
        messages,
        isConnected,
        audioLevel,
        speechRate,
        setSpeechRate: (rate: number) => {
            const clamped = Math.max(0.5, Math.min(2.0, rate));
            setSpeechRate(clamped);
            speechRateRef.current = clamped;
            console.log(`🎚️ [iAsted] Vitesse de parole: ${clamped}x`);
        },
        connect,
        disconnect,
        toggleConversation,
        clearSession: () => setMessages([]),
    };
};

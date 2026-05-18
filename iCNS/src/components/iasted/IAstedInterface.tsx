import React, { useMemo, useState, useEffect } from 'react';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { IASTED_SYSTEM_PROMPT } from '@/config/iasted-config';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { resolveRoute } from '@/utils/route-mapping';

interface IAstedInterfaceProps {
    userRole?: string;
    defaultOpen?: boolean;
    isOpen?: boolean; // Allow external control
    onClose?: () => void; // Allow external control
    onToolCall?: (toolName: string, args: any) => void;
}

/**
 * Complete IAsted Agent Interface.
 * Includes the floating button and the chat modal.
 * Manages its own connection and visibility state.
 */
export default function IAstedInterface({ userRole = 'user', defaultOpen = false, isOpen: controlledIsOpen, onClose: controlledOnClose, onToolCall }: IAstedInterfaceProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = controlledOnClose ? (value: boolean) => {
        if (!value) controlledOnClose();
    } : setInternalIsOpen;

    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('ash');
    const [pendingDocument, setPendingDocument] = useState<any>(null);
    const { setTheme, theme } = useTheme();
    const navigate = useNavigate();

    // Initialize voice from localStorage
    useEffect(() => {
        const savedVoice = localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash' | 'shimmer';
        if (savedVoice) setSelectedVoice(savedVoice);
    }, []);

    // Calculate time-based greeting
    const timeOfDay = useMemo(() => {
        const hour = new Date().getHours();
        return hour >= 5 && hour < 18 ? "Bonjour" : "Bonsoir";
    }, []);

    // Map user role to appropriate title
    const userTitle = useMemo(() => {
        switch (userRole) {
            case 'president':
                return 'Excellence Monsieur le Président';
            case 'minister':
                return 'Excellence Monsieur le Ministre';
            case 'director':
                return 'Monsieur le Directeur';
            case 'dgss':
                return 'Directeur Général';
            case 'courrier':
                return 'Monsieur le Responsable Courrier';
            case 'reception':
                return 'Monsieur le Responsable Réception';
            default:
                return 'Monsieur';
        }
    }, [userRole]);

    // Format system prompt with context
    const formattedSystemPrompt = useMemo(() => {
        return IASTED_SYSTEM_PROMPT
            .replace(/{USER_TITLE}/g, userTitle)
            .replace(/{CURRENT_TIME_OF_DAY}/g, timeOfDay)
            .replace(/{APPELLATION_COURTE}/g, userTitle.split(' ').slice(-1)[0] || 'Monsieur');
    }, [timeOfDay, userTitle]);

    // Initialize OpenAI RTC with tool call handler
    const openaiRTC = useRealtimeVoiceWebRTC(async (toolName, args) => {
        console.log(`🔧 [IAstedInterface] Tool call: ${toolName}`, args);

        // 1. Internal Handlers
        if (toolName === 'change_voice') {
            console.log('🎙️ [IAstedInterface] Changement de voix demandé');

            // Si voice_id spécifique fourni, l'utiliser
            if (args.voice_id) {
                setSelectedVoice(args.voice_id as any);
                toast.success(`Voix modifiée : ${args.voice_id === 'ash' ? 'Homme (Ash)' : args.voice_id === 'shimmer' ? 'Femme (Shimmer)' : 'Standard (Echo)'}`);
            }
            // Sinon, alterner homme↔femme selon voix actuelle
            else {
                const currentVoice = selectedVoice;
                const isCurrentlyMale = currentVoice === 'ash' || currentVoice === 'echo';
                const newVoice = isCurrentlyMale ? 'shimmer' : 'ash';

                console.log(`🎙️ [IAstedInterface] Alternance voix: ${currentVoice} (${isCurrentlyMale ? 'homme' : 'femme'}) -> ${newVoice} (${isCurrentlyMale ? 'femme' : 'homme'})`);
                setSelectedVoice(newVoice);
                toast.success(`Voix changée : ${newVoice === 'shimmer' ? 'Femme (Shimmer)' : 'Homme (Ash)'}`);
            }

            return { success: true, message: `Voix modifiée` };
        }

        if (toolName === 'logout_user') {
            console.log('👋 [IAstedInterface] Déconnexion demandée par l\'utilisateur');
            toast.info("Déconnexion en cours...");
            setTimeout(async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
            }, 1500);
        }

        if (toolName === 'open_chat') {
            setIsOpen(true);
        }

        if (toolName === 'close_chat') {
            setIsOpen(false);
        }

        if (toolName === 'generate_document') {
            console.log('📝 [IAstedInterface] Génération document:', args);
            setPendingDocument({
                type: args.type,
                recipient: args.recipient,
                subject: args.subject,
                contentPoints: args.content_points || [],
                format: args.format || 'pdf'
            });
            setIsOpen(true);
            toast.success(`Génération de ${args.type} pour ${args.recipient}...`);
        }

        if (toolName === 'control_ui') {
            console.log('🎨 [IAstedInterface] Contrôle UI:', args);
            console.log('🎨 [IAstedInterface] Thème actuel:', theme);

            if (args.action === 'set_theme_dark') {
                console.log('🎨 [IAstedInterface] Activation du mode sombre...');
                setTheme('dark');
                setTimeout(() => {
                    toast.success("Mode sombre activé");
                    console.log('✅ [IAstedInterface] Thème changé vers dark');
                }, 100);
                return { success: true, message: 'Mode sombre activé' };
            } else if (args.action === 'set_theme_light') {
                console.log('🎨 [IAstedInterface] Activation du mode clair...');
                setTheme('light');
                setTimeout(() => {
                    toast.success("Mode clair activé");
                    console.log('✅ [IAstedInterface] Thème changé vers light');
                }, 100);
                return { success: true, message: 'Mode clair activé' };
            } else if (args.action === 'toggle_theme') {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                console.log(`🎨 [IAstedInterface] Basculement: ${theme} -> ${newTheme}`);
                setTheme(newTheme);
                setTimeout(() => {
                    toast.success(`Thème basculé vers ${newTheme === 'dark' ? 'sombre' : 'clair'}`);
                    console.log(`✅ [IAstedInterface] Thème basculé vers ${newTheme}`);
                }, 100);
                return { success: true, message: `Thème basculé vers ${newTheme === 'dark' ? 'sombre' : 'clair'}` };
            }

            if (args.action === 'toggle_sidebar') {
                // Dispatch event for sidebar since it's often controlled by layout
                window.dispatchEvent(new CustomEvent('iasted-sidebar-toggle'));
                return { success: true, message: 'Sidebar basculée' };
            }

            if (args.action === 'set_speech_rate') {
                // Ajuster la vitesse de parole (0.5 à 2.0)
                const rate = parseFloat(args.value || '1.0');
                const clampedRate = Math.max(0.5, Math.min(2.0, rate));

                console.log(`🎚️ [IAstedInterface] Ajustement vitesse: ${rate} -> ${clampedRate}`);
                openaiRTC.setSpeechRate(clampedRate);

                const speedDescription = clampedRate < 0.8 ? 'ralenti'
                    : clampedRate > 1.2 ? 'accéléré'
                        : 'normal';

                setTimeout(() => {
                    toast.success(`Vitesse de parole ajustée (${speedDescription}: ${clampedRate}x)`);
                }, 100);

                return { success: true, message: `Vitesse ajustée à ${clampedRate}x` };
            }
        }

        if (toolName === 'navigate_to_section') {
            console.log('📍 [IAstedInterface] Navigation locale:', args);

            // 1. Essayer de scroller vers un élément (comportement original)
            const sectionId = args.section_id;
            if (sectionId) {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    toast.success(`Section ${sectionId} affichée`);
                    console.log(`✅ [IAstedInterface] Scroll vers: ${sectionId}`);
                    return { success: true, message: `Section ${sectionId} affichée` };
                }

                // 2. Si pas d'élément, dispatcher un événement pour que la page gère (ex: AdminSpace)
                console.log(`⚠️ [IAstedInterface] Élément non trouvé, dispatch event: ${sectionId}`);
                const navEvent = new CustomEvent('iasted-navigate-section', {
                    detail: { sectionId }
                });
                window.dispatchEvent(navEvent);
                return { success: true, message: `Navigation vers ${sectionId} demandée` };
            }
        }

        if (toolName === 'navigate_app') {
            console.log('🌍 [IAstedInterface] Navigation Globale (Admin):', args);

            // Navigation complète vers une autre route (admin uniquement)
            if (args.route) {
                navigate(args.route);
                toast.success(`Navigation vers ${args.route}`);
                console.log(`✅ [IAstedInterface] Navigation vers: ${args.route}`);

                // Si module_id est spécifié, scroll après navigation
                if (args.module_id) {
                    setTimeout(() => {
                        const element = document.getElementById(args.module_id);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                }
            }
        }

        if (toolName === 'global_navigate') {
            console.log('🌍 [IAstedInterface] Navigation Globale:', args);

            // Use intelligent route resolution
            const resolvedPath = resolveRoute(args.query);

            if (resolvedPath) {
                console.log(`✅ [IAstedInterface] Route resolved: "${args.query}" -> ${resolvedPath}`);
                navigate(resolvedPath);
                toast.success(`Navigation vers ${resolvedPath}`);

                // If chameleon mode is requested (target_role), we could store it or handle it
                if (args.target_role) {
                    console.log(`🦎 [IAstedInterface] Mode Caméléon: ${args.target_role}`);
                    localStorage.setItem('chameleon_role', args.target_role);
                }

                return { success: true, message: `Navigation vers ${resolvedPath} effectuée` };
            } else {
                console.error(`❌ [IAstedInterface] Route not found for: "${args.query}"`);
                toast.error(`Impossible de trouver la route pour "${args.query}"`);
                return { success: false, message: `Route "${args.query}" introuvable` };
            }
        }

        if (toolName === 'security_override') {
            console.log('🔓 [IAstedInterface] Override Sécurité:', args);
            if (args.action === 'unlock_admin_access') {
                // This might set a global state or localStorage
                localStorage.setItem('security_override', 'true');
                toast.warning("🔓 SÉCURITÉ DÉSACTIVÉE - ACCÈS ADMIN AUTORISÉ");
                window.dispatchEvent(new CustomEvent('security-override-activated'));
            }
        }

        // 2. External Handler (for navigation, specific actions)
        if (onToolCall) {
            onToolCall(toolName, args);
        }
    });

    const handleButtonClick = async () => {
        if (openaiRTC.isConnected) {
            openaiRTC.disconnect();
        } else {
            await openaiRTC.connect(selectedVoice, formattedSystemPrompt);
        }
    };

    return (
        <>
            <IAstedButtonFull
                voiceListening={openaiRTC.voiceState === 'listening'}
                voiceSpeaking={openaiRTC.voiceState === 'speaking'}
                voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
                audioLevel={openaiRTC.audioLevel}
                onClick={handleButtonClick}
                onDoubleClick={() => setIsOpen(true)}
            />

            <IAstedChatModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                openaiRTC={openaiRTC}
                currentVoice={selectedVoice}
                systemPrompt={formattedSystemPrompt}
                pendingDocument={pendingDocument}
                onClearPendingDocument={() => setPendingDocument(null)}
            />
        </>
    );
}

import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '@/hooks/useUserContext';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { useToast } from '@/hooks/use-toast';
import IAstedButtonFull from '@/components/iasted/IAstedButtonFull';
import { generateSystemPrompt } from '@/utils/generateSystemPrompt';
import { resolveRoute } from '@/utils/route-mapping';

/**
 * Omnipresent Super Admin Button
 * Available globally for admin and president roles
 * Uses Portal to inject into document.body with fixed positioning
 */
export const SuperAdminFloatingButton: React.FC = () => {
    const { profile, role, isLoading } = useUserContext({ spaceName: 'Global' });
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
    const [originRoute, setOriginRoute] = useState<string | null>(null);
    const [securityOverrideActive, setSecurityOverrideActive] = useState(false);

    const handleToolCall = useCallback((toolName: string, args: any) => {
        switch (toolName) {
            case 'global_navigate':
                // Intelligent route resolution
                const query = args.query || args.route;
                console.log('🦭 [Super Admin Global] Navigation request:', query);

                const resolvedRoute = resolveRoute(query);
                if (resolvedRoute) {
                    // Store current location before navigating
                    setOriginRoute(window.location.pathname);
                    console.log('✅ [Super Admin Global] Resolved to:', resolvedRoute);
                    navigate(resolvedRoute);
                } else {
                    console.error('❌ [Super Admin Global] Route not found for:', query);
                    toast({
                        title: 'Route inconnue',
                        description: `Impossible de trouver la route pour "${query}"`,
                        variant: 'destructive'
                    });
                }
                break;
            case 'return_to_base':
                console.log('🏠 [Super Admin Global] Returning to base (AdminSpace)');
                setOriginRoute(window.location.pathname);
                navigate('/admin-space');
                toast({
                    title: 'Retour à la base',
                    description: 'Navigation vers l\'AdminSpace',
                });
                break;
            case 'return_to_origin':
                if (originRoute) {
                    console.log('⏮️ [Super Admin Global] Returning to origin:', originRoute);
                    navigate(originRoute);
                    toast({
                        title: 'Retour à l\'origine',
                        description: `Navigation vers ${originRoute}`,
                    });
                    setOriginRoute(null);
                } else {
                    console.log('⚠️ [Super Admin Global] No origin route stored');
                    toast({
                        title: 'Pas d\'origine',
                        description: 'Aucune page d\'origine enregistrée',
                        variant: 'destructive'
                    });
                }
                break;
            case 'security_override':
                if (args.action === 'unlock_admin_access') {
                    console.log('🔓 [Super Admin Global] Security override activated');
                    setSecurityOverrideActive(true);
                    toast({
                        title: '🔐 Accès déverrouillé',
                        description: 'Mode God: Tous les accès sont autorisés',
                        duration: 3000,
                    });
                    setTimeout(() => setSecurityOverrideActive(false), 3000);
                }
                break;
            default:
                console.log('[Super Admin Global] Tool call forwardé:', toolName, args);
        }
    }, [navigate, toast, originRoute]);

    const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

    // Only show for admin and president roles
    if (isLoading || (role !== 'admin' && role !== 'president')) {
        return null;
    }

    // Portal: inject into document.body with fixed positioning
    return ReactDOM.createPortal(
        <div className="fixed bottom-6 right-6 z-[9999]" style={{ pointerEvents: 'auto' }}>
            <IAstedButtonFull
                onClick={async () => {
                    if (openaiRTC.isConnected) {
                        openaiRTC.disconnect();
                    } else {
                        const userContext = {
                            profile,
                            role,
                            roleContext: null,
                            spaceContext: {
                                spaceName: 'Global',
                                displayName: 'Super Admin Global',
                                description: "navigation globale omnipresente"
                            },
                            hasIAstedAccess: true,
                            userId: profile?.user_id || null,
                            isLoading: false
                        };
                        const systemPrompt = generateSystemPrompt(userContext);
                        await openaiRTC.connect(selectedVoice, systemPrompt);
                    }
                }}
                onDoubleClick={() => {
                    console.log('🖱️🖱️ [Super Admin Global] Double clic - Modal non implémenté ici');
                    toast({
                        title: 'Info',
                        description: 'Ouvrez le chat depuis l\'AdminSpace',
                    });
                }}
                audioLevel={openaiRTC.audioLevel}
                voiceListening={openaiRTC.voiceState === 'listening'}
                voiceSpeaking={openaiRTC.voiceState === 'speaking'}
                voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
                pulsing={securityOverrideActive}
            />
        </div>,
        document.body
    );
};

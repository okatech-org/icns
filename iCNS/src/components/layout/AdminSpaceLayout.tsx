import React, { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import {
    LogOut,
    Moon,
    Sun,
    ChevronDown,
    ChevronRight,
    Menu
} from 'lucide-react';
import emblemGabon from '@/assets/emblem_gabon.png';
import { MobileBottomNav, NavItem } from '@/components/layout/MobileBottomNav';
import IAstedButtonFull from '@/components/iasted/IAstedButtonFull';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { generateSystemPrompt } from '@/utils/generateSystemPrompt';
import { useUserContext } from '@/hooks/useUserContext';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

interface AdminSpaceLayoutProps {
    children: ReactNode;
    navItems: NavItem[];
    activeSection: string;
    setActiveSection: (section: string) => void;
    userContext: any; // Type appropriately based on useUserContext return
    pageTitle: string;
    headerTitle: string;
    headerSubtitle: string;
    onOpenIasted?: () => void; // Optional: for spaces with local RTC
    customSidebarNav?: ReactNode; // Optional: for complex navigation (accordions)
    rtc?: any; // Optional: Local RTC instance
}

export const AdminSpaceLayout: React.FC<AdminSpaceLayoutProps> = ({
    children,
    navItems,
    activeSection,
    setActiveSection,
    userContext,
    pageTitle,
    headerTitle,
    headerSubtitle,
    onOpenIasted,
    customSidebarNav,
    rtc
}) => {
    const { theme, setTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    // Global context for fallback
    const { openaiRTC: globalRTC, selectedVoice: globalVoice, isChatOpen: globalIsChatOpen, setIsChatOpen: setGlobalIsChatOpen } = useSuperAdmin();

    // Determine which RTC and state to use
    const activeRTC = rtc || globalRTC;
    // For local RTC, we might need local state for chat open/close if not using context
    // But for now, we'll assume we can use the global isChatOpen state or we might need a local one if provided?
    // Actually, if using local RTC, we probably want to control the modal locally or via the layout?
    // Let's use the global chat state for simplicity, or we can add an isChatOpen prop if needed.
    // For now, let's use global state for the modal visibility to avoid complexity, 
    // assuming even local spaces can use the global UI state for the modal.
    const isChatOpen = globalIsChatOpen;
    const setIsChatOpen = setGlobalIsChatOpen;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close mobile menu when navigating
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [activeSection]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Default iAsted handler if none provided (uses global context)
    const handleIastedClick = async () => {
        if (onOpenIasted) {
            onOpenIasted();
        } else {
            if (globalRTC.isConnected) {
                globalRTC.disconnect();
            } else {
                const systemPrompt = generateSystemPrompt(userContext);
                await globalRTC.connect(globalVoice, systemPrompt);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 pb-28 md:pb-6 transition-colors duration-300">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50 backdrop-blur-sm">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                            <img
                                src={emblemGabon}
                                alt="Emblème"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="font-bold text-sm text-foreground">{pageTitle}</span>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className={`
          neu-card w-64 flex-shrink-0 p-6 flex flex-col h-[calc(100vh-2rem)] overflow-y-auto
          fixed md:sticky top-4 left-4 z-50 bg-background
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}
          md:h-[calc(100vh-3rem)] md:top-auto md:left-auto
        `}>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute top-4 right-4 md:hidden p-2 text-muted-foreground"
                    >
                        <ChevronDown className="w-6 h-6 rotate-90" />
                    </button>

                    {/* Logo et titre */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
                            <img
                                src={emblemGabon}
                                alt="Emblème de la République Gabonaise"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <div className="font-bold text-sm">ADMIN.GA</div>
                            <div className="text-xs text-muted-foreground">{pageTitle}</div>
                        </div>
                    </div>

                    {/* Navigation */}
                    {customSidebarNav ? (
                        <div className="flex-1 overflow-y-auto">
                            {customSidebarNav}
                        </div>
                    ) : (
                        <nav className="space-y-2 flex-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === item.id
                                        ? 'neu-inset text-primary font-semibold'
                                        : 'neu-raised hover:shadow-neo-md'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-auto space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between px-2">
                            <button
                                onClick={toggleTheme}
                                className="neu-raised w-10 h-10 rounded-full flex items-center justify-center hover:text-primary transition-colors"
                            >
                                {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="neu-raised w-10 h-10 rounded-full flex items-center justify-center hover:text-destructive transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 space-y-6 transition-all duration-300">
                    {/* Desktop Header */}
                    <header className="hidden md:flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{headerTitle}</h2>
                            <p className="text-muted-foreground">{headerSubtitle}</p>
                        </div>
                    </header>

                    {/* Content Injection */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>

            {/* Floating iAsted Button (Desktop Only) */}
            <div className="hidden md:block fixed bottom-6 right-6 z-[9999]">
                <IAstedButtonFull
                    onClick={handleIastedClick}
                    onDoubleClick={() => setIsChatOpen(true)}
                    voiceListening={activeRTC.voiceState === 'listening'}
                    voiceSpeaking={activeRTC.voiceState === 'speaking'}
                    voiceProcessing={activeRTC.voiceState === 'connecting' || activeRTC.voiceState === 'thinking'}
                    audioLevel={activeRTC.audioLevel}
                />
            </div>

            {/* Mobile Bottom Navigation (Includes Embedded iAsted) */}
            {!mobileMenuOpen && (
                <MobileBottomNav
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    onOpenIasted={handleIastedClick}
                    onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                    navItems={navItems}
                    embeddedButtonProps={{
                        voiceListening: activeRTC.voiceState === 'listening',
                        voiceSpeaking: activeRTC.voiceState === 'speaking',
                        voiceProcessing: activeRTC.voiceState === 'connecting' || activeRTC.voiceState === 'thinking',
                        audioLevel: activeRTC.audioLevel,
                        onClick: handleIastedClick,
                        onDoubleClick: () => setIsChatOpen(true)
                    }}
                />
            )}

            {/* IAsted Chat Modal */}
            <IAstedChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                systemPrompt={generateSystemPrompt(userContext)}
                openaiRTC={activeRTC}
            />
        </div>
    );
};

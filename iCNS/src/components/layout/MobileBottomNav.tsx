import React from 'react';
import { Menu } from 'lucide-react';
import IAstedButtonFull from '@/components/iasted/IAstedButtonFull';

export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

interface MobileBottomNavProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    onOpenIasted: () => void;
    onToggleMenu: () => void;
    navItems: NavItem[];
    embeddedButtonProps?: any;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeSection,
    setActiveSection,
    onOpenIasted,
    onToggleMenu,
    navItems,
    embeddedButtonProps
}) => {
    // Enforce max 3 items to ensure 2+2 layout (3 items + Menu)
    // Filter out any item with id 'iasted' to avoid duplication
    const validItems = navItems.filter(item => item.id !== 'iasted');
    const displayedItems = validItems.slice(0, 3);

    const leftItems = displayedItems.slice(0, 2);
    const rightItems = displayedItems.slice(2);

    return (
        <div className="fixed bottom-6 left-4 right-4 h-16 neu-raised rounded-2xl flex items-center justify-between px-2 z-50 md:hidden border border-border/20">
            {/* Left Items Container */}
            <div className="flex items-center justify-around flex-1">
                {leftItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 transition-colors w-12 ${activeSection === item.id ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                    >
                        <item.icon size={20} />
                        <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Central Floating Button - IAsted Sphere */}
            <div className="relative -top-6 mx-2 flex-shrink-0">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-background/50 backdrop-blur-sm shadow-lg border border-white/10">
                    <IAstedButtonFull
                        onClick={onOpenIasted}
                        size="md"
                        pulsing={true}
                        embedded={true}
                        {...embeddedButtonProps}
                    />
                </div>
            </div>

            {/* Right Items Container */}
            <div className="flex items-center justify-around flex-1">
                {rightItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 transition-colors w-12 ${activeSection === item.id ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                    >
                        <item.icon size={20} />
                        <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
                    </button>
                ))}

                {/* Menu Button - Always at the end */}
                <button
                    onClick={onToggleMenu}
                    className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors w-12"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>
        </div>
    );
};

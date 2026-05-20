// Bouton de navigation neumorphique réutilisable dans la sidebar des espaces
// utilisateur — pour les entrées "Modules iCNS".

import { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface ModuleNavButtonProps {
    id: string;
    label: string;
    icon: ComponentType<LucideProps>;
    activeSection: string;
    onClick: () => void;
    count?: number;
}

export function ModuleNavButton({ id, label, icon: Icon, activeSection, onClick, count }: ModuleNavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === id
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
                <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </button>
    );
}

export default ModuleNavButton;

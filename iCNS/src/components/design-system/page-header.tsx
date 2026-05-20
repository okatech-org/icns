// PageHeader — port du backoffice gabon-diplomatie.
// En-tête de page avec icône cadrée, titre + sous-titre, actions à droite.

import {
    createElement,
    isValidElement,
    type ComponentType,
    type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderIcon = ReactNode | ComponentType<{ className?: string }>;

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: PageHeaderIcon;
    iconBgClass?: string;
    actions?: ReactNode;
    showBackButton?: boolean;
    onBack?: () => void;
    className?: string;
}

function renderIcon(icon: PageHeaderIcon): ReactNode {
    if (icon == null || icon === false) return null;
    if (isValidElement(icon)) return icon;
    if (
        typeof icon === "function" ||
        (typeof icon === "object" && icon !== null && "$$typeof" in (icon as object))
    ) {
        return createElement(icon as ComponentType<{ className?: string }>, {
            className: "h-5 w-5",
        });
    }
    return icon as ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    icon,
    iconBgClass,
    actions,
    showBackButton = false,
    onBack,
    className,
}: PageHeaderProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) onBack();
        else navigate(-1);
    };

    return (
        <div
            className={cn(
                "flex flex-col items-start justify-between gap-4 md:flex-row",
                className,
            )}
        >
            <div className="flex items-start gap-3">
                {showBackButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="mt-1 -ml-1"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                {icon && (
                    <div className={cn("v2-icon-box", iconBgClass)}>
                        {renderIcon(icon)}
                    </div>
                )}
                <div>
                    <h1
                        className="text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]"
                        style={{ color: "var(--v2-text)" }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <div
                            className="mt-0.5 text-[13px]"
                            style={{ color: "var(--v2-text-muted)" }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
        </div>
    );
}

export default PageHeader;

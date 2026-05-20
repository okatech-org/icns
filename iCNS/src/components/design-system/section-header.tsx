// SectionHeader — port du backoffice gabon-diplomatie.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    icon: ReactNode;
    iconBgClass?: string;
    iconTextClass?: string;
    title: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function SectionHeader({
    icon,
    iconBgClass = "bg-foreground/8 dark:bg-foreground/5",
    iconTextClass,
    title,
    actions,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between mb-2", className)}>
            <span className="text-sm font-bold flex items-center gap-2">
                <div className={cn("p-1 rounded-md", iconBgClass)}>
                    <span
                        className={cn(
                            "h-3.5 w-3.5 shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5",
                            iconTextClass,
                        )}
                    >
                        {icon}
                    </span>
                </div>
                {title}
            </span>
            {actions}
        </div>
    );
}

export default SectionHeader;

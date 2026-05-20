// EmptyState — port du backoffice gabon-diplomatie.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center",
                className,
            )}
        >
            <div className="rounded-full bg-muted p-4 mb-4">
                <span className="text-muted-foreground [&>svg]:h-8 [&>svg]:w-8">
                    {icon}
                </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export default EmptyState;

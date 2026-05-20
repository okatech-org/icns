// FlatCard — port du design system backoffice gabon-diplomatie.
// Carte plate, sans ombre, avec bordure douce.

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FlatCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

export function FlatCard({ children, className, ...props }: FlatCardProps) {
    return (
        <div className={cn("v2-flat-card", className)} {...props}>
            {children}
        </div>
    );
}

export default FlatCard;

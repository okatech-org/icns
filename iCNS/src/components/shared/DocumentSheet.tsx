// Vignette A4 réutilisable (style backoffice-web gabon-diplomatie).
// Le contenu est rendu aux dimensions natives A4 (794×1123 px @ 96dpi)
// puis réduit via `transform: scale()` calculé dynamiquement via
// `ResizeObserver` pour tenir exactement dans le conteneur parent.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

/** Dimensions A4 en px @ 96 dpi — base du rendu « naturel » avant scale. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

export interface DocumentSheetProps {
    /** Orientation. Défaut : portrait. */
    orientation?: "portrait" | "landscape";
    /** Contenu rendu à l'échelle A4 réelle (units : mm, pt, px naturels). */
    children: ReactNode;
    /** Action au clic sur la feuille. */
    onClick?: () => void;
    /** Overlays absolus par-dessus la feuille (badges, menu contextuel). */
    overlays?: ReactNode;
    /** Label d'accessibilité. */
    ariaLabel?: string;
    /** Classes supplémentaires sur le cadre extérieur. */
    className?: string;
}

export function DocumentSheet({
    orientation = "portrait",
    children,
    onClick,
    overlays,
    ariaLabel,
    className,
}: DocumentSheetProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);
    const isLandscape = orientation === "landscape";
    const naturalWidth = isLandscape ? A4_HEIGHT_PX : A4_WIDTH_PX;
    const naturalHeight = isLandscape ? A4_WIDTH_PX : A4_HEIGHT_PX;

    useEffect(() => {
        if (!cardRef.current) return;
        const el = cardRef.current;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0;
            setScale(width / naturalWidth);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [naturalWidth]);

    // Style dynamique : dimensions natives + scale calculé.
    const innerStyle: CSSProperties = {
        width: `${naturalWidth}px`,
        height: `${naturalHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        boxSizing: "border-box",
    };

    const clickable = typeof onClick === "function";
    const interactiveProps = clickable
        ? {
              role: "button" as const,
              tabIndex: 0,
              onClick: () => onClick(),
              onKeyDown: (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") onClick();
              },
          }
        : {};

    return (
        <div
            ref={cardRef}
            {...interactiveProps}
            aria-label={ariaLabel}
            className={cn(
                "relative w-full overflow-hidden border border-border bg-white shadow-sm transition dark:border-border/60",
                isLandscape ? "aspect-[297/210]" : "aspect-[210/297]",
                clickable && "cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/60",
                className,
            )}
        >
            <div
                ref={innerRef}
                className="absolute left-0 top-0 flex flex-col bg-white text-neutral-900"
                style={innerStyle}
            >
                {children}
            </div>
            {overlays}
        </div>
    );
}

// Affiche un hash SHA-256 tronque avec bouton de copie

import { useState } from "react";
import { Copy, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hashService } from "@/services/idocument/hashService";
import { toast } from "sonner";

interface HashIndicatorProps {
    hash: string | null;
    label?: string;
}

export function HashIndicator({ hash, label = "Empreinte SHA-256" }: HashIndicatorProps) {
    const [copied, setCopied] = useState(false);

    if (!hash) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Aucune empreinte
            </span>
        );
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(hash);
            setCopied(true);
            toast.success("Empreinte copiee");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Echec de la copie");
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={copy}
                        className="h-auto py-1 px-2 font-mono text-xs gap-1.5"
                    >
                        <ShieldCheck className="h-3 w-3 text-green-600" />
                        {hashService.truncateHash(hash)}
                        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs font-mono break-all max-w-xs">{label} : {hash}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

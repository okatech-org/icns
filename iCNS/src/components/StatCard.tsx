import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
}

export const StatCard = ({ label, value, trend, trendValue, icon }: StatCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3.5 w-3.5" />;
      case "down":
        return <TrendingDown className="h-3.5 w-3.5" />;
      case "stable":
        return <Minus className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };
  
  // Déterminer la couleur de l'icône en fonction du label
  const getIconColor = () => {
    if (label.toLowerCase().includes('critique')) return 'bg-destructive/10 text-destructive';
    if (label.toLowerCase().includes('résolution')) return 'bg-success/10 text-success';
    if (label.toLowerCase().includes('fonds') || label.toLowerCase().includes('récupéré')) return 'bg-success/10 text-success';
    return 'bg-primary/10 text-primary';
  };

  return (
    <Card className="p-6 bg-card hover:shadow-neo-lg transition-all duration-300 border-0">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={`p-3 rounded-full shadow-neo-sm ${getIconColor()}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-4xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1.5 text-xs mt-3 pt-3 border-t border-border/50">
          {getTrendIcon()}
          <span className={trend === "up" ? "text-success font-medium" : trend === "down" ? "text-destructive font-medium" : "text-muted-foreground"}>
            {trendValue}
          </span>
        </div>
      )}
    </Card>
  );
};

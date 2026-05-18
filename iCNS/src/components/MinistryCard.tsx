import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MinistryCardProps {
  title: string;
  icon: React.ReactNode;
  kpis: {
    label: string;
    value: string;
    status?: "success" | "warning" | "error";
  }[];
  urgentAlerts?: number;
  onClick?: () => void;
}

export const MinistryCard = ({ title, icon, kpis, urgentAlerts, onClick }: MinistryCardProps) => {
  return (
    <Card className="p-6 transition-smooth hover:shadow-elegant cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {urgentAlerts && urgentAlerts > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {urgentAlerts}
          </Badge>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{kpi.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{kpi.value}</span>
              {kpi.status && (
                <div
                  className={`h-2 w-2 rounded-full ${
                    kpi.status === "success"
                      ? "bg-success"
                      : kpi.status === "warning"
                      ? "bg-warning"
                      : "bg-destructive"
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <Button 
        variant="ghost" 
        className="w-full justify-between group-hover:bg-primary/5 transition-fast"
      >
        Voir les détails
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-fast" />
      </Button>
    </Card>
  );
};

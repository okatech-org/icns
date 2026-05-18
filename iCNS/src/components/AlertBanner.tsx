import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

interface AlertBannerProps {
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp?: string;
}

export const AlertBanner = ({ type, title, description, timestamp }: AlertBannerProps) => {
  const getIcon = () => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case "critical":
        return "destructive";
      default:
        return "default";
    }
  };

  const getClassName = () => {
    switch (type) {
      case "warning":
        return "border-warning bg-warning/10 text-warning-foreground";
      case "info":
        return "border-success bg-success/10 text-success-foreground";
      default:
        return "";
    }
  };

  return (
    <Alert variant={getVariant()} className={getClassName()}>
      {getIcon()}
      <div className="flex-1">
        <AlertTitle className="mb-1 flex items-center justify-between">
          {title}
          {timestamp && <span className="text-xs font-normal opacity-70">{timestamp}</span>}
        </AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
    </Alert>
  );
};

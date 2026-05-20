// Page de connexion iCNS — utilise LoginCardReader pour le vrai flux carte agent
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4)

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useICNSAuth } from "@/auth/useICNSAuth";
import { LoginCardReader } from "@/auth/LoginCardReader";
import { Button } from "@/components/ui/button";

export default function LoginICNSPage() {
  const navigate = useNavigate();
  const { setAuth } = useICNSAuth();

  return (
    <div className="relative min-h-screen bg-background p-4 flex items-center justify-center">
      {/* Bouton retour à l'accueil — discret, en haut à gauche */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="absolute left-4 top-4 gap-2 text-muted-foreground hover:text-foreground"
        aria-label="Retour à l'accueil iCNS"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Retour à l'accueil</span>
      </Button>

      <LoginCardReader
        onAuthenticated={(auth) => {
          setAuth(auth);
          navigate("/icns/workspace", { replace: true });
        }}
        onError={(msg) => {
          console.error("Auth iCNS error:", msg);
        }}
      />
    </div>
  );
}

// Page de connexion iCNS — utilise LoginCardReader pour le vrai flux carte agent
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4)

import { useNavigate } from "react-router-dom";
import { useICNSAuth } from "@/auth/useICNSAuth";
import { LoginCardReader } from "@/auth/LoginCardReader";

export default function LoginICNSPage() {
  const navigate = useNavigate();
  const { setAuth } = useICNSAuth();

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
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

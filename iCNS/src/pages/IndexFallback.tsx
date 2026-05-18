// Landing page iCNS — Conseil National de Sécurité
// Réécrite à partir de l'ancienne landing « Présidence » pour orienter
// l'utilisateur vers le flux iCNS (carte agent + PIN + biométrie, ou
// comptes démo des 8 rôles métier).

import { useNavigate } from "react-router-dom";
import emblemGabon from "@/assets/emblem_gabon.png";
import presidentialPalaceImage from "@/assets/presidential-palace.jpg";

const IndexFallback = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative flex min-h-screen items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.92)), url(${presidentialPalaceImage})`,
          }}
        />

        <div className="container relative z-10 mx-auto px-4 py-12 md:py-24">
          <div className="mx-auto max-w-4xl text-center text-white">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white p-1.5 shadow-xl md:mb-8 md:h-24 md:w-24 md:p-2">
              <img
                src={emblemGabon}
                alt="Emblème de la République Gabonaise"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="mb-2 text-xs uppercase tracking-widest text-amber-300 md:text-sm">
              République Gabonaise · Conseil National de Sécurité
            </p>

            <h1 className="mb-3 text-3xl font-bold leading-tight md:mb-6 md:text-5xl lg:text-7xl">
              iCNS
            </h1>

            <p className="mb-2 text-lg text-amber-200 md:mb-4 md:text-2xl lg:text-3xl">
              Plateforme souveraine de remontée du renseignement national
            </p>

            <p className="mx-auto mb-6 max-w-3xl text-sm text-white/85 md:mb-12 md:text-lg lg:text-xl">
              Système national centralisé pour la coordination du renseignement entre les
              13 services de sécurité et de défense, sous l'autorité du Secrétaire Général
              du Conseil National de Sécurité.
            </p>

            <div className="mb-6 flex flex-col items-center justify-center gap-2 text-xs uppercase tracking-widest text-white/70 md:flex-row md:gap-6">
              <span>B2</span><span className="hidden md:inline">·</span>
              <span>DGDI</span><span className="hidden md:inline">·</span>
              <span>DGR</span><span className="hidden md:inline">·</span>
              <span>DGSS</span><span className="hidden md:inline">·</span>
              <span>GR · GN · FAG</span><span className="hidden md:inline">·</span>
              <span>POLICE · SILAM · DGSP · DOUANE</span>
            </div>

            <div className="flex flex-col justify-center gap-2 sm:flex-row md:gap-4">
              <button
                className="rounded-md bg-amber-500 px-4 py-4 text-sm font-semibold text-slate-900 transition-all hover:bg-amber-400 md:px-8 md:py-6 md:text-lg"
                onClick={() => navigate("/icns/login")}
              >
                Connexion carte agent →
              </button>
              <button
                className="rounded-md border border-white/30 bg-white/10 px-4 py-4 text-sm text-white transition-all hover:bg-white/20 md:px-8 md:py-6 md:text-lg"
                onClick={() => navigate("/demo")}
              >
                Comptes démo iCNS
              </button>
            </div>

            <p className="mt-6 text-xs text-white/60">
              Authentification multi-facteurs obligatoire : carte agent + PIN + biométrie sur poste durci.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              © 2026 République Gabonaise — Conseil National de Sécurité · Réalisation NTSAGUI Digital
            </p>
            <p className="flex items-center justify-center gap-1 text-xs uppercase tracking-widest">
              🔒 CONFIDENTIEL DÉFENSE · Accès strictement réservé aux personnels habilités
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexFallback;

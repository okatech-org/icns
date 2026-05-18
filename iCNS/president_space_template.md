# Template Complet Design Espace Président

Ce document fournit le code complet pour reproduire exactement le design de l'Espace Président, y compris la sidebar avec accordéons, le header, et la grille de dashboard.

## 1. Structure Complète de la Page (`LayoutPresident.tsx`)

Ce composant gère la mise en page globale avec la sidebar détachable et la zone de contenu principale.

```tsx
import React, { useState, useMemo } from "react";
import { 
  LayoutDashboard, FileText, Inbox, Bot, UserCog, Building2, FileCheck, Users, 
  DollarSign, TrendingUp, Landmark, GraduationCap, Stethoscope, Briefcase, 
  Hammer, Crown, Target, Settings, LogOut, Sun, Moon, ChevronDown, ChevronRight 
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Remplacez par votre logo
import logoUrl from "@/assets/logo.png"; 

export default function LayoutPresident({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    gouvernance: false,
    economie: false,
    affaires: false,
    infrastructures: false,
  });
  const [activeSection, setActiveSection] = useState("dashboard");

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Fonction utilitaire pour les boutons de navigation
  const NavButton = ({ id, label, icon: Icon, isActive, onClick }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
        isActive 
          ? "neu-inset text-primary font-semibold" 
          : "neu-raised hover:shadow-neo-md"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  // Fonction utilitaire pour les headers de section (accordéons)
  const SectionHeader = ({ id, label, isOpen }: { id: keyof typeof expandedSections, label: string, isOpen: boolean }) => (
    <button
      onClick={() => toggleSection(id)}
      className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
    >
      {label}
      {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        
        {/* === SIDEBAR DÉTACHÉE === */}
        <aside className="neu-card w-64 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] overflow-hidden sticky top-6 h-[calc(100vh-3rem)]">
          
          {/* Logo & Titre */}
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
              {/* <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> */}
              <div className="font-bold text-xl">P</div>
            </div>
            <div>
              <div className="font-bold text-sm">ADMIN.GA</div>
              <div className="text-xs text-muted-foreground">Espace Président</div>
            </div>
          </div>

          {/* Zone de Navigation Scrollable */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-border">
            
            {/* Section NAVIGATION */}
            <div>
              <SectionHeader id="navigation" label="NAVIGATION" isOpen={expandedSections.navigation} />
              {expandedSections.navigation && (
                <nav className="space-y-2 ml-2">
                  <NavButton id="dashboard" label="Tableau de Bord" icon={LayoutDashboard} isActive={activeSection === "dashboard"} onClick={() => setActiveSection("dashboard")} />
                  <NavButton id="documents" label="Documents" icon={FileText} isActive={activeSection === "documents"} onClick={() => setActiveSection("documents")} />
                  <NavButton id="courriers" label="Courriers" icon={Inbox} isActive={activeSection === "courriers"} onClick={() => setActiveSection("courriers")} />
                  <NavButton id="iasted" label="Assistant IA" icon={Bot} isActive={activeSection === "iasted"} onClick={() => setActiveSection("iasted")} />
                </nav>
              )}
            </div>

            {/* Section GOUVERNANCE */}
            <div>
              <SectionHeader id="gouvernance" label="GOUVERNANCE" isOpen={expandedSections.gouvernance} />
              {expandedSections.gouvernance && (
                <nav className="space-y-2 ml-2">
                  <NavButton id="conseil" label="Conseil des Ministres" icon={UserCog} isActive={activeSection === "conseil"} onClick={() => setActiveSection("conseil")} />
                  <NavButton id="ministeres" label="Ministères" icon={Building2} isActive={activeSection === "ministeres"} onClick={() => setActiveSection("ministeres")} />
                  <NavButton id="decrets" label="Décrets" icon={FileCheck} isActive={activeSection === "decrets"} onClick={() => setActiveSection("decrets")} />
                  <NavButton id="nominations" label="Nominations" icon={Users} isActive={activeSection === "nominations"} onClick={() => setActiveSection("nominations")} />
                </nav>
              )}
            </div>

            {/* Section ÉCONOMIE */}
            <div>
              <SectionHeader id="economie" label="ÉCONOMIE" isOpen={expandedSections.economie} />
              {expandedSections.economie && (
                <nav className="space-y-2 ml-2">
                  <NavButton id="budget" label="Budget National" icon={DollarSign} isActive={activeSection === "budget"} onClick={() => setActiveSection("budget")} />
                  <NavButton id="indicateurs" label="Indicateurs" icon={TrendingUp} isActive={activeSection === "indicateurs"} onClick={() => setActiveSection("indicateurs")} />
                  <NavButton id="investissements" label="Investissements" icon={Landmark} isActive={activeSection === "investissements"} onClick={() => setActiveSection("investissements")} />
                </nav>
              )}
            </div>

             {/* Section AFFAIRES SOCIALES */}
             <div>
              <SectionHeader id="affaires" label="SOCIAL" isOpen={expandedSections.affaires} />
              {expandedSections.affaires && (
                <nav className="space-y-2 ml-2">
                  <NavButton id="education" label="Éducation" icon={GraduationCap} isActive={activeSection === "education"} onClick={() => setActiveSection("education")} />
                  <NavButton id="sante" label="Santé" icon={Stethoscope} isActive={activeSection === "sante"} onClick={() => setActiveSection("sante")} />
                  <NavButton id="emploi" label="Emploi" icon={Briefcase} isActive={activeSection === "emploi"} onClick={() => setActiveSection("emploi")} />
                </nav>
              )}
            </div>

            {/* Section INFRASTRUCTURES */}
            <div>
              <SectionHeader id="infrastructures" label="PROJETS" isOpen={expandedSections.infrastructures} />
              {expandedSections.infrastructures && (
                <nav className="space-y-2 ml-2">
                  <NavButton id="chantiers" label="Chantiers" icon={Hammer} isActive={activeSection === "chantiers"} onClick={() => setActiveSection("chantiers")} />
                  <NavButton id="projets-pres" label="Projets Présidentiels" icon={Crown} isActive={activeSection === "projets-pres"} onClick={() => setActiveSection("projets-pres")} />
                  <NavButton id="projets-etat" label="Projets d'État" icon={Target} isActive={activeSection === "projets-etat"} onClick={() => setActiveSection("projets-etat")} />
                </nav>
              )}
            </div>

          </div>

          {/* Footer Sidebar (Paramètres & Logout) */}
          <div className="mt-auto pt-4 border-t border-border space-y-2">
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Mode Clair" : "Mode Sombre"}
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all">
              <Settings className="w-4 h-4" />
              Paramètres
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive neu-raised hover:shadow-neo-md transition-all">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>

        </aside>

        {/* === CONTENU PRINCIPAL === */}
        <main className="flex-1 min-w-0">
          <div className="neu-card p-8 min-h-[calc(100vh-3rem)] animate-in fade-in duration-500">
            {/* Header de la page */}
            <div className="flex items-start gap-4 mb-10">
              <div className="neu-raised w-20 h-20 rounded-full flex items-center justify-center p-3 shrink-0">
                {/* <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> */}
                <div className="font-bold text-3xl">P</div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">Espace Président</h1>
                <p className="text-base text-muted-foreground">Présidence de la République - République Gabonaise</p>
              </div>
            </div>

            {/* Zone de contenu dynamique */}
            {children}
            
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 2. Dashboard Template (`DashboardView.tsx`)

Le contenu par défaut du dashboard avec les cartes de statistiques et les graphiques.

```tsx
import React from "react";
import { Users, Building2, UserCog, FileCheck, FileText, TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { StatCard, SectionCard } from "@/components/president/PresidentSpaceComponents"; // Assurez-vous d'avoir ce fichier

// Données factices pour l'exemple
const stats = {
  totalAgents: 12543,
  structures: 28,
  postesVacants: 342,
  actesEnAttente: 12,
};

const agentTypesData = [
  { name: "Cadres", value: 35, color: "hsl(var(--primary))" },
  { name: "Techniciens", value: 28, color: "hsl(var(--secondary))" },
  { name: "Agents", value: 22, color: "hsl(var(--accent))" },
  { name: "Ouvriers", value: 15, color: "hsl(var(--warning))" },
];

const genderData = [
  { name: "Hommes", value: 58, color: "hsl(var(--primary))" },
  { name: "Femmes", value: 42, color: "hsl(var(--accent))" },
];

export default function DashboardView() {
  return (
    <div className="space-y-8">
      
      {/* 1. Bandeau de Statistiques Rapides (Style Grid avec séparateurs) */}
      <div className="neu-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border gap-4 md:gap-0">
          
          <div className="px-6 first:pl-0 flex flex-col justify-center">
            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="text-4xl font-bold mb-2">{stats.totalAgents.toLocaleString()}</div>
            <div className="text-sm font-medium">Total Agents</div>
            <div className="text-xs text-muted-foreground">Fonction publique</div>
          </div>

          <div className="px-6 flex flex-col justify-center">
            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
              <Building2 className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-4xl font-bold mb-2">{stats.structures}</div>
            <div className="text-sm font-medium">Structures</div>
            <div className="text-xs text-muted-foreground">Ministères & Directions</div>
          </div>

          <div className="px-6 flex flex-col justify-center">
            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
              <UserCog className="w-6 h-6 text-warning" />
            </div>
            <div className="text-4xl font-bold mb-2">{stats.postesVacants}</div>
            <div className="text-sm font-medium">Postes Vacants</div>
            <div className="text-xs text-muted-foreground">À pourvoir</div>
          </div>

          <div className="px-6 last:pr-0 flex flex-col justify-center">
            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
              <FileCheck className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-4xl font-bold mb-2">{stats.actesEnAttente}</div>
            <div className="text-sm font-medium">Actes en attente</div>
            <div className="text-xs text-muted-foreground">Urgent</div>
          </div>

        </div>
      </div>

      {/* 2. Cartes de Statistiques Détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Performance" 
          value="+12.5%" 
          icon={TrendingUp} 
          color="hsl(var(--success))" 
          trend="Hausse"
          theme={{ textSecondary: "hsl(var(--muted-foreground))", text: "hsl(var(--foreground))", bgCard: "hsl(var(--card))", border: "hsl(var(--border))", shadow: "var(--neo-shadow-md)" } as any} 
        />
        {/* Ajoutez d'autres StatCards ici */}
      </div>

      {/* 3. Section Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graphique Circulaire */}
        <SectionCard title="Répartition par Catégorie" theme={{ text: "hsl(var(--foreground))", bgCard: "hsl(var(--card))", border: "hsl(var(--border))", shadow: "var(--neo-shadow-md)" } as any}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agentTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {agentTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Graphique Barres */}
        <SectionCard title="Répartition Genre" theme={{ text: "hsl(var(--foreground))", bgCard: "hsl(var(--card))", border: "hsl(var(--border))", shadow: "var(--neo-shadow-md)" } as any}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
```

## 3. Composants Spécifiques (`PresidentSpaceComponents.tsx`)

Assurez-vous d'avoir ce fichier (extrait précédemment) pour que les composants `StatCard`, `SectionCard`, etc. fonctionnent.

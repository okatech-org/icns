# Pack Design Espace Utilisateur

Ce document contient tous les éléments nécessaires pour implémenter le design de l'espace utilisateur (style Neumorphisme) dans un autre projet React/Tailwind.

## 1. Prompt de Conception (pour IA ou Designer)

Utilisez ce prompt pour générer de nouvelles pages ou composants respectant le style :

> **Style Visuel :** Neumorphisme (Soft UI) moderne et épuré.
> **Palette de Couleurs :**
> - Fond principal : Gris très clair (#F0F0F0 / `hsl(0 0% 88%)`) pour le mode clair, Gris très sombre (`hsl(0 0% 8%)`) pour le mode sombre.
> - Cartes : Blanc cassé (`hsl(0 0% 96%)`) avec des ombres douces.
> - Primaire : Gris anthracite (`hsl(0 0% 20%)`) pour le texte et les éléments actifs.
> - Accents : Or (#F59E0B) et Bleu (#3B82F6) pour les statuts et graphiques.
> **Typographie :** Sans-serif moderne (Inter ou équivalent), titres en gras.
> **Composants UI :**
> - **Cartes (`neu-card`)** : Bords arrondis (1rem), ombres douces (lumière en haut à gauche, ombre en bas à droite).
> - **Boutons (`neu-raised`)** : Aspect surélevé, s'enfoncent au clic (`neu-inset`).
> - **Navigation** : Sidebar détachée sur la gauche, style "flottant".
> **Interactions :** Micro-animations au survol (légère élévation), transitions douces.

---

## 2. Configuration Tailwind (`tailwind.config.ts`)

Copiez cette configuration pour définir les couleurs et ombres.

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"], // Adaptez selon votre structure
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      boxShadow: {
        'neo-sm': 'var(--neo-shadow-sm)',
        'neo-md': 'var(--neo-shadow-md)',
        'neo-lg': 'var(--neo-shadow-lg)',
        'neo-inset': 'var(--neo-shadow-inset)',
        'neo-inset-lg': 'var(--neo-shadow-inset-lg)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 3. Styles CSS Globaux (`index.css`)

Ajoutez ces variables CSS pour activer le Neumorphisme.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === DESIGN NEOMORPHIQUE === */
    --background: 0 0% 88%;
    --foreground: 0 0% 5%;
    
    --card: 0 0% 96%;
    --card-foreground: 0 0% 5%;
    
    --primary: 0 0% 20%;
    --primary-foreground: 0 0% 98%;
    
    --secondary: 0 0% 75%;
    --secondary-foreground: 0 0% 10%;
    
    --accent: 0 0% 70%;
    --accent-foreground: 0 0% 8%;
    
    --muted: 0 0% 80%;
    --muted-foreground: 0 0% 25%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 8%;
    
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    
    --border: 0 0% 68%;
    --input: 0 0% 92%;
    --ring: 0 0% 25%;
    
    --radius: 1rem;
    
    /* === OMBRES NEOMORPHIQUES === */
    --neo-shadow-sm: 6px 6px 12px rgba(130, 130, 130, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.9);
    --neo-shadow-md: 10px 10px 20px rgba(120, 120, 120, 0.45), -10px -10px 20px rgba(255, 255, 255, 0.95);
    --neo-shadow-lg: 15px 15px 30px rgba(110, 110, 110, 0.5), -15px -15px 30px rgba(255, 255, 255, 1);
    --neo-shadow-inset: inset 6px 6px 12px rgba(130, 130, 130, 0.35), inset -6px -6px 12px rgba(255, 255, 255, 0.8);
    --neo-shadow-inset-lg: inset 10px 10px 20px rgba(120, 120, 120, 0.4), inset -10px -10px 20px rgba(255, 255, 255, 0.85);
    
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dark {
    --background: 0 0% 8%;
    --foreground: 0 0% 98%;
    --card: 0 0% 12%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 45%;
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 18%;
    --muted-foreground: 0 0% 65%;
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    
    /* Ombres néomorphiques pour mode sombre */
    --neo-shadow-sm: 4px 4px 8px rgba(0, 0, 0, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.05);
    --neo-shadow-md: 8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.08);
    --neo-shadow-lg: 12px 12px 24px rgba(0, 0, 0, 0.7), -12px -12px 24px rgba(255, 255, 255, 0.1);
    --neo-shadow-inset: inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.05);
  }
}

@layer utilities {
  /* Classes utilitaires pour le Neumorphisme */
  .neu-card {
    background: hsl(var(--card));
    box-shadow: 
      4px 4px 8px rgba(150, 150, 150, 0.5),
      -4px -4px 8px rgba(255, 255, 255, 1),
      inset 1px 1px 2px rgba(255, 255, 255, 0.8),
      inset -1px -1px 2px rgba(150, 150, 150, 0.3);
    border-radius: var(--radius);
    transition: var(--transition-smooth);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
  
  .dark .neu-card {
    box-shadow: 
      4px 4px 8px rgba(0, 0, 0, 0.4),
      -4px -4px 8px rgba(255, 255, 255, 0.05),
      inset 1px 1px 2px rgba(0, 0, 0, 0.3),
      inset -1px -1px 2px rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .neu-raised {
    background: hsl(var(--card));
    box-shadow: 
      3px 3px 6px rgba(150, 150, 150, 0.4),
      -3px -3px 6px rgba(255, 255, 255, 0.9),
      inset 1px 1px 1px rgba(255, 255, 255, 0.7),
      inset -1px -1px 1px rgba(150, 150, 150, 0.25);
    border-radius: var(--radius);
    transition: var(--transition-fast);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  
  .dark .neu-raised {
    box-shadow: 
      3px 3px 6px rgba(0, 0, 0, 0.3),
      -3px -3px 6px rgba(255, 255, 255, 0.04),
      inset 1px 1px 1px rgba(0, 0, 0, 0.25),
      inset -1px -1px 1px rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .neu-raised:hover {
    box-shadow: 
      4px 4px 8px rgba(140, 140, 140, 0.5),
      -4px -4px 8px rgba(255, 255, 255, 1),
      inset 1px 1px 1px rgba(255, 255, 255, 0.8),
      inset -1px -1px 1px rgba(140, 140, 140, 0.3);
  }
  
  .neu-inset {
    background: hsl(var(--card));
    box-shadow: var(--neo-shadow-inset);
    border-radius: var(--radius);
    transition: var(--transition-fast);
  }
}
```

---

## 4. Template de Layout Dashboard

Structure de base d'une page dashboard avec sidebar.

```tsx
import React, { useState } from "react";
import { LayoutDashboard, Settings, LogOut, ChevronRight, ChevronDown } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        
        {/* Sidebar Détachée */}
        <aside className="neu-card w-64 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center">
              <span className="font-bold text-xl">L</span>
            </div>
            <div>
              <div className="font-bold">LOGO</div>
              <div className="text-xs text-muted-foreground">Espace Utilisateur</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            <button className="neu-inset w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-primary">
              <LayoutDashboard className="w-4 h-4" />
              Tableau de Bord
            </button>
            
            <button className="neu-raised w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:shadow-neo-md transition-all">
              <Settings className="w-4 h-4" />
              Paramètres
            </button>
          </nav>

          {/* Footer Sidebar */}
          <div className="pt-4 border-t border-border">
            <button className="neu-raised w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:shadow-neo-md transition-all">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu Principal */}
        <main className="flex-1">
          <div className="neu-card p-8 min-h-[calc(100vh-3rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 5. Composants Réutilisables

### StatCard (Carte de Statistique)

```tsx
import React from "react";
import { TrendingUp } from "lucide-react";

export const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="neu-raised p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-success text-sm font-medium">
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-foreground">{value}</h3>
    </div>
  );
};
```

### SectionCard (Conteneur de Section)

```tsx
import React from "react";

export const SectionCard = ({ title, children, action }) => {
  return (
    <div className="neu-card p-6 rounded-2xl border border-white/50 dark:border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
};
```

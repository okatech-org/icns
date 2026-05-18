# Prompt pour le Système de Design de l'Espace Utilisateur et l'Architecture des Comptes

Ce prompt est conçu pour être utilisé avec une IA de codage (comme moi) pour répliquer ou adapter le design de l'espace utilisateur et l'architecture des comptes créés pour le projet Présidence.

## Contexte
Vous souhaitez implémenter un espace utilisateur complet, sécurisé et esthétique, avec une architecture de compte robuste sur Supabase. Le design doit être responsive (mobile/desktop) et supporter les thèmes clair/sombre.

## Instructions pour l'IA

**Rôle :** Expert en développement React, Tailwind CSS et Supabase.

**Tâche :** Implémenter l'architecture des comptes et l'interface utilisateur de l'espace membre.

### 1. Architecture des Données (Supabase)
- **Table `user_profiles` :**
  - Étendre la table `user_profiles` liée à `auth.users`.
  - Colonnes requises :
    - `id` (UUID, PK)
    - `user_id` (UUID, FK vers auth.users)
    - `full_name` (Text)
    - `avatar_url` (Text)
    - `bio` (Text)
    - `preferences` (JSONB : `{ theme: 'system' | 'light' | 'dark', language: string, notifications: boolean }`)
    - `created_at`, `updated_at` (Timestamps)
- **Politiques RLS :**
  - `SELECT` : L'utilisateur peut voir son propre profil.
  - `UPDATE` : L'utilisateur peut modifier son propre profil.

### 2. Interface Utilisateur (React + Tailwind + Shadcn/ui)
- **Layout (`UserSpaceLayout`) :**
  - **Sidebar (Desktop) / Drawer (Mobile) :**
    - Navigation vers : Tableau de bord, Profil, Paramètres.
    - Bouton de déconnexion.
    - Résumé du profil utilisateur (Avatar + Nom) en bas.
  - **Header :**
    - Bouton menu (Mobile).
    - Barre de recherche.
    - Toggle Thème (Clair/Sombre).
    - Notifications.
  - **Style :**
    - Utiliser des gradients subtils pour les titres.
    - Effets de verre (backdrop-blur) pour le header.
    - Transitions douces pour le sidebar.

- **Pages :**
  - **Tableau de bord (`Dashboard`) :**
    - Widgets statistiques (Cartes avec icônes).
    - Liste des activités récentes.
    - Accès rapide aux actions principales.
  - **Profil (`Profile`) :**
    - Formulaire d'édition des informations (Nom, Bio).
    - Upload d'avatar.
    - Affichage de l'email (lecture seule).
  - **Paramètres (`Settings`) :**
    - Gestion du thème.
    - Préférences de notifications.
    - Choix de la langue.

### 3. Stack Technique
- **Frontend :** React, Vite, Tailwind CSS.
- **UI Library :** Shadcn/ui (Radix UI).
- **Icons :** Lucide React.
- **Backend/Auth :** Supabase.
- **State Management :** React Query (TanStack Query).
- **Form Handling :** React Hook Form + Zod.

## Exemple de Code (Structure du Layout)

```tsx
// UserSpaceLayout.tsx
import { Outlet } from "react-router-dom";
// ... imports

const UserSpaceLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

## Adaptation
Pour adapter ce système à un autre projet :
1.  Modifiez les couleurs primaires/secondaires dans `tailwind.config.js`.
2.  Ajustez les éléments de navigation dans le composant `Sidebar`.
3.  Adaptez les widgets du `Dashboard` selon les données métier.

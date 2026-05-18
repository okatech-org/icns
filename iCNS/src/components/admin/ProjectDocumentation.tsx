import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  Bot, 
  Database, 
  Shield, 
  Workflow, 
  GitBranch,
  Mic,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ProjectDocumentation = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Vue d'ensemble */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Vue d'ensemble du projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Présidence de la République Gabonaise - Plateforme iAsted</h3>
            <p className="text-muted-foreground leading-relaxed">
              Plateforme de gestion intégrée pour la Présidence du Gabon avec assistant vocal IA (iAsted). 
              Le système offre des espaces de travail dédiés pour chaque service de la présidence avec des 
              fonctionnalités adaptées à leurs besoins spécifiques (gestion de courrier, protocole, sécurité, etc.).
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">Technologies principales</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React + TypeScript + Vite</li>
                <li>• Supabase (DB, Auth, Storage, Edge Functions)</li>
                <li>• OpenAI Realtime API (WebRTC)</li>
                <li>• Tailwind CSS + Design System personnalisé</li>
                <li>• React Query + React Router</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <h4 className="font-semibold mb-2">Caractéristiques clés</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-rôles avec permissions granulaires</li>
                <li>• Assistant vocal IA contextuel par rôle</li>
                <li>• Gestion de documents officiels</li>
                <li>• Sécurité renforcée (RLS, encryption)</li>
                <li>• Interface adaptative neomorphique</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture système */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Architecture du système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Architecture en couches</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Couche Frontend</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>React SPA</strong> avec routing client-side, gestion d'état via React Query, 
                  contextes React pour l'authentification et les préférences utilisateur. Design System 
                  neomorphique personnalisé avec tokens CSS HSL.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Couche Backend</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Supabase</strong> comme backend as a service : PostgreSQL pour la DB, 
                  Row Level Security (RLS) pour la sécurité, Storage pour les fichiers, 
                  Edge Functions Deno pour la logique serveur et les intégrations API.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Couche IA</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>OpenAI Realtime API</strong> via WebRTC pour l'assistant vocal iAsted. 
                  Connexion directe audio-to-audio avec détection de parole (VAD), tool calling 
                  pour les actions système, et contexte personnalisé par rôle.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Flux de données</h3>
            <div className="p-4 rounded-lg bg-muted/30">
              <ol className="text-sm space-y-2 text-muted-foreground">
                <li><strong>1. Authentification :</strong> Supabase Auth → user_roles → Contexte utilisateur</li>
                <li><strong>2. Données métier :</strong> Supabase DB (RLS) → React Query → Components</li>
                <li><strong>3. Temps réel :</strong> Supabase Realtime → Subscriptions → State updates</li>
                <li><strong>4. IA Vocale :</strong> Microphone → WebRTC → OpenAI → Audio output</li>
                <li><strong>5. Actions IA :</strong> Tool calls → Event dispatch → UI updates</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comptes et rôles */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Comptes et rôles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {/* Admin */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Admin Système (Super Admin)</h4>
                <Badge>Niveau Maximum</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès total au système. Gère les utilisateurs, la configuration IA, la base de connaissances, 
                les logs d'audit et les paramètres système. Peut adopter le contexte de n'importe quel rôle 
                en mode "chameleon" via SuperAdminContext.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Espace :</strong> AdminSpace.tsx • <strong>Fonctionnalités :</strong> User management, 
                AI config, Knowledge base, Audit logs, System settings, Role chameleon mode
              </div>
            </div>

            {/* Président */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Président de la République</h4>
                <Badge variant="secondary">Exécutif</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Vue d'ensemble nationale avec KPIs, projets présidentiels, nominations, signalements critiques, 
                opinion publique. Module XR7 (confidentiel). Conseil des ministres. Assistant iAsted avec 
                contexte présidentiel complet.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Espace :</strong> PresidentSpace.tsx • <strong>Modules :</strong> Vue d'ensemble, 
                Projets présidentiels, Nominations, Opinion publique, Situations critiques, Module XR7, 
                Vision nationale, Conseil des ministres
              </div>
            </div>

            {/* DGSS */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Direction Générale de la Sécurité d'État (DGSS)</h4>
                <Badge variant="secondary">Sécurité</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Surveillance des menaces, rapports de renseignement, cibles de surveillance, 
                indicateurs de menaces avec heatmap géographique et tendances temporelles.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Espace :</strong> DgssSpace.tsx • <strong>Modules :</strong> Rapports intelligence, 
                Cibles surveillance, Indicateurs menaces, Heatmap régionale, Analyse tendances
              </div>
            </div>

            {/* Secrétariat Général */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Secrétaire Général</h4>
                <Badge variant="secondary">Administration</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Gestion administrative générale, coordination des services, revue juridique des documents, 
                archives administratives, projets ministériels.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Espace :</strong> SecretariatGeneralSpace.tsx • <strong>Modules :</strong> Projets 
                ministériels, Revues juridiques, Archives, Coordination
              </div>
            </div>

            {/* Service Courrier */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Service du Courrier</h4>
                <Badge variant="secondary">Logistique</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Traitement et routage du courrier entrant/sortant, analyse IA pour classification et routage 
                automatique, tracking des courriers, statistiques.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Espace :</strong> ServiceCourriersSpace.tsx • <strong>Modules :</strong> Inbox courrier, 
                Analyse IA, Routage, Statistiques
              </div>
            </div>

            {/* Service Réception */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Service de Réception</h4>
                <Badge variant="secondary">Accueil</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Dépôt et numérisation de documents physiques, OCR automatique, classification par IA, 
                génération de récépissés, historique des dépôts.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Espace :</strong> ServiceReceptionSpace.tsx • <strong>Modules :</strong> Upload documents, 
                OCR, Classification IA, Récépissés, Historique
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iAsted en détail */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            iAsted - Assistant Vocal Intelligent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Concept et architecture</h3>
            <p className="text-muted-foreground mb-4">
              iAsted est un assistant vocal IA intégré qui adapte son comportement, ses connaissances et 
              ses capacités selon le rôle de l'utilisateur connecté. Il utilise OpenAI Realtime API 
              pour des conversations audio bidirectionnelles en temps réel via WebRTC.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Composants principaux</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Bouton iAsted (IAstedButtonFull)
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Bouton flottant en bas à droite de chaque espace. États visuels :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Déconnecté :</strong> Bleu neutre, clic simple pour se connecter</li>
                  <li>• <strong>Connexion :</strong> Animation pulsation bleue</li>
                  <li>• <strong>Écoute :</strong> Vert avec onde audio animée (VAD actif)</li>
                  <li>• <strong>Traitement :</strong> Jaune/orange pendant analyse</li>
                  <li>• <strong>Parle :</strong> Rouge avec onde audio pendant réponse</li>
                  <li>• <strong>Double-clic :</strong> Ouvre la modal de chat textuel</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Workflow className="h-4 w-4" /> Hook useRealtimeVoiceWebRTC
                </h4>
                <p className="text-sm text-muted-foreground">
                  Gère la connexion WebRTC avec OpenAI, le streaming audio bidirectionnel, 
                  la détection de parole (VAD), les transcriptions, et les tool calls. 
                  Génère des tokens éphémères via edge function pour la sécurité.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Modal IAstedChatModal
                </h4>
                <p className="text-sm text-muted-foreground">
                  Interface de chat textuel alternative pour les interactions sans audio. 
                  Historique des messages avec transcriptions audio et réponses textuelles. 
                  Paramètres vocaux : choix de voix, contrôles audio.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" /> SuperAdminContext
                </h4>
                <p className="text-sm text-muted-foreground">
                  Pour le Super Admin uniquement : fournit un bouton iAsted global avec mode "chameleon". 
                  L'admin peut adopter le contexte de n'importe quel rôle pour tester. Gère les tool calls 
                  globalement et dispatch des événements custom pour la navigation et le contrôle UI.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Prompts système contextuels</h3>
            <p className="text-muted-foreground mb-3">
              Chaque rôle a un prompt système personnalisé défini dans :
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• <code className="bg-muted px-1 py-0.5 rounded">config/role-contexts.ts</code> - Contextes par rôle</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">utils/generateSystemPrompt.ts</code> - Génération dynamique</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">utils/contextMerger.ts</code> - Fusion admin/chameleon</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Le prompt inclut : titre/protocole d'adresse, niveau d'accès, outils disponibles, 
              contexte métier spécifique, ton de conversation adapté.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Outils (Tool Calling)</h3>
            <p className="text-muted-foreground mb-3">
              L'assistant peut déclencher des actions via tool calling :
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <strong>navigate_within_space</strong>
                <p className="text-muted-foreground text-xs">Navigation locale entre sections de l'espace actuel</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <strong>navigate_app</strong>
                <p className="text-muted-foreground text-xs">Navigation globale vers d'autres espaces/pages</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <strong>control_ui</strong>
                <p className="text-muted-foreground text-xs">Contrôle UI (thème, sidebar, etc.)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <strong>generate_document</strong>
                <p className="text-muted-foreground text-xs">Génération documents officiels PDF/DOCX</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <strong>query_knowledge_base</strong>
                <p className="text-muted-foreground text-xs">Recherche dans base de connaissances</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <strong>manage_system_settings</strong>
                <p className="text-muted-foreground text-xs">Configuration système (admin uniquement)</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Flux de fonctionnement</h3>
            <div className="p-4 rounded-lg bg-muted/30">
              <ol className="text-sm space-y-2 text-muted-foreground">
                <li><strong>1. Connexion :</strong> Génération token éphémère → WebRTC peer connection → Session created</li>
                <li><strong>2. Configuration :</strong> Envoi session.update avec prompt, voix, outils, VAD settings</li>
                <li><strong>3. Salutation :</strong> L'assistant se présente automatiquement selon le rôle</li>
                <li><strong>4. Écoute continue :</strong> VAD détecte la parole → Audio streamed vers OpenAI</li>
                <li><strong>5. Traitement :</strong> LLM analyse → Génère réponse/tool calls → Audio response</li>
                <li><strong>6. Actions :</strong> Tool calls exécutés → Événements dispatched → UI réagit</li>
                <li><strong>7. Déconnexion :</strong> Cleanup WebRTC → Arrêt microphone</li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Edge Functions liées</h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <code className="bg-muted px-1 py-0.5 rounded">get-realtime-token</code> - Génère tokens éphémères OpenAI</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">list-voices</code> - Liste des voix disponibles</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Pages et fonctionnalités */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Pages et fonctionnalités clés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Authentification (Auth.tsx)</h4>
              <p className="text-sm text-muted-foreground">
                Page de connexion avec email/password. Après auth, redirection automatique vers l'espace 
                correspondant au rôle de l'utilisateur (user_roles table). Design neomorphique avec 
                animations.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Génération de documents (DocumentGenerator)</h4>
              <p className="text-sm text-muted-foreground">
                Interface de génération de documents officiels (PDF/DOCX). Templates personnalisables par 
                service. Génération via jsPDF avec en-têtes/pieds de page officiels, logo, watermark. 
                Stockage Supabase et historique.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Gestion des utilisateurs (UserManagementSection)</h4>
              <p className="text-sm text-muted-foreground">
                CRUD utilisateurs avec assignation de rôles. Filtrage et recherche. Changement de mot de passe. 
                Désactivation/activation de comptes. Visible uniquement pour les admins.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Base de connaissances (KnowledgeBaseSection)</h4>
              <p className="text-sm text-muted-foreground">
                Gestion de documents de référence pour l'IA. Upload de fichiers, catégorisation, tags, 
                contrôle d'accès par niveau. Utilisé par iAsted via tool calling pour répondre à des 
                questions spécifiques.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Audit Logs (AuditLogSection)</h4>
              <p className="text-sm text-muted-foreground">
                Traçabilité complète des actions système : connexions, modifications de données, 
                tool calls IA, erreurs. Filtres par date, utilisateur, action, ressource. Export CSV/PDF.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Feedback Rôles (RoleFeedbackModal)</h4>
              <p className="text-sm text-muted-foreground">
                Modal permettant aux utilisateurs de proposer de nouveaux rôles avec description détaillée, 
                upload de documents justificatifs. Les admins reçoivent les feedbacks et peuvent les traiter.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-semibold mb-2">Row Level Security (RLS)</h4>
              <p className="text-sm text-muted-foreground">
                Toutes les tables Supabase ont des politiques RLS strictes. Les utilisateurs ne peuvent 
                accéder qu'à leurs propres données ou celles de leur niveau d'autorisation. Policies basées 
                sur auth.uid() et user_roles.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-semibold mb-2">Authentification & Sessions</h4>
              <p className="text-sm text-muted-foreground">
                Supabase Auth avec JWT. Sessions expirées automatiquement. Refresh tokens sécurisés. 
                Pas de tokens stockés en localStorage (httpOnly cookies via Supabase).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-semibold mb-2">Edge Functions sécurisées</h4>
              <p className="text-sm text-muted-foreground">
                Toutes les clés API (OpenAI, etc.) stockées en secrets Supabase côté serveur. 
                Les edge functions vérifient l'auth avant traitement. Tokens éphémères pour OpenAI 
                Realtime (1h de validité).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-semibold mb-2">Messages chiffrés</h4>
              <p className="text-sm text-muted-foreground">
                Les messages sensibles (encrypted_messages table) utilisent un chiffrement applicatif. 
                Clés de chiffrement stockées de façon sécurisée. Accès restreint au destinataire uniquement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design System */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Design System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Style Neomorphique</h3>
            <p className="text-muted-foreground mb-3">
              Interface utilisant un design neomorphique (soft UI) avec ombres et reliefs subtils. 
              Classes CSS personnalisées :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <code className="bg-muted px-1 py-0.5 rounded">neu-card</code> - Container principal</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">neu-raised</code> - Élément en relief (bouton)</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">neu-inset</code> - Élément enfoncé (actif)</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">shadow-neo-*</code> - Ombres neomorphiques</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Tokens sémantiques HSL</h3>
            <p className="text-muted-foreground mb-3">
              Toutes les couleurs sont définies en HSL dans index.css et tailwind.config.ts :
            </p>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-background border border-border">
                <code>--background</code> - Fond principal
              </div>
              <div className="p-2 rounded bg-foreground text-background border border-border">
                <code>--foreground</code> - Texte principal
              </div>
              <div className="p-2 rounded bg-primary text-primary-foreground border border-border">
                <code>--primary</code> - Couleur principale
              </div>
              <div className="p-2 rounded bg-secondary text-secondary-foreground border border-border">
                <code>--secondary</code> - Couleur secondaire
              </div>
              <div className="p-2 rounded bg-muted text-muted-foreground border border-border">
                <code>--muted</code> - Éléments atténués
              </div>
              <div className="p-2 rounded bg-accent text-accent-foreground border border-border">
                <code>--accent</code> - Accents
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Mode sombre/clair</h3>
            <p className="text-muted-foreground">
              Thème dynamique via next-themes. Variables CSS redéfinies automatiquement selon le mode. 
              Transition fluide entre les modes. Préférence sauvegardée dans localStorage.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Base de données */}
      <Card className="neu-raised border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Structure base de données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            PostgreSQL via Supabase avec +40 tables organisées par domaine métier :
          </p>
          
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Utilisateurs & Auth</h4>
              <p className="text-xs text-muted-foreground">
                user_roles, user_profiles, user_preferences
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">iAsted & IA</h4>
              <p className="text-xs text-muted-foreground">
                conversation_sessions, conversation_messages, analytics_voice_events, iasted_config, 
                knowledge_base
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Documents & Courrier</h4>
              <p className="text-xs text-muted-foreground">
                documents, mails, mail_routing, mail_ai_analysis, mail_attachments, generated_documents, 
                document_folders, document_history
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Protocole & Événements</h4>
              <p className="text-xs text-muted-foreground">
                official_events, guest_lists, protocol_procedures, vip_contacts
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Présidence</h4>
              <p className="text-xs text-muted-foreground">
                projets_presidentiels, nominations, signalements, presidential_decisions, opinion_publique, 
                conseil_ministres_sessions, ordre_du_jour
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Sécurité & Renseignement</h4>
              <p className="text-xs text-muted-foreground">
                intelligence_reports, surveillance_targets, threat_indicators, encrypted_messages
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Cabinet Privé</h4>
              <p className="text-xs text-muted-foreground">
                private_audiences, private_trips, personal_correspondence
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-1">Administration</h4>
              <p className="text-xs text-muted-foreground">
                audit_logs, system_settings, decrets_ordonnances, ministerial_projects, legal_reviews, 
                interministerial_coordination
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note :</strong> Toutes les tables ont des politiques RLS actives. Les relations 
              entre tables utilisent des foreign keys pour l'intégrité référentielle. Les timestamps 
              (created_at, updated_at) sont gérés automatiquement via triggers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

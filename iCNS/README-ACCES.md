# Accès Lovable Cloud & Pilotage depuis Cursor

## 🔑 Identifiants Supabase (Lovable Cloud)

### Projet Actif
- **Project ID**: `sfsoqoeunivgorrgioap`
- **URL**: `https://sfsoqoeunivgorrgioap.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc29xb2V1bml2Z29ycmdpb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTYzNzYsImV4cCI6MjA3ODk5MjM3Nn0.ZScYyz5-E24G4L2CNM9DpQ-ZEYhXMfzrlvlGDa1zCIw`

### Variables d'environnement (fichier .env)
Le fichier `.env` à la racine contient déjà:
```
VITE_SUPABASE_PROJECT_ID="sfsoqoeunivgorrgioap"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://sfsoqoeunivgorrgioap.supabase.co"
```

## 🛠️ Configuration Cursor/IDE Local

### Prérequis
```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Structure importante
- `supabase/config.toml` - Configuration du projet Supabase
- `supabase/functions/` - Edge Functions (déployées automatiquement)
- `supabase/migrations/` - Migrations de base de données
- `src/integrations/supabase/` - Client et types auto-générés (NE PAS MODIFIER)

## 🔐 Secrets Configurés

Les secrets suivants sont déjà configurés dans Lovable Cloud:
- `ELEVENLABS_API_KEY` - Pour la synthèse vocale iAsted
- `OPENAI_API_KEY` - Pour l'API OpenAI
- `GEMINI_API_KEY` - Pour Google Gemini
- `SUPABASE_*` - Clés Supabase (auto-gérées)
- `LOVABLE_API_KEY` - Clé API Lovable

## 📡 Endpoints Edge Functions

**Base URL**: `https://sfsoqoeunivgorrgioap.supabase.co`

### Fonctions disponibles
```
POST /functions/v1/chat-with-iasted          # Chat avec l'assistant IA
POST /functions/v1/text-to-speech           # Synthèse vocale
POST /functions/v1/transcribe-audio         # Transcription audio
POST /functions/v1/log-analytics            # Logs d'événements
GET  /functions/v1/list-voices              # Liste des voix disponibles
POST /functions/v1/elevenlabs-signed-url    # URL signée ElevenLabs
GET  /functions/v1/get-realtime-token       # Token OpenAI Realtime
POST /functions/v1/grant-president          # Attribution rôle président (admin)
POST /functions/v1/create-elevenlabs-agent  # Création agent ElevenLabs (admin)
POST /functions/v1/initialize-demo-accounts # Initialisation comptes démo (admin)
```

### Test rapide des APIs
```bash
# Tester list-voices
./scripts/test-api.sh

# Ou manuellement
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  "https://sfsoqoeunivgorrgioap.supabase.co/functions/v1/list-voices"
```

## 💾 Accès Base de Données

### Tables principales
- `user_roles` - Rôles utilisateurs (admin, president, dgss, dgr, minister, user)
- `signalements` - Signalements de corruption
- `national_kpis` - Indicateurs nationaux
- `opinion_publique` - Données d'opinion publique
- `conversation_sessions` - Sessions de conversation iAsted
- `conversation_messages` - Messages des conversations
- `iasted_config` - Configuration de l'agent iAsted
- `analytics_voice_events` - Événements analytics vocaux

### Connexion depuis code
```typescript
import { supabase } from "@/integrations/supabase/client";

// Exemple: Lire les KPIs
const { data, error } = await supabase
  .from('national_kpis')
  .select('*')
  .order('date', { ascending: false })
  .limit(1);
```

### Migrations
```bash
# Les migrations sont dans supabase/migrations/
# Elles sont appliquées automatiquement par Lovable

# Pour créer une nouvelle migration (via Lovable uniquement)
# Utiliser l'outil de migration dans le chat Lovable
```

## 🔄 Synchronisation Lovable ↔ Cursor

### Workflow recommandé
1. **Développement dans Cursor**:
   - Modifier les fichiers localement
   - Commit Git: `git add . && git commit -m "description"`
   - Push: `git push origin main`
   - ✅ Auto-sync vers Lovable

2. **Développement dans Lovable**:
   - Modifications via l'interface Lovable
   - ✅ Auto-deploy des Edge Functions
   - Pull depuis Cursor: `git pull origin main`

### Commandes Git utiles
```bash
# Voir l'état des modifications
git status

# Synchroniser depuis Lovable
git pull origin main

# Envoyer vers Lovable
git push origin main

# Voir l'historique
git log --oneline
```

## 🚀 Déploiement

### Frontend
- Les changements frontend nécessitent un clic sur "Update" dans Lovable
- Ou utiliser le bouton "Publish" dans l'interface

### Backend (Edge Functions)
- ✅ **Déploiement automatique** à chaque changement
- Pas besoin d'action manuelle
- Les logs sont disponibles dans Lovable Cloud

## 📝 Notes importantes

1. **NE JAMAIS modifier**:
   - `src/integrations/supabase/types.ts` (auto-généré)
   - `src/integrations/supabase/client.ts` (auto-généré)
   - `.env` (géré par Lovable Cloud)

2. **Rôles et permissions**:
   - Utiliser toujours `user_roles` pour les autorisations
   - Ne jamais stocker les rôles dans localStorage
   - Toujours valider côté serveur

3. **Sécurité RLS**:
   - Toutes les tables ont des politiques RLS actives
   - Utiliser `auth.uid()` pour les vérifications utilisateur
   - Utiliser les fonctions `has_role()` et `is_president()` pour les rôles

## 🔗 Liens utiles

- **Lovable Dashboard**: https://lovable.dev
- **Documentation Lovable**: https://docs.lovable.dev
- **Documentation Supabase**: https://supabase.com/docs

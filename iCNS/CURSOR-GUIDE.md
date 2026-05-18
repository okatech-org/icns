# Guide Cursor - Commandes et Accès au Projet

## 🔌 Configuration de connexion

### Variables d'environnement (.env)
```env
VITE_SUPABASE_PROJECT_ID="sfsoqoeunivgorrgioap"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc29xb2V1bml2Z29ycmdpb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTYzNzYsImV4cCI6MjA3ODk5MjM3Nn0.ZScYyz5-E24G4L2CNM9DpQ-ZEYhXMfzrlvlGDa1zCIw"
VITE_SUPABASE_URL="https://sfsoqoeunivgorrgioap.supabase.co"
```

## 📊 Accès à la Base de Données

### Via le Client Supabase (Recommandé)

#### 1. Créer un script de requête rapide
```typescript
// scripts/db-query.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

const supabase = createClient<Database>(
  'https://sfsoqoeunivgorrgioap.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc29xb2V1bml2Z29ycmdpb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTYzNzYsImV4cCI6MjA3ODk5MjM3Nn0.ZScYyz5-E24G4L2CNM9DpQ-ZEYhXMfzrlvlGDa1zCIw'
);

async function query() {
  // Exemple: Lire les KPIs
  const { data, error } = await supabase
    .from('national_kpis')
    .select('*')
    .order('date', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Erreur:', error);
  } else {
    console.log('Résultats:', data);
  }
}

query();
```

```bash
# Exécuter
npx tsx scripts/db-query.ts
```

#### 2. Exemples de requêtes courantes

**Lire des données:**
```typescript
// Tous les signalements
const { data } = await supabase.from('signalements').select('*');

// Avec filtres
const { data } = await supabase
  .from('signalements')
  .select('*')
  .eq('statut', 'nouveau')
  .gte('montant_fcfa', 1000000);

// Avec jointures
const { data } = await supabase
  .from('conversation_messages')
  .select('*, conversation_sessions(user_id)')
  .eq('role', 'assistant');
```

**Insérer des données:**
```typescript
const { data, error } = await supabase
  .from('signalements')
  .insert({
    titre: 'Test',
    categorie: 'corruption',
    code: 'SIG-2025-001',
    description: 'Description test'
  })
  .select();
```

**Mettre à jour:**
```typescript
const { data, error } = await supabase
  .from('signalements')
  .update({ statut: 'en_cours' })
  .eq('id', 'uuid-ici')
  .select();
```

**Supprimer:**
```typescript
const { data, error } = await supabase
  .from('signalements')
  .delete()
  .eq('id', 'uuid-ici');
```

### Via SQL Direct (Service Role uniquement)

⚠️ **Important:** Nécessite la clé `service_role` (à ne jamais exposer côté client)

```typescript
// scripts/db-sql.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://sfsoqoeunivgorrgioap.supabase.co',
  'SERVICE_ROLE_KEY_ICI' // À obtenir depuis les secrets
);

async function runSQL() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT * FROM national_kpis 
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC
    `
  });
  
  console.log(data);
}
```

## 🔧 Edge Functions

### Tester les Edge Functions localement

```bash
# Installer Deno (si pas déjà fait)
curl -fsSL https://deno.land/x/install/install.sh | sh

# Tester une fonction
cd supabase/functions/chat-with-iasted
deno run --allow-net --allow-env index.ts
```

### Appeler les Edge Functions depuis Cursor

```typescript
// scripts/test-edge-function.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://sfsoqoeunivgorrgioap.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc29xb2V1bml2Z29ycmdpb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTYzNzYsImV4cCI6MjA3ODk5MjM3Nn0.ZScYyz5-E24G4L2CNM9DpQ-ZEYhXMfzrlvlGDa1zCIw'
);

async function testFunction() {
  const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
    body: {
      message: 'Bonjour iAsted',
      role: 'president',
      userId: 'test-user-id'
    }
  });
  
  console.log('Réponse:', data);
  if (error) console.error('Erreur:', error);
}

testFunction();
```

### Via cURL (plus rapide)

```bash
# Test list-voices
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc29xb2V1bml2Z29ycmdpb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTYzNzYsImV4cCI6MjA3ODk5MjM3Nn0.ZScYyz5-E24G4L2CNM9DpQ-ZEYhXMfzrlvlGDa1zCIw" \
  -H "Content-Type: application/json" \
  "https://sfsoqoeunivgorrgioap.supabase.co/functions/v1/list-voices"

# Test chat-with-iasted
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc29xb2V1bml2Z29ycmdpb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTYzNzYsImV4cCI6MjA3ODk5MjM3Nn0.ZScYyz5-E24G4L2CNM9DpQ-ZEYhXMfzrlvlGDa1zCIw" \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour","role":"president","userId":"test"}' \
  "https://sfsoqoeunivgorrgioap.supabase.co/functions/v1/chat-with-iasted"
```

## 📦 Commandes NPM/Projet

### Développement
```bash
# Démarrer le serveur dev
npm run dev

# Build production
npm run build

# Preview du build
npm run preview

# Linter
npm run lint
```

### Git (Synchronisation avec Lovable)
```bash
# Voir les modifications
git status

# Committer et pusher (sync auto vers Lovable)
git add .
git commit -m "Description des changements"
git push origin main

# Récupérer depuis Lovable
git pull origin main

# Voir l'historique
git log --oneline -10
```

## 🗄️ Tables Principales

### Structure des tables importantes

**user_roles** - Gestion des rôles
```sql
- id: uuid
- user_id: uuid
- role: enum (admin, president, dgss, dgr, minister, user, cabinet_private, sec_gen, courrier, reception, protocol)
- created_at: timestamp
```

**signalements** - Signalements de corruption
```sql
- id: uuid
- code: text
- titre: text
- categorie: text
- description: text
- montant_fcfa: bigint
- statut: text
- province: text
- secteur: text
- analyse_ia: text
- recommandation_ia: text
- score_priorite_ia: integer
- created_by: uuid
- created_at: timestamp
```

**national_kpis** - Indicateurs nationaux
```sql
- id: uuid
- date: date
- signalements_totaux: integer
- cas_critiques: integer
- taux_resolution: numeric
- fonds_recuperes_fcfa: bigint
- satisfaction_publique: numeric
- indice_transparence: integer
```

**conversation_sessions** - Sessions iAsted
```sql
- id: uuid
- user_id: uuid
- focus_mode: text
- memory_summary: text
- settings: jsonb
- started_at: timestamp
- ended_at: timestamp
```

**conversation_messages** - Messages iAsted
```sql
- id: uuid
- session_id: uuid
- role: text (user/assistant)
- content: text
- audio_url: text
- latency_ms: integer
- tokens: integer
```

## 🔐 Secrets Configurés

Les secrets suivants sont disponibles pour les Edge Functions:

- `ELEVENLABS_API_KEY` - Synthèse vocale
- `OPENAI_API_KEY` - API OpenAI
- `GEMINI_API_KEY` - Google Gemini
- `SUPABASE_URL` - URL du projet
- `SUPABASE_ANON_KEY` - Clé publique
- `SUPABASE_SERVICE_ROLE_KEY` - Clé admin (Ne jamais exposer!)

### Utiliser les secrets dans les Edge Functions
```typescript
const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
if (!apiKey) {
  throw new Error('ELEVENLABS_API_KEY not configured');
}
```

## 📝 Snippets Utiles

### Vérifier le rôle d'un utilisateur
```typescript
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);

const isPresident = roles?.some(r => r.role === 'president');
```

### Créer une session de conversation
```typescript
const { data: session } = await supabase
  .from('conversation_sessions')
  .insert({
    user_id: userId,
    focus_mode: 'general',
    settings: { temperature: 0.7 }
  })
  .select()
  .single();
```

### Ajouter un message
```typescript
const { data: message } = await supabase
  .from('conversation_messages')
  .insert({
    session_id: sessionId,
    role: 'user',
    content: 'Bonjour iAsted'
  })
  .select()
  .single();
```

## 🐛 Debugging

### Voir les logs des Edge Functions
```bash
# Via le script de test
./scripts/test-api.sh

# Via Lovable interface (recommandé)
# Ou consulter les logs dans l'interface Cloud
```

### Logger dans les Edge Functions
```typescript
console.log('[DEBUG]', { variable1, variable2 });
console.error('[ERROR]', error);
```

### Inspecter la base de données
```typescript
// Compter les enregistrements
const { count } = await supabase
  .from('signalements')
  .select('*', { count: 'exact', head: true });

// Vérifier les données récentes
const { data } = await supabase
  .from('conversation_messages')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```

## 🚀 Workflow Recommandé

1. **Développement local:**
   ```bash
   npm run dev
   # Faire les modifications
   ```

2. **Tester les changements:**
   ```bash
   # Tester les edge functions
   npx tsx scripts/test-edge-function.ts
   
   # Tester les requêtes DB
   npx tsx scripts/db-query.ts
   ```

3. **Commit et push:**
   ```bash
   git add .
   git commit -m "Description"
   git push origin main
   # Auto-déploiement vers Lovable
   ```

4. **Vérifier le déploiement:**
   - Les Edge Functions se déploient automatiquement
   - Le frontend nécessite un clic sur "Update" dans Lovable

## 📚 Ressources

- **Documentation Supabase:** https://supabase.com/docs
- **Documentation Lovable:** https://docs.lovable.dev
- **TypeScript Supabase Client:** https://supabase.com/docs/reference/javascript/introduction
- **Edge Functions:** https://supabase.com/docs/guides/functions

# 🚀 Guide de Déploiement - Projet Oeil de Lynx

## Architecture

Le système de veille stratégique "Oeil de Lynx" est composé de 3 couches :

1. **Collecteurs Externes** (scripts Node.js/Python) - Serveur VPS/Local
2. **Base de Données Vectorielle** (Supabase + pgvector) - Cloud
3. **Cerveau IA** (Edge Functions) - Analyse automatique

## 📋 Prérequis

### Serveur de Collecte (VPS ou Machine Locale)
- **Node.js** v18+ (pour le bot WhatsApp)
- **Python** 3.9+ (pour les scrapers web/YouTube)
- **Connexion internet stable** (pour maintenir la session WhatsApp)

### APIs Requises
- **Gemini API Key** (analyse IA) - Déjà configurée ✅
- **OpenAI API Key** (embeddings vectoriels) - Déjà configurée ✅

## 🔧 Configuration

### Étape 1 : Récupérer la clé Service Role

1. Ouvrez votre projet Supabase
2. Allez dans **Settings** → **API**
3. Copiez la clé **`service_role`** (⚠️ PAS la clé `anon`)

### Étape 2 : Configurer les credentials

Exécutez le script de configuration :

```bash
cd scripts/intelligence
chmod +x configure_env.sh
./configure_env.sh
```

Ou créez manuellement le fichier `.env` :

```bash
# scripts/intelligence/.env
SUPABASE_URL=https://sfsoqoeunivgorrgioap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<VOTRE_CLE_SERVICE_ROLE_ICI>
GEMINI_API_KEY=<OPTIONNEL_SI_DEJA_DANS_SUPABASE>
```

⚠️ **IMPORTANT** : Ne commitez JAMAIS ce fichier sur Git (déjà dans `.gitignore`)

### Étape 3 : Installer les dépendances

#### Bot WhatsApp (Node.js)
```bash
npm install
```

Dépendances :
- `whatsapp-web.js` - Client WhatsApp
- `qrcode-terminal` - Affichage QR code
- `@supabase/supabase-js` - Client Supabase
- `dotenv` - Gestion des variables d'environnement

#### Scrapers Web/YouTube (Python)
```bash
pip install -r requirements.txt
```

Dépendances :
- `duckduckgo-search` - Scraping web
- `youtube-search-python` - Scraping YouTube
- `supabase` - Client Python
- `python-dotenv` - Variables d'environnement

### Étape 4 : Configuration des sources

Éditez `sources.py` et `keywords.py` selon vos besoins :

**sources.py** : URLs des sites à surveiller
```python
PRESS_URLS = {
    'national': ['https://gabonmediatime.com/feed', ...],
    'international': ['https://www.jeuneafrique.com/feed', ...]
}
```

**keywords.py** : Mots-clés stratégiques
```python
PRIORITY_KEYWORDS = [
    'CTRI', 'Sécurité', 'Grève', 'Route', ...
]
```

## 🏃 Lancement

### Bot WhatsApp (Session Persistante)

```bash
node whatsapp_monitor.js
```

**Premier lancement** :
1. Un QR code s'affichera dans le terminal
2. Scannez-le avec WhatsApp (Menu → Appareils connectés)
3. La session sera sauvegardée dans `.wwebjs_auth/`

**Relances suivantes** : Connexion automatique (pas besoin de QR code)

⚠️ **Maintenance** : Le bot doit rester actif 24/7. Utilisez `pm2` ou `systemd` pour le redémarrage automatique.

### Scrapers Web/YouTube (Cron Jobs)

**Test manuel** :
```bash
python web_scraper.py
python rss_scraper.py
```

**Automatisation avec cron** :
```bash
chmod +x setup_cron.sh
./setup_cron.sh
```

Cela configurera :
- **Web scraper** : Toutes les 3 heures
- **RSS scraper** : Toutes les heures

Vérifier les crons :
```bash
crontab -l
```

## 📊 Vérification du Système

### 1. Tester l'ingestion des données

Après quelques minutes de collecte, vérifiez dans votre backend :

```sql
-- Voir les dernières données capturées
SELECT id, content, category, sentiment, published_at 
FROM intelligence_items 
ORDER BY published_at DESC 
LIMIT 10;
```

### 2. Tester la recherche vectorielle

Utilisez l'interface du dashboard DGSS ou testez via l'Edge Function :

```bash
curl -X POST https://sfsoqoeunivgorrgioap.supabase.co/functions/v1/search-intelligence \
  -H "Content-Type: application/json" \
  -d '{"query": "Que dit-on sur la sécurité à Libreville ?"}'
```

### 3. Monitoring des sources

Vérifiez l'état des sources dans le dashboard :
- **Dashboard** → **DGSS** → **Oeil de Lynx** → **Gestion des Sources**

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ **Anonymisation** : Les auteurs WhatsApp sont hashés
2. ✅ **Chiffrement** : Toutes les données transitent en HTTPS
3. ✅ **RLS** : Seuls les admins/DGSS peuvent lire les données
4. ⚠️ **Session WhatsApp** : Protégez `.wwebjs_auth/` avec des permissions strictes

```bash
chmod 700 .wwebjs_auth/
```

### Gestion des logs

```bash
# Logs du bot WhatsApp
tail -f whatsapp_monitor.log

# Logs des scrapers
tail -f scraper.log
```

## 🛠️ Troubleshooting

### Le bot WhatsApp ne se connecte pas

**Problème** : Session expirée
**Solution** : Supprimez `.wwebjs_auth/` et reconnectez avec un nouveau QR code

### Aucune donnée n'arrive dans Supabase

**Vérifiez** :
1. La clé `service_role` est correcte
2. Les Edge Functions sont déployées (automatique)
3. Les logs des scripts montrent des erreurs

```bash
node whatsapp_monitor.js 2>&1 | tee whatsapp.log
```

### Erreur "Invalid API key"

**Gemini/OpenAI** : Vérifiez que les clés sont bien configurées dans les secrets Supabase (pas dans `.env` local)

## 📈 Optimisation

### Performance des scrapers

- **Limiter le nombre de résultats** : Ajustez `max_results` dans `web_scraper.py`
- **Filtrage agressif** : Ajoutez des mots-clés dans `PRIORITY_KEYWORDS`

### Réduire les coûts API

- **Gemini** : Utilisez `gemini-2.0-flash-exp` (déjà configuré)
- **OpenAI Embeddings** : Utilisez `text-embedding-3-small` (déjà configuré)

### Monitoring avancé

Ajoutez des webhooks pour être notifié des pannes :

```javascript
// Dans whatsapp_monitor.js
client.on('disconnected', async (reason) => {
  await fetch('https://votre-webhook.com/alert', {
    method: 'POST',
    body: JSON.stringify({ alert: 'WhatsApp disconnected', reason })
  });
});
```

## 🎯 Roadmap

- [ ] Support Telegram/Signal
- [ ] Analyse d'images (OCR sur flyers/affiches)
- [ ] Détection de deepfakes
- [ ] Alertes en temps réel (SMS/Push)

---

**Support** : Pour toute question, consultez la documentation Supabase ou le code source.

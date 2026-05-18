# 🦅 Projet Œil de Lynx - Scripts Intelligence

## 📁 Structure

```
scripts/intelligence/
├── keywords.py           # Base de données de 300+ mots-clés stratégiques
├── sources.py            # URLs presse, comptes sociaux, hashtags
├── config.json           # Configuration JSON complète
├── rss_scraper.py        # Scraper RSS dédié (sources officielles)
├── web_scraper.py        # Scraper web/YouTube avec rotation intelligente
├── whatsapp_monitor.js   # Moniteur WhatsApp (nécessite session active)
└── README.md             # Ce fichier
```

## 🚀 Installation

### Python (Web & RSS Scrapers)
```bash
cd scripts/intelligence
pip install supabase duckduckgo-search youtube-search-python python-dotenv feedparser
```

### Node.js (WhatsApp Monitor)
```bash
cd scripts/intelligence
npm install whatsapp-web.js qrcode-terminal dotenv
```

## ⚙️ Configuration

Créez un fichier `.env` dans `scripts/intelligence/` :

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Utilisation

### 1. Web Scraper (Recommandé : Cron toutes les 6h)

```bash
python web_scraper.py
```

**Fonctionnement** :
- ✅ Sélectionne automatiquement 20 mots-clés du jour (incluant toujours les prioritaires)
- ✅ Génère 15 requêtes optimisées avec modificateurs contextuels
- ✅ Scrape Web (DuckDuckGo) et YouTube
- ✅ Filtre les résultats pour contexte gabonais
- ✅ Sauvegarde dans `intelligence_items` (Supabase)

**Sortie exemple** :
```
============================================================
🦅 LYNX EYE - WEB INTELLIGENCE SCRAPER
============================================================
⏰ Exécution: 2024-11-24 21:30:15

🎯 Sélection des mots-clés du jour...
   Keywords sélectionnés: 20
   Prioritaires: oligui, ctri, coup d'état, manifestation, grève...

🔧 Génération des requêtes de recherche...
   Requêtes générées: 15
   Exemples: oligui crise, seeg libreville, vie chère gabon...

🌐 Scraping Web pour 15 requêtes...
  [1/15] oligui crise: 3 résultats
  [2/15] seeg libreville: 3 résultats
  ...
✓ Web: 32 items collectés

📺 Scraping YouTube pour 5 requêtes...
  [1/5] oligui crise Gabon: 2 vidéos
  ...
✓ YouTube: 8 items collectés

💾 Enregistrement dans Supabase...
✅ 40/40 items sauvegardés avec succès

============================================================
✅ SCRAPING TERMINÉ
============================================================
```

### 2. RSS Feed Scraper (⭐ Recommandé : Sources Officielles)

```bash
python rss_scraper.py
```

**Fonctionnement** :
- ✅ Scrape **directement** les flux RSS des médias gabonais
- ✅ Plus rapide et fiable que DuckDuckGo
- ✅ Sources vérifiées : Gabon Review, Gabon Media Time, Jeune Afrique, RFI...
- ✅ Filtrage par mots-clés prioritaires
- ✅ Pas de rate limiting (sources directes)

**Sources couvertes** :
- **Presse Nationale** : L'Union, Gabon Review, Gabon Media Time, AGP, Infos241...
- **Presse Internationale** : Jeune Afrique, RFI, Africa Intelligence, Mondafrique
- **Économie** : Le Nouveau Gabon, Direct Infos Gabon

**Sortie exemple** :
```
============================================================
🦅 LYNX EYE - RSS FEED SCRAPER (Sources Officielles)
============================================================
⏰ Exécution: 2024-11-24 22:00:00

📰 Scraping des flux RSS...

  [NATIONAL]
    ✓ Gabon Review: 8 articles
    ✓ Gabon Media Time: 6 articles
    ✓ AGP Gabon: 4 articles
    ...

  [INTERNATIONAL]
    ✓ Jeune Afrique: 5 articles
    ✓ RFI: 3 articles
    ...

✓ RSS: 42 items collectés

💾 Enregistrement dans Supabase...
✅ 42/42 items sauvegardés avec succès

============================================================
✅ SCRAPING RSS TERMINÉ
============================================================
```

### 3. WhatsApp Monitor (Nécessite session active)

```bash
node whatsapp_monitor.js
```

**Première exécution** :
1. Scanner le QR code avec WhatsApp mobile
2. Le script se connecte et surveille les groupes
3. Filtre les messages selon mots-clés (argot gabonais inclus)
4. Hash les auteurs pour anonymat
5. Envoie à Supabase

**⚠️ IMPORTANT** :
- Utilisez un **numéro WhatsApp dédié** (risque de ban par WhatsApp)
- Carte SIM prépayée recommandée
- Ne pas utiliser votre numéro principal

### 3. Automatisation (Production)

#### Linux/Mac - Cron
```bash
crontab -e
```

Ajouter :
```cron
# Web Scraper toutes les 6h
0 */6 * * * cd /path/to/scripts/intelligence && /usr/bin/python3 web_scraper.py >> /var/log/lynx_eye_web.log 2>&1

# WhatsApp Monitor (daemon permanent)
@reboot cd /path/to/scripts/intelligence && /usr/bin/node whatsapp_monitor.js >> /var/log/lynx_eye_whatsapp.log 2>&1
```

#### Windows - Task Scheduler
1. Ouvrir "Planificateur de tâches"
2. Créer une tâche basique
3. Déclencheur : Répéter toutes les 6h
4. Action : Démarrer `python.exe web_scraper.py`

## 🎯 Système de Mots-Clés

### Architecture
```python
from keywords import (
    INTELLIGENCE_KEYWORDS,      # Liste complète (300+ termes)
    PRIORITY_KEYWORDS,          # Toujours inclus (14 termes critiques)
    get_daily_keywords,         # Sélection aléatoire + prioritaires
    generate_search_queries,    # Combinator intelligent
    get_whatsapp_filters        # Filtres spécifiques WhatsApp
)
```

### Rotation Intelligente
- **Prioritaires** (toujours scannés) : oligui, ctri, coup d'état, manifestation, grève, insécurité...
- **Rotation quotidienne** : Échantillon aléatoire de 20 mots-clés parmi les 300+
- **Combinaisons dynamiques** : Mots-clés + modificateurs (crise, scandale, urgent...) + villes

### Catégories Couvertes
1. **Politique** : CTRI, transition, élections, dialogue national
2. **Sécurité** : GR, police, microbes, kobolo, frontières
3. **Économie** : Pétrole (Perenco), manganèse (Comilog), dette, FMI
4. **Social** : SEEG, vie chère, routes, hôpitaux, bourses
5. **Infrastructures** : Belinga, Nkok, barrages, aéroport
6. **Diplomatie** : France, Chine, Russie, CEEAC
7. **Menaces** : Rumeurs, fake news, émeutes, diaspora activiste

## 📈 Monitoring

### Vérifier l'activité
```bash
# Logs Web Scraper
tail -f /var/log/lynx_eye_web.log

# Logs WhatsApp
tail -f /var/log/lynx_eye_whatsapp.log
```

### Dashboard Supabase
1. Allez sur votre projet Supabase
2. Table Editor → `intelligence_items`
3. Vérifiez les nouvelles entrées

### Dashboard Admin (Frontend)
- AdminSpace → Intelligence → Oeil de Lynx
- Voir le flux en temps réel
- Statistiques : Items capturés, Sources actives, Alertes 24h

## 🔧 Personnalisation

### Ajouter des mots-clés
Éditer `keywords.py` :
```python
INTELLIGENCE_KEYWORDS = [
    # ... existants
    "nouveau mot-clé",
    "autre terme important"
]
```

### Modifier la fréquence de rotation
Dans `web_scraper.py` :
```python
# Ligne 123 - Augmenter pour plus de keywords par exécution
daily_keywords = get_daily_keywords(count=30)  # Au lieu de 20

# Ligne 130 - Augmenter pour plus de requêtes
search_queries = generate_search_queries(daily_keywords, max_queries=25)  # Au lieu de 15
```

### Changer la sensibilité WhatsApp
Dans `whatsapp_monitor.js` :
```javascript
// Ligne 45 - Ajouter/supprimer keywords
const KEYWORDS = ['oligui', 'ctri', 'seeg', 'votre_keyword'];
```

## ⚠️ Sécurité & Conformité

### Légalité
- **Surveillance légitime** : Réservé aux autorités compétentes
- **OSINT public** : Sources ouvertes uniquement (pas de piratage)
- **RGPD/Données personnelles** : Hash des auteurs WhatsApp

### WhatsApp Terms of Service
- ⚠️ **Risque de ban** : WhatsApp interdit les bots non officiels
- ✅ **Mitigation** : Numéro dédié, SIM prépayée, usage modéré
- 🚫 **Ne jamais** : Spammer, envoyer des messages automatiques

### Quotas API
- **DuckDuckGo** : Pas de limite officielle mais rate limiting possible
- **YouTube** : Quotas gratuits limités (10,000 requêtes/jour)
- **Supabase** : Plan gratuit (50,000 rows, 500MB)

## 🐛 Troubleshooting

### Erreur : "keywords.py non trouvé"
```bash
# Vérifier que keywords.py est dans le même dossier
ls scripts/intelligence/keywords.py
```

### Erreur WhatsApp : "Session closed"
```bash
# Supprimer la session et reconnecter
rm -rf .wwebjs_auth
node whatsapp_monitor.js
```

### Erreur Supabase : "Table does not exist"
```bash
# Appliquer les migrations (depuis la racine du projet)
cd /Users/okatech/presidence.ga
supabase db push
```

### Pas de résultats collectés
- Vérifier votre connexion internet
- Les mots-clés sont peut-être trop spécifiques
- Essayer avec `--debug` (à implémenter si besoin)

## 📞 Support

Pour toute question technique :
1. Consulter `lynx_eye_setup.md` (instructions détaillées)
2. Vérifier les logs (`/var/log/lynx_eye_*.log`)
3. Contacter l'équipe dev du projet

---

**Généré pour : Projet Œil de Lynx - Présidence de la Transition**  
**Date : 24 Novembre 2024**

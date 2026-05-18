"""
RSS Feed Scraper for Lynx Eye
Scrape directement les flux RSS des médias gabonais
Plus rapide et plus fiable que DuckDuckGo pour les sources connues
"""

import os
import sys
import feedparser
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

try:
    from sources import get_all_rss_feeds, PRESS_URLS, get_all_hashtags_flat
    from keywords import PRIORITY_KEYWORDS
except ImportError:
    print("⚠️  Modules sources.py ou keywords.py non trouvés")
    sys.exit(1)

load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erreur: Variables SUPABASE requises dans .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_rss_feed(feed_url, source_name):
    """Scrape un flux RSS spécifique"""
    results = []
    
    try:
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries[:10]:  # Limiter aux 10 derniers articles
            # Filtrer par mots-clés prioritaires
            content = f"{entry.get('title', '')} {entry.get('summary', '')}".lower()
            
            # Vérifier si au moins un mot-clé prioritaire est présent
            if any(kw.lower() in content for kw in PRIORITY_KEYWORDS):
                results.append({
                    'content': f"{entry.get('title', '')} - {entry.get('summary', '')}",
                    'author': source_name,
                    'external_id': entry.get('link', entry.get('id', '')),
                    'published_at': entry.get('published', datetime.now().isoformat())
                })
        
        return results
        
    except Exception as e:
        print(f"  ✗ Erreur RSS pour {source_name}: {e}")
        return []

def scrape_all_rss_feeds():
    """Scrape tous les flux RSS configurés"""
    all_results = []
    
    print("📰 Scraping des flux RSS...")
    
    for category, sources in PRESS_URLS.items():
        print(f"\n  [{category.upper()}]")
        
        for source_name, feed_url in sources.items():
            if '/feed/' in feed_url or '/rss' in feed_url:
                results = scrape_rss_feed(feed_url, f"{source_name} ({category})")
                all_results.extend(results)
                print(f"    ✓ {source_name}: {len(results)} articles")
    
    return all_results

def save_to_supabase(items):
    """Save items to Supabase intelligence_items table"""
    saved_count = 0
    
    for item in items:
        try:
            supabase.table('intelligence_items').upsert(item, on_conflict='external_id').execute()
            saved_count += 1
        except Exception as e:
            print(f"  ✗ Erreur sauvegarde: {e}")
    
    return saved_count

def main():
    print("=" * 70)
    print("🦅 LYNX EYE - RSS FEED SCRAPER (Sources Officielles)")
    print("=" * 70)
    print(f"⏰ Exécution: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Scraping RSS
    rss_results = scrape_all_rss_feeds()
    print(f"\n✓ RSS: {len(rss_results)} items collectés")
    print()
    
    # Sauvegarde
    if rss_results:
        print(f"💾 Enregistrement dans Supabase...")
        saved = save_to_supabase(rss_results)
        print(f"✅ {saved}/{len(rss_results)} items sauvegardés avec succès")
    else:
        print("⚠️  Aucun résultat à sauvegarder")
    
    print()
    print("=" * 70)
    print("✅ SCRAPING RSS TERMINÉ")
    print("=" * 70)

if __name__ == '__main__':
    main()

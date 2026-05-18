"""
Web Intelligence Scraper (Project Lynx Eye)

Ce script Python est destiné à tourner périodiquement (ex: cron job toutes les 6h).
Il scrape le web et YouTube pour des mots-clés spécifiques et envoie les résultats à Supabase.

Installation:
pip install supabase duckduckgo-search youtube-search-python python-dotenv
"""

import os
import sys
import random
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
from duckduckgo_search import DDGS
from youtubesearchpython import VideosSearch

# Importer le module keywords
try:
    from keywords import get_daily_keywords, generate_search_queries, PRIORITY_KEYWORDS
except ImportError:
    print("⚠️  keywords.py non trouvé, utilisation de mots-clés de base")
    PRIORITY_KEYWORDS = ["gabon", "oligui", "libreville"]
    get_daily_keywords = lambda count: PRIORITY_KEYWORDS
    generate_search_queries = lambda kw, max_q: kw

load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erreur: Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises dans .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_web_news(queries, max_results_per_query=3):
    """Scrape web news using DuckDuckGo avec rotation intelligente"""
    results = []
    
    print(f"🌐 Scraping Web pour {len(queries)} requêtes...")
    
    for i, query in enumerate(queries, 1):
        try:
            with DDGS() as ddgs:
                search_results = list(ddgs.text(query, max_results=max_results_per_query))
                
                for result in search_results:
                    # Filtrer les résultats hors contexte gabonais
                    if 'gabon' in result.get('body', '').lower() or 'gabon' in result.get('title', '').lower():
                        results.append({
                            'content': f"{result.get('title', '')} - {result.get('body', '')}",
                            'author': result.get('link', 'Unknown'),
                            'external_id': result.get('link', ''),
                            'published_at': datetime.now().isoformat()
                        })
                
            print(f"  [{i}/{len(queries)}] {query}: {len(search_results)} résultats")
                
        except Exception as e:
            print(f"  ✗ Erreur pour '{query}': {e}")
    
    return results

def scrape_youtube(queries, max_results_per_query=2):
    """Scrape YouTube videos avec filtre Gabon"""
    results = []
    
    print(f"📺 Scraping YouTube pour {len(queries)} requêtes...")
    
    for i, query in enumerate(queries, 1):
        try:
            # Ajouter "Gabon" si pas déjà présent
            search_query = query if 'gabon' in query.lower() else f"{query} Gabon"
            
            videos_search = VideosSearch(search_query, limit=max_results_per_query)
            search_results = videos_search.result()
            
            for video in search_results.get('result', []):
                results.append({
                    'content': f"{video.get('title', '')} - {video.get('descriptionSnippet', [{}])[0].get('text', '')}",
                    'author': video.get('channel', {}).get('name', 'Unknown'),
                    'external_id': video.get('id', ''),
                    'published_at': datetime.now().isoformat()
                })
            
            print(f"  [{i}/{len(queries)}] {search_query}: {len(search_results.get('result', []))} vidéos")
                
        except Exception as e:
            print(f"  ✗ Erreur pour '{query}': {e}")
    
    return results

def save_to_supabase(items):
    """Save items to Supabase intelligence_items table"""
    saved_count = 0
    
    for item in items:
        try:
            # Upsert (insert or update if external_id exists)
            supabase.table('intelligence_items').upsert(item, on_conflict='external_id').execute()
            saved_count += 1
        except Exception as e:
            print(f"  ✗ Erreur sauvegarde: {e}")
    
    return saved_count

def main():
    print("=" * 60)
    print("🦅 LYNX EYE - WEB INTELLIGENCE SCRAPER")
    print("=" * 60)
    print(f"⏰ Exécution: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Sélection intelligente des mots-clés
    print("🎯 Sélection des mots-clés du jour...")
    daily_keywords = get_daily_keywords(count=20)
    print(f"   Keywords sélectionnés: {len(daily_keywords)}")
    print(f"   Prioritaires: {', '.join(PRIORITY_KEYWORDS[:5])}...")
    print()
    
    # Génération des requêtes optimisées
    print("🔧 Génération des requêtes de recherche...")
    search_queries = generate_search_queries(daily_keywords, max_queries=15)
    print(f"   Requêtes générées: {len(search_queries)}")
    print(f"   Exemples: {', '.join(search_queries[:3])}...")
    print()
    
    # Scraping Web
    web_results = scrape_web_news(search_queries, max_results_per_query=3)
    print(f"✓ Web: {len(web_results)} items collectés")
    print()
    
    # Scraping YouTube
    youtube_queries = random.sample(search_queries, min(5, len(search_queries)))
    youtube_results = scrape_youtube(youtube_queries, max_results_per_query=2)
    print(f"✓ YouTube: {len(youtube_results)} items collectés")
    print()
    
    # Sauvegarde dans Supabase
    all_results = web_results + youtube_results
    
    if all_results:
        print(f"💾 Enregistrement dans Supabase...")
        saved = save_to_supabase(all_results)
        print(f"✅ {saved}/{len(all_results)} items sauvegardés avec succès")
    else:
        print("⚠️  Aucun résultat à sauvegarder")
    
    print()
    print("=" * 60)
    print("✅ SCRAPING TERMINÉ")
    print("=" * 60)

if __name__ == '__main__':
    main()

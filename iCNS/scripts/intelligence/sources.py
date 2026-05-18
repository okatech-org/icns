"""
Lynx Eye Sources Database
Sources officielles et médias pour la veille stratégique
"""

# URLs de presse en ligne (flux RSS et sites directs)
PRESS_URLS = {
    # Presse Nationale
    "national": {
        "L'Union": "https://www.lunion-archives.org/",
        "Gabon Review": "https://www.gabonreview.com/feed/",
        "Gabon Media Time": "https://www.gabonmediatime.com/feed/",
        "Gabon Actu": "https://www.gabonactu.com/feed/",
        "Top Infos Gabon": "https://www.topinfosgabon.com/",
        "AGP Gabon": "https://www.agpgabon.ga/",
        "Infos241": "https://infos241.com/"
    },
    
    # Presse Internationale
    "international": {
        "Jeune Afrique": "https://www.jeuneafrique.com/pays/gabon/feed/",
        "Africa Intelligence": "https://www.africaintelligence.fr/afrique-centrale",
        "RFI": "https://www.rfi.fr/fr/tag/gabon/",
        "Mondafrique": "https://mondafrique.com/"
    },
    
    # Finance & Économie
    "economie": {
        "Le Nouveau Gabon": "https://www.lenouveaugabon.com/rss",
        "Direct Infos Gabon": "https://directinfosgabon.com/"
    }
}

# Comptes sociaux officiels (Twitter/X, Facebook, Instagram)
SOCIAL_HANDLES = {
    # Institutions
    "institutions": [
        "PresidenceGabon",
        "GouvGabon",
        "CTRI_Officiel",
        "AssembleeNationaleGA",
        "MinistereEconomieGabon",
        "MinisterePetrole"
    ],
    
    # Personnalités Politiques
    "personnalites": [
        "OliguiNguema",
        "RaymondNdongSima",
        "MaysMouissi",
        "LaurenceNdong"
    ],
    
    # Influenceurs & Activistes
    "activistes": [
        "HerveMomboKinga",
        "TelesphoreObame",
        "UrielAbaga"
    ]
}

# Groupes Facebook à surveiller
FACEBOOK_GROUPS = [
    "Le Gabon d'abord",
    "Infos Kinguélé",
    "Tamtam Gabon",
    "GABON POLITIQUE RÉALITÉ"
]

# Hashtags stratégiques
HASHTAGS = {
    "incontournables": [
        "#Gabon", "#Libreville", "#LBV", "#Team241", "#Gabon241"
    ],
    
    "politique": [
        "#CTRI", "#TransitionGabon", "#Oligui", "#CoupDeLiberation",
        "#DialogueNational", "#ReferendumGabon", "#ConstitutionGabon"
    ],
    
    "social": [
        "#VieChere", "#Chomage", "#Délestage", "#Route", "#Grève",
        "#Bourses", "#Mapane", "#JusticePour"
    ],
    
    "economie": [
        "#PetrolGabon", "#Manganese", "#ZoneNkok", "#InvestGabon"
    ]
}

# Configuration complète pour export JSON
MONITORING_CONFIG = {
    "target_urls": [
        "https://www.gabonreview.com/feed/",
        "https://www.gabonmediatime.com/feed/",
        "https://www.gabonactu.com/feed/",
        "https://www.lenouveaugabon.com/rss",
        "https://www.jeuneafrique.com/pays/gabon/feed/",
        "https://www.rfi.fr/fr/tag/gabon/",
        "https://www.agpgabon.ga/",
        "https://infos241.com/"
    ],
    
    "social_handles": [
        "PresidenceGabon",
        "OliguiNguema",
        "GouvGabon",
        "CTRI_Officiel",
        "RaymondNdongSima",
        "MaysMouissi"
    ],
    
    "keywords_strict": [
        "Gabon", "Oligui", "CTRI", "Libreville", "Port-Gentil",
        "Franceville", "Transition", "Présidence"
    ],
    
    "keywords_contextual": [
        "Coup d'état", "Grève", "Pénurie", "Délestage", "Émeute",
        "Arrestation", "Décret", "Perenco", "Eramet", "Assoukrè",
        "Belinga", "SEEG", "Comilog", "Manifestation", "Opposition"
    ],
    
    "hashtags": [
        "#Gabon", "#Team241", "#CTRI", "#VieChere", "#Délestage",
        "#TransitionGabon", "#Oligui", "#Libreville"
    ]
}

def get_all_rss_feeds():
    """Retourne toutes les URLs RSS pour scraping direct"""
    feeds = []
    for category, sources in PRESS_URLS.items():
        for name, url in sources.items():
            if '/feed/' in url or '/rss' in url:
                feeds.append(url)
    return feeds

def get_all_hashtags_flat():
    """Retourne tous les hashtags sous forme de liste plate"""
    all_hashtags = []
    for category, tags in HASHTAGS.items():
        all_hashtags.extend(tags)
    return all_hashtags

def get_social_search_queries():
    """Génère des requêtes de recherche pour les comptes sociaux"""
    queries = []
    for category, handles in SOCIAL_HANDLES.items():
        for handle in handles:
            queries.append(f"@{handle} Gabon")
            queries.append(f"{handle} news")
    return queries

# Export pour intégration facile
if __name__ == "__main__":
    import json
    print("=== LYNX EYE SOURCES DATABASE ===")
    print(f"\n📰 Flux RSS: {len(get_all_rss_feeds())} sources")
    print(f"👥 Comptes sociaux: {sum(len(v) for v in SOCIAL_HANDLES.values())} handles")
    print(f"#️⃣ Hashtags: {len(get_all_hashtags_flat())} tags")
    print(f"\n📋 Configuration JSON exportée:")
    print(json.dumps(MONITORING_CONFIG, indent=2, ensure_ascii=False))

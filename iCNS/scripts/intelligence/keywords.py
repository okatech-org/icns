"""
Lynx Eye Keywords Database
Base de données de mots-clés pour la veille stratégique
"""

# Mots-clés principaux (300+ termes)
INTELLIGENCE_KEYWORDS = [
    # POLITIQUE & TRANSITION
    "ctri", "comité de transition", "présidence de la transition",
    "président oligui", "brice oligui nguema", "général oligui", "oligui",
    "conseil des ministres", "assemblée nationale de transition",
    "gouvernement de transition", "dialogue national inclusif", "dni",
    "référendum constitutionnel", "nouvelle constitution", "élections 2025",
    "code électoral", "commission électorale", "ali bongo", "famille bongo",
    "pdg", "parti démocratique gabonais", "opposition gabonaise",
    "alternance démocratique", "alexandre barro chambrier", "raymond ndong sima",
    "coup d'état", "putsch", "30 août 2023", "libération",
    "restauration des institutions", "retour à l'ordre constitutionnel",
    "le boss", "le patron", "le vieux", "mapane", "mbeng",
    
    # SÉCURITÉ & DÉFENSE
    "gendarmerie nationale", "police nationale", "garde républicaine",
    "gr", "forces armées gabonaises", "fag", "état-major",
    "microbes", "braquage", "cambriolage", "vol à main armée",
    "criminalité", "insécurité", "bavure policière", "banditisme",
    "kobolo", "cannabis", "weed", "yamba", "cocaïne", "trafic de drogue",
    "narcotrafic", "dealer", "coupeur de route",
    "frontière cameroun", "frontière guinée équatoriale", "kyé-ossi",
    "bitam", "mitzic", "bata", "immigration clandestine", "réfugiés",
    "boko haram", "menace terroriste", "golfe de guinée",
    "piraterie maritime", "otages", "les képis", "les gars de la gr",
    
    # ÉCONOMIE & INDUSTRIES
    "perenco", "maurel & prom", "total gabon", "vaalco", "assala energy",
    "production pétrolière", "gisement", "offshore", "port-gentil",
    "rabi", "gamba", "manganèse", "comilog", "eramet", "moanda",
    "franceville", "belinga", "fer", "or", "minerai",
    "exploitation forestière", "bois précieux", "okoumé", "déforestation",
    "olam", "rougier", "port d'owendo", "oprag", "terminal pétrolier",
    "dette publique", "fmi", "banque mondiale", "budget de l'état",
    "bgfibank", "franc cfa", "beac", "salaires des fonctionnaires",
    "arriérés de salaires", "cnss", "chômage des jeunes",
    "zone économique spéciale nkok", "gsez", "ngori", "mabé",
    
    # SOCIAL & BAROMÈTRE
    "vie chère", "cherté de la vie", "pouvoir d'achat",
    "prix des denrées", "essence", "gasoil", "pain", "riz",
    "seeg", "coupure électricité", "délestage", "coupure d'eau",
    "pénurie d'eau", "état des routes", "nids de poule",
    "transgabonaise", "setrag", "hôpital de libreville",
    "chu angondjé", "pénurie de médicaments", "amo", "cnamgs",
    "bourses étudiants", "université omar bongo", "grève des enseignants",
    "crise du logement", "ordures ménagères",
    "c'est dur au gabon", "on souffre", "le pays est bloqué",
    "wé on fait comment", "ça chauffe", "la route est gâtée",
    
    # INFRASTRUCTURES & PROJETS
    "belinga exploitation", "transgabonais santa clara",
    "barrage de grand poubara", "barrage de kinguélé",
    "aéroport international léon mba", "air gabon",
    "libreville", "oyem", "tchibanga", "mouila", "lambaréné",
    
    # DIPLOMATIE & INTERNATIONAL
    "coopération franco-gabonaise", "bases militaires françaises",
    "ambassade de france", "total", "bolloré", "ceeac", "cemac",
    "union africaine", "commonwealth britannique",
    "chine au gabon", "russie", "wagner", "chantiers chinois",
    "ambassade américaine", "greenpeace", "wwf", "brainforest",
    
    # MENACES & CRISES
    "manifestation", "émeute", "protestation", "barrage routier",
    "grève générale", "mouvement social", "fake news gabon",
    "rumeur coup d'état", "complot", "diaspora gabonaise",
    "exilés politiques", "activistes facebook", "youtube gabon",
    "inondation libreville", "glissement de terrain", "incendie",
    
    # GÉNÉRIQUE CONTEXTUEL
    "gabon", "gabon actualités", "gabon news", "gabon politique",
    "gabon économie", "libreville news", "port-gentil actualités"
]

# Mots-clés prioritaires (surveillance critique)
PRIORITY_KEYWORDS = [
    "oligui", "ctri", "coup d'état", "manifestation", "grève",
    "insécurité", "braquage", "seeg", "coupure", "vie chère",
    "rumeur", "complot", "émeute", "protestation"
]

# Modificateurs pour combinaisons dynamiques
MODIFIERS = [
    "crise", "problème", "scandale", "grève", "manifestation",
    "corruption", "enquête", "arrestation", "urgent", "alerte",
    "nouveau", "annonce", "décision", "danger", "menace"
]

# Villes gabonaises pour géolocalisation
CITIES = [
    "libreville", "port-gentil", "franceville", "oyem",
    "moanda", "tchibanga", "mouila", "lambaréné", "bitam"
]

def get_daily_keywords(count=30):
    """
    Retourne un échantillon aléatoire de mots-clés pour la journée
    Inclut toujours les mots-clés prioritaires
    """
    import random
    
    # Toujours inclure les prioritaires
    daily = PRIORITY_KEYWORDS.copy()
    
    # Compléter avec des mots-clés aléatoires
    remaining = [kw for kw in INTELLIGENCE_KEYWORDS if kw not in PRIORITY_KEYWORDS]
    daily.extend(random.sample(remaining, min(count, len(remaining))))
    
    return daily

def generate_search_queries(base_keywords, max_queries=50):
    """
    Génère des requêtes de recherche en combinant keywords + modificateurs + villes
    """
    import random
    queries = []
    
    for keyword in base_keywords:
        # Requête simple
        queries.append(keyword)
        
        # Avec modificateur
        if len(queries) < max_queries:
            modifier = random.choice(MODIFIERS)
            queries.append(f"{keyword} {modifier}")
        
        # Avec ville
        if len(queries) < max_queries:
            city = random.choice(CITIES)
            queries.append(f"{keyword} {city}")
        
        if len(queries) >= max_queries:
            break
    
    return queries

def get_whatsapp_filters():
    """
    Retourne les mots-clés spécifiques pour filtrage WhatsApp
    (Focus sur argot et termes terrain)
    """
    whatsapp_specific = [
        "mapane", "ngori", "wé", "ça chauffe", "on souffre",
        "le pays est bloqué", "kobolo", "microbes", "les képis",
        "vie chère", "coupure", "seeg", "grève", "manifestation",
        "oligui", "ctri", "bongo", "insécurité", "braquage"
    ]
    return whatsapp_specific

#!/bin/bash
#
# Script de configuration .env pour Intelligence Scripts
# Ce script vous guide pour créer le fichier .env avec les bonnes credentials
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "============================================"
echo "🦅 LYNX EYE - Configuration .env"
echo "============================================"
echo ""

# Vérifier si .env existe déjà
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Le fichier .env existe déjà"
    read -p "Voulez-vous le remplacer? (o/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "❌ Configuration annulée"
        exit 0
    fi
fi

echo "📋 Pour récupérer votre clé Supabase service_role :"
echo ""
echo "1. Ouvrez votre navigateur"
echo "2. Allez sur: https://app.supabase.com/project/sfsoqoeunivgorrgioap/settings/api"
echo "3. Connectez-vous si nécessaire"
echo "4. Dans la section 'Project API keys'"
echo "5. Cliquez sur 'Révéler' à côté de 'service_role'"
echo "6. Copiez la clé complète (commence par 'eyJhbGci...')"
echo ""
read -p "Appuyez sur Entrée quand vous avez la clé prête..."
echo ""

# Demander la clé
echo "🔑 Collez votre clé service_role :"
read -r SERVICE_ROLE_KEY

# Valider que la clé commence par eyJ (JWT)
if [[ ! $SERVICE_ROLE_KEY =~ ^eyJ ]]; then
    echo "❌ Erreur: La clé ne semble pas être au bon format (doit commencer par 'eyJ')"
    echo "   Vous avez peut-être copié la mauvaise clé (anon au lieu de service_role)"
    exit 1
fi

# Créer le fichier .env
cat > "$ENV_FILE" << EOF
# Supabase Configuration pour Intelligence Scripts
# Généré automatiquement le $(date)

SUPABASE_URL=https://sfsoqoeunivgorrgioap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF

echo ""
echo "✅ Fichier .env créé avec succès!"
echo "📁 Emplacement: $ENV_FILE"
echo ""

# Tester la connexion
echo "🧪 Test de connexion à Supabase..."
python3 - <<PYTHON_TEST
import os
from dotenv import load_dotenv

# Charger .env
load_dotenv('$ENV_FILE')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if url and key:
    print(f"✓ URL: {url}")
    print(f"✓ Clé: {key[:20]}...{key[-10:]} ({len(key)} caractères)")
    print("")
    print("✅ Configuration valide!")
else:
    print("❌ Erreur: Variables manquantes")
    exit(1)
PYTHON_TEST

if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "   1. Testez le scraper: python3 rss_scraper.py"
    echo "   2. Installez les cron jobs: ./setup_cron.sh"
    echo ""
    echo "⚠️  IMPORTANT: Ne commitez JAMAIS ce .env sur Git!"
    echo "   (Il est déjà dans .gitignore)"
else
    echo ""
    echo "❌ Problème de configuration détecté"
    echo "   Vérifiez votre clé Supabase"
fi

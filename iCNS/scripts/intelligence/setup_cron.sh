#!/bin/bash
#
# Lynx Eye - Script d'automatisation pour production
# Ce script configure les cron jobs pour le scraping automatique
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=================================="
echo "🦅 LYNX EYE - Configuration Cron"
echo "=================================="
echo ""

# Vérifier que les scripts existent
if [ ! -f "$SCRIPT_DIR/rss_scraper.py" ]; then
    echo "❌ Erreur: rss_scraper.py non trouvé"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/web_scraper.py" ]; then
    echo "❌ Erreur: web_scraper.py non trouvé"
    exit 1
fi

# Vérifier que .env existe
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "⚠️  Attention: fichier .env non trouvé"
    echo "   Créez d'abord le fichier .env avec vos credentials Supabase"
    exit 1
fi

echo "✅ Scripts trouvés"
echo "📁 Répertoire: $SCRIPT_DIR"
echo ""

# Créer le fichier crontab
CRON_FILE="/tmp/lynx_eye_cron.txt"

cat > $CRON_FILE << EOF
# Lynx Eye - Intelligence Scraping
# Généré automatiquement le $(date)

# RSS Scraper - Toutes les 3 heures (sources officielles - prioritaire)
0 */3 * * * cd $SCRIPT_DIR && /usr/bin/python3 rss_scraper.py >> /tmp/lynx_eye_rss.log 2>&1

# Web Scraper - Toutes les 12 heures (complémentaire)
0 */12 * * * cd $SCRIPT_DIR && /usr/bin/python3 web_scraper.py >> /tmp/lynx_eye_web.log 2>&1

# Nettoyage des logs (tous les lundis à 2h du matin)
0 2 * * 1 find /tmp -name "lynx_eye_*.log" -mtime +7 -delete

EOF

echo "📋 Configuration cron générée:"
echo "---"
cat $CRON_FILE
echo "---"
echo ""

# Demander confirmation
read -p "⚠️  Voulez-vous installer ces cron jobs? (o/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    # Sauvegarder le crontab actuel
    crontab -l > /tmp/lynx_eye_cron_backup.txt 2>/dev/null || true
    
    # Ajouter les nouveaux jobs
    (crontab -l 2>/dev/null; cat $CRON_FILE) | crontab -
    
    echo "✅ Cron jobs installés avec succès!"
    echo ""
    echo "📊 Logs disponibles dans:"
    echo "   - /tmp/lynx_eye_rss.log"
    echo "   - /tmp/lynx_eye_web.log"
    echo ""
    echo "🔍 Vérifier les cron jobs:"
    echo "   crontab -l | grep lynx"
    echo ""
    echo "🗑️  Supprimer les cron jobs:"
    echo "   crontab -e  # puis supprimer les lignes Lynx Eye"
else
    echo "❌ Installation annulée"
    echo ""
    echo "💡 Pour installer manuellement:"
    echo "   crontab -e"
    echo "   # Puis copiez le contenu de $CRON_FILE"
fi

# Cleanup
rm -f $CRON_FILE

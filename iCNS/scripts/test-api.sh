#!/usr/bin/env bash
set -euo pipefail

# Charger les variables depuis .env.local si présent
if [ -f ".env.local" ]; then
  # Exporter uniquement les lignes au format KEY=VALUE sans espaces
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.local | xargs) || true
fi

BASE_URL="${VITE_SUPABASE_URL:-https://sfsoqoeunivgorrgioap.supabase.co}"
ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"

if [ -z "$ANON_KEY" ]; then
  echo "Erreur: VITE_SUPABASE_PUBLISHABLE_KEY manquant. Définissez-le dans .env.local."
  exit 1
fi

echo "Test 1: GET list-voices"
curl -sS -X GET \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  "$BASE_URL/functions/v1/list-voices" | sed -e 's/.*/[list-voices] &/'

echo ""
echo "Test 2: POST log-analytics (ping)"
curl -sS -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event\":\"ping\",\"source\":\"test-api.sh\"}' \
  "$BASE_URL/functions/v1/log-analytics" | sed -e 's/.*/[log-analytics] &/'

echo ""
echo "OK: tests terminés."



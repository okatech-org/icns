-- ============================================
-- Configuration du Cron Job pour Lynx Eye
-- ============================================
-- Ce script configure un job automatique qui exécute la collecte
-- d'intelligence selon la fréquence définie dans la configuration.
--
-- IMPORTANT: Remplacez les variables suivantes avant d'exécuter:
-- - YOUR_PROJECT_URL: URL de votre projet Supabase (ex: https://xxxxx.supabase.co)
-- - YOUR_ANON_KEY: Votre clé anon Supabase
--
-- Pour obtenir ces valeurs:
-- 1. Allez dans Settings > API de votre projet Supabase
-- 2. Copiez l'URL du projet et la clé anon
--

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer le job cron qui s'exécute toutes les heures
-- Le job vérifie la configuration et lance la collecte si nécessaire
SELECT cron.schedule(
    'intelligence-scraping-check',
    '0 * * * *',  -- Toutes les heures (à l'heure pile)
    $$
    SELECT
      net.http_post(
          url:='YOUR_PROJECT_URL/functions/v1/trigger-intelligence-scraping',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);

-- Pour voir le statut du cron job:
-- SELECT * FROM cron.job WHERE jobname = 'intelligence-scraping-check';

-- Pour supprimer le cron job:
-- SELECT cron.unschedule('intelligence-scraping-check');

-- Pour voir l'historique des exécutions:
-- SELECT * FROM cron.job_run_details WHERE jobid = (
--   SELECT jobid FROM cron.job WHERE jobname = 'intelligence-scraping-check'
-- ) ORDER BY start_time DESC LIMIT 10;

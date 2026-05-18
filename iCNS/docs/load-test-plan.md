# Plan de tests de charge — iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §3.5 (ET-05), §5.2 (EQ-02.3) — Prompt 6.1
**Échéance** : M15 (préalable audit externe)
**Outil recommandé** : [k6](https://k6.io) (open-source, déployable on-prem, scripts JS — souverain-compatible)

## 1. Objectifs

| Indicateur | Cible |
|---|---|
| Temps de réponse consultation | < 2 s (ET-05.1) |
| Temps de transmission dossier | < 5 s (ET-05.2) |
| Délai escalade Flash | < 1 min (ET-05.3) |
| Capacité simultanée | 500 utilisateurs actifs (ET-05.4) |
| Taux d'erreur | < 0,1 % |
| Stockage | 50 To → 500 To extensibles (ET-05.5) |

## 2. Scénarios à scripter (k6)

### S1 — Authentification massive
- 500 utilisateurs s'authentifient en 60 secondes (rampe 8/s).
- Mesure : temps médian et p95 de `authenticate`.
- Critère : p95 < 1,5 s.

### S2 — Création de dossiers en charge
- 100 officiers traitants créent 10 dossiers chacun (1000 dossiers, distribués sur 2 minutes).
- Vérification : aucune collision sur la séquence de référence (Convex OCC).
- Critère : p95 < 3 s par création.

### S3 — Cycle de vie complet
- 200 dossiers parcourus jusqu'à transmission (soumettre × 2 + signer + transmettre), 100 dossiers/heure.
- Vérification : copies_classifiees créées atomiquement, journal d'audit cohérent.

### S4 — iCom Flash + escalade
- 100 communications Flash émises sans accusé.
- Critère : escalade détectée par le cron en < 5 min (et < 1 h au sens contractuel).

### S5 — Croisement CNS
- Base remplie avec 100 000 dossiers + 1 M tags.
- Mesure : `searchDossiers` avec 3 critères MUST < 2 s en p95.

### S6 — Vérification chaîne d'audit
- 1 M entrées dans `journal_audit`.
- `verifyAuditChain(maxEntries=1_000_000)` doit s'exécuter en < 5 min.
- Plan paginé documenté (cf. TODO `convex/audit_verify.ts`) à exécuter si > 1 M.

### S7 — iDocument upload/download
- 50 uploads simultanés de 100 Mo chacun.
- Critère : upload p95 < 30 s sur réseau interne (NB : iDocument prompt 3.1).

### S8 — Bascule PCO
- Coupure du site primaire pendant un run de charge S1+S2+S3.
- Vérification : RTO < 4 h, RPO < 15 min (ET-06.4, ET-06.5).

## 3. Durée totale

- Exécution continue **72 h** (cf. CDC §6.1 EL-01.1 et Prompt 6.1).
- Capture des métriques toutes les 10 s.
- Dashboards Grafana (souverain) ou équivalent on-prem.

## 4. Critères de Go/No-Go

Go (mise en service intégrale) si :
- Tous les critères de §1 respectés ;
- 0 erreur fonctionnelle bloquante (P0) ;
- ≤ 3 erreurs majeures (P1) documentées avec workaround ;
- Bascule PCO réussie.

Sinon : plan de remédiation + nouveau passage de tests.

## 5. Livrables (M15)

- `tests/load/scenarios/*.js` — scripts k6
- `tests/load/datasets/` — jeux de données fictives certifiées (générés par script)
- `docs/load-test-report.md` — rapport final
- `docs/production-sizing.md` — dimensionnement validé (CPU, RAM, IO, réseau)

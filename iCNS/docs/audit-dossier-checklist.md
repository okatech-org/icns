# Checklist du dossier d'audit externe — iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §4.3 (ES-03), §5.2 (EQ-02.4) — Prompt 6.2
**Échéance** : remise 1 mois avant démarrage de l'audit (M14)
**Cabinet** : certifié indépendant de NTSAGUI (sélection par le RSSI)

## 1. Documents à fournir au cabinet d'audit

### 1.1. Documentation contractuelle et fonctionnelle
- [ ] Cahier des Charges iCNS (NTSAGUI/CNS/CDC/2026/001) — version signée
- [ ] Spécification Fonctionnelle iCNS v1.0
- [ ] Plan de Développement v2.0
- [ ] Prompts d'Implémentation
- [ ] PV de mise en service du pilote opérationnel (M12)

### 1.2. Documentation technique
- [ ] DAT — Dossier d'Architecture Technique (livré M2)
- [ ] DSI — Dossier de Sécurité Initial (livré M2)
- [ ] Documentation des modules iCNS, iDocument, iCom, iArchive
- [ ] OpenAPI iDocument (`docs/idocument-api.yaml`)
- [ ] OpenAPI API présidentielle (`docs/api-presidentielle-openapi.yaml`)
- [ ] Schéma Convex annoté (`docs/schema-relations.md`)
- [ ] State machine dossier (`docs/dossier-state-machine.md`)
- [ ] Modèle de menace journal d'audit (`docs/audit-threat-model.md`)
- [ ] Gestion des clés (`docs/key-management.md`)
- [ ] Topologie infra (PCO primaire / repli, segmentation réseau, HSM)
- [ ] Procédures de déploiement et rollback (`docs/cutover-plan.md`)

### 1.3. Code source
- [ ] Accès lecture seule à un snapshot du dépôt iCNS au commit de production
- [ ] Modules prioritaires à auditer :
  - `convex/auth/**` (Prompt 2.1)
  - `convex/crypto/**` (Prompt 2.2)
  - `convex/audit.ts` + `convex/audit_verify.ts` (Prompt 1.2)
  - `convex/http.ts` + `convex/api_presidentielle/**` (Prompt 5.2)
  - `convex/dossiers/transmit.ts` (atomicité — Prompt 3.2)
- [ ] Sous embargo de confidentialité : NDA signé par le cabinet

### 1.4. Tests internes
- [ ] Rapport de tests de charge (`docs/load-test-report.md`, M15)
- [ ] Couverture des tests unitaires (≥ 80 % cible — EQ-02.1)
- [ ] Rapports de tests d'intégration de chaque module
- [ ] Procès-verbaux des tests UAT avec les services pilotes

### 1.5. Journaux et données
- [ ] Échantillon anonymisé du journal d'audit (1000 entrées)
- [ ] Logs d'exploitation des 30 derniers jours (système, applicatif, HSM)
- [ ] Exports out-of-band de la chaîne d'audit (sceaux RSSI)

### 1.6. Procédures opérationnelles
- [ ] Procédure de gestion des habilitations (octroi, revue, révocation)
- [ ] Procédure d'enrôlement / révocation des cartes agents
- [ ] Procédure de rotation des clés HSM (§5 de `key-management.md`)
- [ ] Procédure PCO / PRA (Plan Continuité Opérationnelle / Reprise)
- [ ] Procédure de réponse à incident (cf. modèle de menace audit §6)
- [ ] Procédure de déclassification (workflow `iarchive_declassification_requests`)

## 2. Périmètre de l'audit

### 2.1. Revue de code
Cabinet audite a minima les modules ci-dessus, avec focus sur :
- Validation des entrées (input validation)
- Authentification et autorisation (OWASP A01, A07)
- Cryptographie (OWASP A02 — choix d'algorithmes, gestion IV, AAD, KEK/DEK)
- Injections (NoSQL, command, SSRF)
- Erreurs et logging (pas de fuite d'info sensible)
- Dépendances et SCA (Composition Analysis)

### 2.2. Tests d'intrusion
- Externe (depuis Internet — surface API présidentielle uniquement)
- Interne (depuis le réseau opérationnel des services)
- Postes durcis (tentatives de contournement EDR, USB, biométrie)
- Social engineering (selon mandat — pas systématique)

### 2.3. Audit organisationnel
- Vérification des habilitations Secret Défense du personnel NTSAGUI (ES-01)
- Contrôle d'accès aux locaux NTSAGUI dédiés (ES-02)
- Sas de sortie de code (ES-02.4)
- Procédures de revue de code à 4 yeux (EQ-01.2)

## 3. Présence pendant l'audit

- Un référent NTSAGUI **désigné nominativement** est présent en permanence pendant les phases on-site (cf. ES-03.4 et Prompt 6.2).
- Le RSSI est informé en temps réel de toute découverte critique.

## 4. Matrice de remédiation des findings

| Sévérité | Délai de remédiation |
|---|---|
| **Critique** | Avant mise en service intégrale (M18) — bloquant Go |
| **Élevé** | Dans les 30 jours suivant la mise en service |
| **Moyen** | Intégré au backlog M+90 |
| **Faible** | Intégré au backlog standard |

Toute remédiation Critique ou Élevée fait l'objet d'un PV signé par le RSSI et le Directeur de projet NTSAGUI.

## 5. Livrables après audit

- [ ] Rapport d'audit complet du cabinet (intégrité préservée par hash signé)
- [ ] Plan de remédiation NTSAGUI (`docs/audit-remediation-plan.md`)
- [ ] PV de remédiation pour chaque finding Critique / Élevé
- [ ] Mise à jour des documents impactés (DAT, DSI, procédures)

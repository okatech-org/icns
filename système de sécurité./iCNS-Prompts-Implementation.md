# Prompts d'implémentation — Plateforme iCNS

**Référence :** NTSAGUI/CNS/PI/2026/001
**Version :** 1.0 — Mai 2026
**Usage :** prompts structurés à utiliser avec un assistant de développement (Claude Code, agent IA) pour guider l'implémentation, module par module.

---

## Mode d'emploi

Ce document contient une série de prompts prêts à l'emploi, organisés par module et par phase. Chaque prompt :

1. Fixe le **contexte** (le module, son rôle, ses contraintes).
2. Détaille la **tâche précise** à exécuter.
3. Énumère les **exigences non négociables** (sécurité, classification, traçabilité).
4. Décrit les **critères d'acceptation** vérifiables.

**Convention :** chaque prompt est encadré par un bloc `--- PROMPT ---`. À utiliser tel quel, ou à adapter selon le périmètre du sprint.

**Pré-requis avant utilisation :**
- Avoir lu la Spécification Fonctionnelle iCNS v1.0.
- Avoir lu le Cahier des Charges iCNS.
- Disposer du DAT validé (livrable M2).
- Travailler sur l'environnement de développement NTSAGUI sécurisé.

---

## Phase 1 — Cadrage et conception (M1–M2)

### Prompt 1.1 — Modélisation du schéma de données iCNS

```
--- PROMPT ---
Tu travailles sur la plateforme iCNS, système souverain de remontée du renseignement
national vers le Conseil National de Sécurité du Gabon. Le back-end est Convex.

Tâche : produire le schéma Convex complet pour iCNS, couvrant les tables suivantes :
- dossiers_renseignement
- pieces
- types_dossier (configuration)
- etapes_parcours (instances)
- copies_classifiees
- journal_audit
- habilitations
- consultations_dossier
- services
- utilisateurs
- schemas_reference

Exigences non négociables :
1. Tous les contenus sensibles doivent être typés `v.string()` mais représentent du
   contenu chiffré côté application (clés AES-256 via HSM, jamais en clair en base).
2. Chaque table sensible doit avoir un champ `hashIntegrite` (SHA-256).
3. Toute opération d'écriture doit produire une entrée dans `journal_audit` avec
   chaînage cryptographique (champ `hashChainage` référençant le hash de l'entrée
   précédente).
4. Les enums utilisent `v.union(v.literal(...))` — pas de strings libres.
5. Niveaux de classification : DR, CD, SD, TSD (strict).
6. Urgences : routine, urgent, flash.

Critères d'acceptation :
- Schéma Convex valide, compile sans erreur.
- Toutes les relations entre tables documentées en commentaire.
- Index pertinents définis (par classification, par service, par date).
- Tests unitaires de cohérence des contraintes (validateurs).
- Aucun champ ne stocke de contenu en clair pour les pièces/notes sensibles.
- Documentation inline en français.

Livre :
- `convex/schema.ts`
- `convex/validators/classification.ts` (validateurs de niveaux)
- `docs/schema-relations.md` (diagramme des relations)
--- FIN PROMPT ---
```

### Prompt 1.2 — Conception de l'audit immuable

```
--- PROMPT ---
Contexte : iCNS doit garantir une traçabilité indélébile et auditable. Le journal d'audit
est la pièce maîtresse du dispositif de sécurité.

Tâche : concevoir et implémenter le mécanisme de chaînage cryptographique du journal
d'audit, en TypeScript pour Convex.

Exigences non négociables :
1. Chaque entrée du journal contient : id, utilisateurId, serviceUtilisateur, action,
   classificationDossier, detail, horodatage, adresseIP, poste, hashEntreePrecedente,
   hashEntreeCourante.
2. `hashEntreeCourante` = SHA-256(toutes les autres champs concaténés y compris
   hashEntreePrecedente).
3. L'append est strictement séquentiel — aucune réécriture possible.
4. Un endpoint de vérification doit pouvoir recalculer la chaîne et signaler toute
   rupture.
5. Une sauvegarde de la chaîne doit être exportée toutes les 24h vers un système séparé.

Critères d'acceptation :
- Mutation Convex `appendAudit(...)` qui calcule et écrit le hash.
- Query Convex `verifyAuditChain()` qui parcourt et vérifie l'intégrité.
- Test unitaire : tentative de modification d'une entrée → détection.
- Test unitaire : ajout de 1000 entrées → chaîne cohérente.
- Documentation expliquant le modèle de menace (que protège l'audit).

Livre :
- `convex/audit.ts`
- `convex/audit_verify.ts`
- `tests/audit_integrity.test.ts`
- `docs/audit-threat-model.md`
--- FIN PROMPT ---
```

---

## Phase 2 — Socle technique et sécurité (M3–M5)

### Prompt 2.1 — Authentification multi-facteurs avec carte agent

```
--- PROMPT ---
Contexte : tous les utilisateurs d'iCNS s'authentifient avec une carte agent physique
(token cryptographique) + PIN + biométrie. Pas de mot de passe.

Tâche : implémenter le flux d'authentification multi-facteurs côté back-end et front-end.

Exigences non négociables :
1. La carte agent contient un certificat émis par la PKI souveraine.
2. Le certificat est validé contre la PKI souveraine (HSM-backed).
3. Le PIN est vérifié localement par la carte (pas envoyé au serveur).
4. La biométrie est vérifiée localement sur le poste durci.
5. Après succès, un jeton de session JWT signé par le HSM est émis (durée 15 min, non
   renouvelable sans re-authentification).
6. Sessions inactives expirent après 15 minutes.
7. Toute tentative d'authentification (succès ou échec) est journalisée.

Critères d'acceptation :
- Mutation Convex `authenticate(certificat, defi_signe)` qui valide et émet le JWT.
- Composant React `<LoginCardReader />` qui gère le flux côté poste.
- Middleware Convex qui vérifie le JWT sur toute query/mutation sensible.
- Tests :
  - Authentification réussie → JWT valide.
  - Certificat révoqué → refus + entrée d'audit.
  - JWT expiré → refus.
  - 5 tentatives infructueuses → verrouillage compte + alerte.

Livre :
- `convex/auth/authenticate.ts`
- `convex/auth/middleware.ts`
- `apps/agent-secure/src/auth/LoginCardReader.tsx`
- `tests/auth_flow.test.ts`
--- FIN PROMPT ---
```

### Prompt 2.2 — Intégration HSM et chiffrement

```
--- PROMPT ---
Contexte : iCNS protège les contenus sensibles par chiffrement AES-256, avec gestion
des clés par HSM souverain (PKCS#11).

Tâche : implémenter le service de chiffrement/déchiffrement transparent intégré à iCNS.

Exigences non négociables :
1. Aucune clé maître ne quitte le HSM.
2. Le chiffrement utilise des clés dérivées (DEK) chiffrées par la clé maître (KEK).
3. Chaque pièce a sa propre DEK.
4. La rotation des KEK est programmée annuellement, sans interruption de service.
5. L'API du service de chiffrement n'expose que `encrypt(payload, contextKey)` et
   `decrypt(ciphertext, contextKey)`.
6. Toute opération d'accès au HSM est journalisée.

Critères d'acceptation :
- Module Convex `crypto/service.ts` intégrant le client PKCS#11.
- Configuration via variables d'environnement (slot HSM, label de clé).
- Tests d'intégration sur un HSM logiciel (SoftHSM) en CI.
- Documentation des procédures de rotation et de récupération en cas de perte.

Livre :
- `convex/crypto/service.ts`
- `convex/crypto/dek_manager.ts`
- `tests/crypto_integration.test.ts`
- `docs/key-management.md`
--- FIN PROMPT ---
```

---

## Phase 3 — Lot 1 (M6–M8)

### Prompt 3.1 — Module iDocument

```
--- PROMPT ---
Contexte : iDocument est le module satellite d'iCNS qui stocke les fichiers attachés
aux dossiers. Tous les fichiers doivent être chiffrés au repos en AES-256 via HSM.

Tâche : implémenter iDocument comme service Convex avec API interne.

Exigences non négociables :
1. Endpoint d'upload `uploadFile(metadata, encryptedChunks[])`. Le chiffrement se fait
   côté client avant l'upload (zero-knowledge côté serveur).
2. Hash SHA-256 calculé au moment de l'upload, stocké à part.
3. À chaque lecture, vérifier le hash avant déchiffrement.
4. Limite par défaut : 500 Mo par fichier (configurable par type de pièce).
5. Téléchargement, consultation, impression : chaque action journalisée.
6. API interne consommée par iCNS, iCom, iArchive — authentification mTLS interne.
7. Refuser tout fichier dont le type MIME ne correspond pas au type de pièce déclaré.

Critères d'acceptation :
- Service iDocument déployé en tant que sous-domaine de l'application Convex.
- Tests : upload, download, vérification d'intégrité, gestion des erreurs.
- Mesure de performance : upload de 100 Mo < 30 secondes sur réseau interne.
- Documentation API (OpenAPI).

Livre :
- `convex/idocument/upload.ts`
- `convex/idocument/download.ts`
- `convex/idocument/integrity.ts`
- `apps/agent-secure/src/components/FileUploader.tsx` (chiffrement client)
- `docs/idocument-api.yaml`
- `tests/idocument_end_to_end.test.ts`
--- FIN PROMPT ---
```

### Prompt 3.2 — Gestion des dossiers et parcours

```
--- PROMPT ---
Contexte : un dossier de renseignement suit un parcours d'évaluation paramétrable.
Le parcours est défini par le `TypeDossier`. Quand le dossier est transmis à l'étape
suivante, il quitte le service producteur et une copie classifiée en lecture seule reste.

Tâche : implémenter la logique métier complète du cycle de vie d'un dossier.

Exigences non négociables :
1. Création d'un dossier : génération automatique de la référence classifiée selon le
   schéma du `TypeDossier` (ex: `MP/2026/DGSS/TSD/0007`).
2. Constitution : ajout/suppression de pièces (via iDocument), uniquement par les
   contributeurs assignés à l'étape en cours.
3. Validation interne : workflow chef de section → directeur, signature qualifiée du
   directeur obligatoire avant transmission.
4. Transmission : la mutation est atomique. Soit l'action complète aboutit (dossier
   transféré, copie créée, journal d'audit écrit), soit elle est rejetée intégralement.
5. La copie classifiée porte un tampon visible "COPIE — Transmise le [date] vers
   [destinataire]", non duplicable, non imprimable sans autorisation.
6. Renvoi (incomplet) : tracé avec motif, retour à l'étape précédente.
7. Suspension/reprise : gèle/dégèle les délais.

Critères d'acceptation :
- Toutes les actions exposées comme mutations Convex.
- Validation par tests unitaires de chaque transition de statut.
- Test d'intégration de bout en bout : création → constitution → validation → transmission
  → copie créée correctement.
- Aucun chemin de code ne permet de transmettre un dossier sans signature directeur
  (sauf dérogation explicite tracée).
- Documentation du modèle de transition d'états.

Livre :
- `convex/dossiers/create.ts`
- `convex/dossiers/transmit.ts`
- `convex/dossiers/sign.ts`
- `convex/dossiers/return.ts`
- `convex/dossiers/state_machine.ts`
- `tests/dossier_lifecycle.test.ts`
- `docs/dossier-state-machine.md`
--- FIN PROMPT ---
```

### Prompt 3.3 — Interface Officier Traitant

```
--- PROMPT ---
Contexte : interface React utilisée par les officiers traitants des services producteurs.
Esthétique sobre, sombre, optimisée pour la lecture prolongée et la confidentialité.

Tâche : implémenter l'application `agent-secure` (React + TypeScript + Tailwind) avec
les écrans suivants :
- Connexion par carte agent
- Tableau de bord : mes dossiers en constitution, dossiers de ma section, dossiers à
  viser, réquisitions reçues, correspondance officielle
- Création d'un dossier : assistant pas-à-pas
- Édition d'un dossier : éditeur de notes, gestion des pièces, parcours, commentaires
- Soumission au chef de section
- Consultation d'un dossier archivé (lecture seule)

Exigences non négociables :
1. Authentification multi-facteurs obligatoire à l'entrée.
2. Indicateur permanent de classification du contenu affiché à l'écran (bandeau coloré).
3. Filtre de confidentialité automatique (réduction du contraste si webcam détectée
   en mouvement — pour V2).
4. Verrouillage automatique après 15 min d'inactivité.
5. Aucun élément du DOM ne doit être copiable par défaut (sauf champ d'édition actif).
6. Pas d'utilisation de localStorage ni sessionStorage pour des données sensibles.

Critères d'acceptation :
- Application fonctionnelle sur poste durci.
- Tous les flux utilisateur testés en e2e (Playwright).
- Accessibilité minimale (lecteur d'écran fonctionnel, navigation clavier).
- Aucune dépendance critique à un CDN externe.

Livre :
- `apps/agent-secure/` (app complète React)
- `apps/agent-secure/tests/e2e/`
- `docs/agent-ui-guide.md`
--- FIN PROMPT ---
```

---

## Phase 4 — Lot 2 (M9–M11)

### Prompt 4.1 — Module iCom

```
--- PROMPT ---
Contexte : iCom est le module de communication officielle inter-services. Il prend en
charge les réquisitions internes, les notes de coordination, les directives SG-CNS, les
comptes-rendus de mission et les demandes d'éclaircissement.

Tâche : implémenter iCom comme module à part entière intégré à iCNS.

Exigences non négociables :
1. Cinq types de communications : `requisition`, `note_coordination`, `directive`,
   `compte_rendu`, `demande_eclaircissement`.
2. Chaque communication a une référence unique (schéma similaire aux dossiers).
3. Toute communication officielle requiert une signature qualifiée du producteur.
4. Accusé de réception automatique à la lecture par le destinataire — tracé.
5. Trois niveaux d'urgence : routine, urgent, flash.
6. Une communication Flash non lue après 1h déclenche une escalade automatique au
   SG-CNS (canal direct).
7. Une communication peut être rattachée à un dossier iCNS — lien tracé.
8. Délai de réponse attendu paramétrable par l'émetteur.

Critères d'acceptation :
- Mutations Convex : `createCom`, `sendCom`, `readCom`, `replyCom`, `escalateFlash`.
- Tâche planifiée (cron Convex) qui vérifie les Flash non lues et déclenche l'escalade.
- Tests : envoi, accusé, escalade Flash, rattachement à dossier.
- Composant React `<CommunicationsHub />` pour l'application agent.

Livre :
- `convex/icom/`
- `apps/agent-secure/src/components/CommunicationsHub.tsx`
- `docs/icom-api.yaml`
- `tests/icom_workflow.test.ts`
--- FIN PROMPT ---
```

### Prompt 4.2 — Cellule de coordination CNS (croisement)

```
--- PROMPT ---
Contexte : le secrétariat permanent du CNS reçoit les dossiers transmis. Les analystes
opèrent un croisement multi-services pour détecter les convergences. C'est le cœur de
la valeur ajoutée d'iCNS.

Tâche : implémenter le moteur de croisement et l'interface analyste CNS.

Exigences non négociables :
1. Indexation des dossiers reçus par : mots-clés, individus mentionnés (matricule
   d'identité interne, jamais le nom en clair en index), organisations, lieux, périodes.
2. Recherche multi-critères avec opérateurs booléens (ET, OU, NON).
3. Détection automatique de convergences : si deux dossiers de services différents
   partagent ≥ N critères (N configurable), alerte côté analyste CNS.
4. Respect strict du besoin-d'en-connaître : un résultat ne s'affiche que si l'analyste
   est habilité ET inscrit sur la liste de diffusion du dossier.
5. Production de synthèses : canevas pré-formaté CNS, possibilité de citer des extraits
   de plusieurs dossiers dans une note unique (avec source explicite mais protégée).
6. Demande d'éclaircissement : formulaire structuré qui crée une communication iCom
   vers le service ciblé.

Critères d'acceptation :
- Endpoint de recherche performant : < 2s sur 100 000 dossiers.
- Alerte de convergence visible sur le tableau de bord analyste.
- Génération de synthèse avec citation tracée des dossiers sources.
- Tests : recherche, convergence, génération synthèse, demande d'éclaircissement.

Livre :
- `convex/cns/crossing.ts`
- `convex/cns/synthesis.ts`
- `apps/cns-secure/src/pages/AnalystDashboard.tsx`
- `apps/cns-secure/src/pages/CrossingTool.tsx`
- `apps/cns-secure/src/pages/SynthesisEditor.tsx`
- `tests/cns_crossing.test.ts`
--- FIN PROMPT ---
```

### Prompt 4.3 — Cockpit SG-CNS

```
--- PROMPT ---
Contexte : le SG-CNS est l'opérateur principal de la plateforme. Son cockpit doit lui
permettre d'embrasser d'un coup d'œil l'état du renseignement national, de signer les
synthèses, et d'orienter les services.

Tâche : implémenter l'interface SG-CNS dans `cns-secure` (mode SG).

Exigences non négociables :
1. Vue temps réel des flux entrants par service, par classification, par urgence.
2. Liste des synthèses à signer (canevas pré-rempli par les analystes).
3. Notifications Flash en priorité haute (visuelle + sonore configurable).
4. Tableau de bord stratégique : indicateurs (volume hebdomadaire, taux de convergence,
   délais de traitement).
5. Action "Convoquer formation restreinte du CNS" : crée une note iCom multi-destinataires
   avec ordre du jour configurable.
6. Action "Demander éclaircissement" : crée une iCom officielle au directeur du service
   producteur.
7. Action "Classer sans suite" : tracée, avec motivation obligatoire.
8. Bouton "Signer pour transmission via API présidentielle" : enclenche la mise à
   disposition d'une synthèse pour consultation par l'application présidentielle.

Critères d'acceptation :
- Interface fluide, temps réel via Convex reactive queries.
- Tests e2e de chaque action du SG.
- Vérification que seul l'utilisateur en titre du SG-CNS (ou son délégué explicite) peut
  accéder à ce cockpit.

Livre :
- `apps/cns-secure/src/pages/SGCockpit.tsx`
- `apps/cns-secure/src/components/StrategicDashboard.tsx`
- `apps/cns-secure/src/components/FlashAlerts.tsx`
- `tests/sg_cockpit.test.ts`
--- FIN PROMPT ---
```

---

## Phase 5 — Lot 3 (M12–M14)

### Prompt 5.1 — Module iArchive

```
--- PROMPT ---
Contexte : iArchive recueille les dossiers clôturés selon les politiques de rétention.
Le contenu archivé est strictement non modifiable. La déclassification est outillée.

Tâche : implémenter iArchive comme module satellite intégré.

Exigences non négociables :
1. Réception automatique des dossiers clôturés depuis iCNS — workflow asynchrone.
2. Politique de rétention par classification :
   - DR : 5 ans
   - CD : 10 ans
   - SD : 30 ans
   - TSD : 50 ans
3. Contenu archivé : copie complète chiffrée du dossier, snapshot des pièces (via
   iDocument), journal d'audit du dossier inclus.
4. Indexation pour recherche autorisée (auditeur sur mandat, SG-CNS, Président).
5. Procédure de déclassification : workflow d'approbation (SG-CNS → commission de
   déclassification → versement aux Archives Nationales).
6. Aucune modification du contenu archivé n'est techniquement possible (append-only
   storage).
7. Accès auditeur en lecture seule sur mandat.

Critères d'acceptation :
- Tâche planifiée (cron) qui vérifie les dossiers expirés.
- Mutation `archiveDossier(dossierId)` qui transfère depuis iCNS vers iArchive.
- Mutation `requestDeclassification(archiveId, motif)` qui démarre le workflow.
- Test : tentative de modification d'un contenu archivé → refus.
- Test : déclassification complète d'un dossier SD après 30 ans simulés.

Livre :
- `convex/iarchive/`
- `apps/cns-secure/src/pages/ArchiveAccess.tsx`
- `docs/declassification-procedure.md`
- `tests/iarchive_retention.test.ts`
--- FIN PROMPT ---
```

### Prompt 5.2 — API présidentielle

```
--- PROMPT ---
Contexte : l'application présidentielle est traitée hors périmètre. Elle accédera aux
synthèses produites par iCNS via une API sécurisée. Le contrôle d'accès est exercé
exclusivement par le SG-CNS.

Tâche : concevoir et implémenter l'API présidentielle.

Exigences non négociables :
1. Authentification mTLS : certificat client émis par la PKI souveraine, vérifié à
   chaque requête.
2. Au-dessus du mTLS : jeton OAuth2 à courte durée (15 min), renouvelé par échange de
   refresh token sécurisé.
3. Endpoints exposés (REST) :
   - `GET /syntheses` — liste des synthèses signées et autorisées.
   - `GET /syntheses/{id}` — détail d'une synthèse.
   - `POST /syntheses/{id}/acknowledge` — accusé de consultation présidentielle.
   - `POST /syntheses/{id}/instruction` — instruction présidentielle vers le SG-CNS.
   - `GET /dossiers/{ref}` — demande nominative (avec contrôle d'habilitation).
4. L'autorisation d'accès à l'API est nominative, accordée par le SG-CNS. Liste
   maintenue dans iCNS, vérifiée à chaque requête.
5. Chaque appel API est tracé dans un journal scellé spécifique côté iCNS, accessible
   uniquement au SG-CNS et au RSSI.
6. Signature de payload : la réponse est signée par iCNS (clé HSM), l'application
   présidentielle vérifie la signature.
7. Aucune connexion réseau directe possible entre l'application présidentielle et le
   réseau opérationnel des services — seulement via cette API.

Critères d'acceptation :
- Spécification OpenAPI 3.0 complète et validée.
- Implémentation côté iCNS (Convex HTTP actions).
- Client de référence en TypeScript (livrable pour l'équipe app présidentielle).
- Tests : authentification mTLS, jeton expiré, signature invalide, requête non
  autorisée, accusé de consultation tracé.
- Cahier de tests à destination de l'équipe en charge de l'application présidentielle.

Livre :
- `convex/api_presidentielle/`
- `docs/api-presidentielle-openapi.yaml`
- `clients/presidentielle-reference-client/`
- `docs/api-presidentielle-test-plan.md`
- `tests/api_presidentielle_e2e.test.ts`
--- FIN PROMPT ---
```

### Prompt 5.3 — Module Crise

```
--- PROMPT ---
Contexte : en situation de crise (attaque, catastrophe, menace majeure), iCNS doit
basculer en mode opérationnel renforcé : tableau de commandement, mobilisation accélérée,
flux Flash systématique.

Tâche : implémenter le module Crise.

Exigences non négociables :
1. Activation Crise : déclenchée par le SG-CNS, propagée à tous les services en moins
   de 1 minute.
2. Tableau de bord Crise : agrégation temps réel de tous les signalements Flash actifs,
   cartographie géographique, indicateurs critiques.
3. Mobilisation : convocation simultanée des chefs de service via iCom + canal alternatif
   (SMS chiffré, à intégrer en V2).
4. File prioritaire : tous les dossiers marqués "lié à la crise XX" remontent en tête
   des flux CNS et SG-CNS.
5. Journal de crise : traçage exhaustif des décisions du SG-CNS et des actions des
   services.
6. Désactivation Crise : décision SG-CNS, génération automatique d'un rapport de crise.

Critères d'acceptation :
- Mutation `activateCrisis(nom, perimetre, niveau)`.
- Tableau de bord live avec mise à jour < 5 secondes.
- Cartographie géographique fonctionnelle (lib légère, pas de service externe).
- Tests : activation, propagation, désactivation, génération de rapport.

Livre :
- `convex/crise/`
- `apps/cns-secure/src/pages/CrisisCommand.tsx`
- `docs/crisis-mode.md`
- `tests/crisis_activation.test.ts`
--- FIN PROMPT ---
```

---

## Phase 6 — Homologation et bascule (M15–M18)

### Prompt 6.1 — Tests de charge

```
--- PROMPT ---
Contexte : avant la mise en service intégrale, iCNS doit prouver qu'elle tient la charge
nominale (500 utilisateurs simultanés, 1000 dossiers/jour).

Tâche : concevoir et exécuter un plan de tests de charge complet.

Exigences :
1. Simulation de 500 utilisateurs simultanés répartis entre les profils (agent,
   direction, analyste CNS, SG).
2. Génération de 1000 dossiers/jour avec parcours complets.
3. Mesure des indicateurs :
   - Temps de réponse moyen consultation : < 2s
   - Temps de transmission : < 5s
   - Délai escalade Flash : < 1 min
   - Taux d'erreur : < 0,1 %
4. Test sur 72h consécutives.
5. Test de bascule site primaire → site de repli pendant un test de charge.

Critères d'acceptation :
- Rapport de tests de charge détaillé.
- Tous les indicateurs respectés ou plan de remédiation documenté.
- Recommandations de dimensionnement pour la production.

Livre :
- `tests/load/scenarios/`
- `docs/load-test-report.md`
- `docs/production-sizing.md`
--- FIN PROMPT ---
```

### Prompt 6.2 — Audit de sécurité externe

```
--- PROMPT ---
Contexte : audit de sécurité externe par cabinet certifié, indépendant de NTSAGUI,
préalable à la mise en service.

Tâche : préparer le dossier d'audit complet.

Pré-requis pour l'audit externe :
1. Spécification fonctionnelle complète, à jour.
2. DAT et DSI à jour.
3. Code source disponible (sous embargo de confidentialité).
4. Documentation de l'infrastructure (topologie, durcissement, HSM).
5. Plan de tests internes et résultats.
6. Journaux d'audit échantillonnés.
7. Procédures opérationnelles documentées.

Périmètre attendu de l'audit :
- Revue de code : modules critiques (auth, crypto, audit, API présidentielle).
- Tests d'intrusion externe et interne.
- Audit organisationnel (habilitations, locaux, procédures NTSAGUI).
- Vérification de la conformité aux exigences du cahier des charges.

Critères d'acceptation :
- Dossier d'audit complet remis 1 mois avant le démarrage de l'audit.
- Présence permanente d'un référent NTSAGUI pendant l'audit.
- Remédiation des findings selon la matrice critique/élevé/moyen/faible :
  - Critique : remédiation avant mise en service.
  - Élevé : remédiation dans les 30 jours suivant la mise en service.
  - Moyen : intégré au backlog M+90.
  - Faible : intégré au backlog standard.

Livre :
- `docs/audit-dossier/`
- `docs/audit-remediation-plan.md`
--- FIN PROMPT ---
```

### Prompt 6.3 — Bascule en production

```
--- PROMPT ---
Contexte : bascule progressive en production sur les 13 services, sous le contrôle du
SG-CNS.

Tâche : exécuter le plan de bascule.

Plan de bascule (sur 6 semaines) :
- Semaine 1-2 : bascule des 2 services pilotes (B2, DGDI) en production.
- Semaine 3-4 : ajout de 5 services (DGR, DGSS, SILAM, Gendarmerie, GR).
- Semaine 5-6 : ajout des 6 services restants (FAG ×3, Police, DGSP, Douane).

Exigences :
1. Validation explicite du SG-CNS avant chaque vague.
2. Procédure de rollback documentée et testée pour chaque vague.
3. Période d'observation de 72h après chaque vague avant la suivante.
4. Démantèlement progressif des circuits papier sensibles à partir de la semaine 4.
5. Support renforcé NTSAGUI sur place pour chaque vague (présence physique).
6. PV de mise en service intégrale signé par SG-CNS et RSSI à M18.

Critères d'acceptation :
- Plan détaillé par vague (qui, quoi, quand, fallback).
- Procédure de rollback testée en homologation.
- Briefing complet des services avant chaque vague.
- Aucune perte de donnée pendant la bascule.

Livre :
- `docs/cutover-plan.md`
- `docs/rollback-procedures.md`
- `docs/service-onboarding-checklist.md`
--- FIN PROMPT ---
```

---

## Annexes — Prompts transverses

### Prompt T-1 — Revue de code sécurité

```
--- PROMPT ---
Tu reçois un fichier de code [chemin]. Effectue une revue de sécurité approfondie selon
les critères suivants :

1. Authentification et autorisation
   - Toute opération sensible vérifie-t-elle l'identité de l'utilisateur ?
   - Le besoin-d'en-connaître est-il appliqué ?
   - Aucune route protégée sans middleware d'auth ?

2. Validation des entrées
   - Toutes les entrées utilisateur sont-elles validées ?
   - Y a-t-il des risques d'injection (SQL, NoSQL, command, XSS, etc.) ?

3. Chiffrement et gestion des clés
   - Aucune clé en dur dans le code ?
   - Aucun secret commité dans le dépôt ?
   - Les contenus sensibles sont-ils chiffrés au repos et en transit ?

4. Traçabilité
   - Toutes les actions sensibles sont-elles journalisées ?
   - Le journal d'audit est-il bien chaîné ?

5. Gestion d'erreurs
   - Aucun stack trace exposé au client ?
   - Les erreurs sensibles sont-elles masquées ?

6. Dépendances
   - Toutes les dépendances utilisées sont-elles légitimes et à jour ?

Produis un rapport structuré (Critique / Élevé / Moyen / Faible / OK) avec, pour chaque
finding, une recommandation actionnable.
--- FIN PROMPT ---
```

### Prompt T-2 — Génération d'une fiche utilisateur

```
--- PROMPT ---
Tu produis une fiche utilisateur (manuel d'utilisation) pour un agent iCNS, en français,
sobre, factuelle.

Profil ciblé : [Officier Traitant / Chef de section / Directeur de service / Analyste CNS
/ SG-CNS].

Plan attendu :
1. Vue d'ensemble du rôle
2. Connexion (carte agent + PIN + biométrie)
3. Navigation principale (avec captures d'écran à insérer)
4. Actions courantes (avec étapes détaillées)
5. Cas particuliers
6. Que faire en cas de problème (rappel : ne JAMAIS contacter un support externe — toujours le RSSI)

Contraintes :
- Aucun jargon technique non justifié.
- Toutes les références à des classifications, des matricules, des cas réels doivent
  être fictives.
- 4 à 8 pages maximum.

Livre : `docs/manuels-utilisateurs/[profil].md`
--- FIN PROMPT ---
```

### Prompt T-3 — Production d'un test d'acceptation utilisateur

```
--- PROMPT ---
Pour chaque exigence fonctionnelle EF-XX.YY du Cahier des Charges, produis un test
d'acceptation utilisateur (UAT) selon le format :

- ID du test
- Exigence couverte
- Pré-conditions
- Étapes (numérotées)
- Résultat attendu
- Critère de réussite mesurable

Les tests doivent être :
- Reproductibles.
- Exécutables par un utilisateur métier (sans connaissance technique).
- Sans dépendance entre eux.
- Couverts par des jeux de données fictives certifiées.

Livre : `tests/uat/EF-XX-YY.md` (un fichier par exigence majeure).
--- FIN PROMPT ---
```

### Prompt T-4 — Modélisation d'un nouveau type de dossier

```
--- PROMPT ---
On souhaite ajouter un nouveau type de dossier dans iCNS : [nom du type].

Tâche : produire la configuration complète du TypeDossier en suivant la structure
existante.

Décrire :
1. Code du type (3 à 8 caractères).
2. Schéma de référence (ex : `XX/YYYY/SERV/CLASS/SEQ`).
3. Classification minimale.
4. Pièces attendues (nom, type, obligatoire, fournisseur, signataire).
5. Parcours d'évaluation (étapes ordonnées, rôles, conditions de passage, délais).
6. Services producteurs autorisés.
7. Politique d'archivage (durée de rétention).
8. Délai cible (selon urgence).

Produire le fichier de configuration et un script de migration Convex.

Livre :
- `convex/types_dossier/seeds/[code].ts`
- `docs/types-dossier/[code].md`
--- FIN PROMPT ---
```

---

## Fin du document

*Ces prompts sont vivants : ils doivent être adaptés au contexte de chaque sprint et
enrichis au fur et à mesure que la plateforme évolue. Toute modification doit faire
l'objet d'une revue par l'Architecte logiciel principal et l'Architecte sécurité.*

*Référence : NTSAGUI/CNS/PI/2026/001 — Mai 2026 — CONFIDENTIEL DÉFENSE*

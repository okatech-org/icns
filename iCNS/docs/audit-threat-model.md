# Modèle de menace — Journal d'audit iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §2.8 (EF-08), §4.3 (ES-03) — Prompt 1.2
**Version** : 0.1 — Mai 2026
**Classification** : CONFIDENTIEL DÉFENSE — annexe sécurité

Ce document décrit le modèle de menace que le journal d'audit chaîné SHA-256 cherche à couvrir, les attaques qu'il prévient ou détecte, et ses limites explicites.

## 1. Actifs à protéger

| Actif | Description | Sensibilité |
|---|---|---|
| **Journal d'audit lui-même** | Table `journal_audit` — toute la traçabilité iCNS y est consignée | Critique |
| **Chaîne SHA-256** | La séquence ordonnée des hash `hashEntreeCourante` | Critique |
| **Preuve d'auteur** | L'attribution d'une action à un utilisateur (matricule) à un instant donné | Élevée |
| **Preuve de classification** | Le fait qu'un dossier ait été manipulé à un niveau de classification donné | Élevée |

L'audit est **la pièce maîtresse** de la défense organisationnelle iCNS : c'est lui qui permet de répondre aux questions « qui a vu quoi, quand, depuis où » lors d'une enquête interne ou d'un audit externe (ES-03).

## 2. Attaquants considérés

### 2.1. Attaquant externe — réseau

- **Capacités** : aucun accès au réseau opérationnel iCNS (segmenté, sans connectivité externe sauf via API présidentielle mTLS).
- **Capacités résiduelles** : possible interception de la sauvegarde out-of-band si mal sécurisée.
- **Pertinence pour l'audit** : faible — l'attaquant externe n'a pas d'accès direct au journal.

### 2.2. Utilisateur interne malveillant — agent simple

- **Capacités** : authentification valide carte agent + PIN + biométrie, accès en lecture/écriture aux mutations métier selon son rôle.
- **Objectif typique** :
  - Cacher une consultation non autorisée (ex. consulter un dossier hors périmètre BdC, puis effacer la trace).
  - Modifier un dossier dont il n'a pas la signature, puis effacer la trace.
- **Pertinence pour l'audit** : **élevée — c'est la menace principale**.

### 2.3. Utilisateur interne malveillant — admin technique

- **Capacités** : accès à la console Convex, droits sur tables, peut potentiellement modifier des lignes directement.
- **Objectif typique** :
  - Réécrire une entrée du journal pour falsifier l'historique.
  - Insérer des entrées rétroactives.
  - Supprimer des entrées compromettantes.
- **Pertinence pour l'audit** : **maximale — c'est la menace structurante**.

### 2.4. Compromission d'infrastructure

- **Capacités** : accès root au serveur Convex (ex. via compromission du hyperviseur, vol de console).
- **Objectif typique** : modification massive du journal, restauration de sauvegarde altérée, rollback total.
- **Pertinence pour l'audit** : élevée — la défense repose alors sur les sauvegardes out-of-band et la vérification par tiers (EF-08.5).

## 3. Menaces couvertes par la chaîne SHA-256

### M1 — Modification a posteriori d'une entrée

**Scénario** : un admin technique modifie la valeur du champ `detail` d'une entrée pour faire disparaître un détail compromettant.

**Détection** : la mutation `verifyAuditChain` recalcule le hash de l'entrée modifiée à partir de ses champs actuels. Le hash recalculé diffère de `hashEntreeCourante` stocké → écart `hash_courant_invalide` signalé.

**Cascade** : la modification de l'entrée N invalide aussi l'entrée N+1 (qui pointe sur l'ancien hash). L'attaquant doit donc recalculer la chaîne complète à partir de N+1, ce qui :
- nécessite la capacité d'écrire toutes les entrées suivantes (potentiellement des millions) sans déclencher l'OCC Convex ;
- laisse une lacune si la sauvegarde out-of-band a déjà été exportée — la sauvegarde restera incompatible avec le journal modifié.

### M2 — Insertion rétroactive d'une entrée

**Scénario** : un attaquant insère une nouvelle entrée entre les entrées N et N+1 pour fabriquer une preuve (ex. consentement préalable, autorisation).

**Détection** : la nouvelle entrée doit avoir une séquence cohérente (entre N et N+1 → soit N.5 — impossible avec des entiers, soit un duplicata de N ou N+1 — détecté par contrainte d'unicité de séquence). Si l'attaquant choisit `sequence = N+1` et décale toutes les suivantes, il doit recalculer la chaîne complète en aval — même problème que M1.

**Limite** : si l'attaquant a un accès total ET la patience de recalculer toute la chaîne aval ET que la sauvegarde out-of-band n'a pas encore été déclenchée, l'insertion peut passer inaperçue. C'est pourquoi la **sauvegarde out-of-band toutes les 24h** (EF-08.3) est une contre-mesure essentielle.

### M3 — Suppression d'une entrée

**Scénario** : un attaquant supprime l'entrée N pour effacer la trace d'une action.

**Détection** : la séquence devient non continue → écart `sequence_non_continue`. De plus, `hashEntreePrecedente` de l'entrée N+1 ne correspond plus au `hashEntreeCourante` de l'entrée présente avant elle dans le journal (qui est maintenant N-1) → écart `hash_precedent_invalide`.

### M4 — Réécriture massive avec recalcul de chaîne

**Scénario** : un attaquant avec accès total recalcule toute la chaîne à partir de la rupture pour la rendre cohérente.

**Détection** : repose sur les sauvegardes out-of-band. La sauvegarde quotidienne porte le hash de la dernière entrée à l'instant T. Si la chaîne est réécrite après T, le hash de l'entrée séquence-T ne correspondra plus.

**Contre-mesure procédurale (ES-03)** : chaque sauvegarde out-of-band est signée par le RSSI et stockée sur un support physiquement séparé. L'audit annuel (ES-03.3) compare les hash des sauvegardes pour détecter toute incohérence temporelle.

### M5 — Manipulation du timestamp

**Scénario** : un attaquant manipule le champ `horodatage` pour faire passer une action comme antérieure ou postérieure à sa date réelle.

**Détection** : `horodatage` est inclus dans le payload hashé. Toute modification a posteriori est donc détectée comme M1.

**Limite résiduelle** : si l'attaquant peut influencer l'horloge système au moment de l'écriture (NTP poisoning, etc.), il peut générer une entrée légitime avec un horodatage erroné. Cette menace n'est pas couverte par la chaîne mais par :
- la synchronisation NTP authentifiée vers un serveur de temps souverain ;
- la corrélation avec d'autres journaux (firewall, switch, badge physique) lors d'enquêtes.

### M6 — Déni de service sur le journal

**Scénario** : un attaquant flood le journal avec des millions d'entrées vides pour rendre la vérification trop coûteuse.

**Détection** : surveillance du débit d'append (alerte si > N entrées/seconde au-dessus du baseline). La vérification paginée (cf. TODO `convex/audit_verify.ts`) permet quand même de scanner par tranches.

**Limite résiduelle** : pas de quota dur côté Convex pour l'instant. À ajouter en Phase 2 (Prompt 2.1) via le middleware d'authentification.

## 4. Menaces NON couvertes par l'audit

Le journal d'audit n'est **pas** une défense contre :

1. **L'exfiltration directe de contenu**. Si un agent habilité affiche un dossier à l'écran et le photographie avec son téléphone, le journal enregistre l'accès mais ne l'empêche pas. Cette menace est traitée par les postes durcis (ET-03) et l'absence de caméra (ET-03.5).
2. **L'abus de droits par un agent habilité**. Si un agent consulte un dossier dans le cadre de son périmètre BdC mais pour des raisons illégitimes, le journal trace la consultation mais ne sait pas qu'elle est abusive. Détection par analyse comportementale (volume, plage horaire, ratio consultations/contributions) — à implémenter en Phase 4 (Prompt 4.3).
3. **Le déni de l'utilisateur**. Si l'attaquant force la révocation de toutes les habilitations puis prétend qu'il n'a jamais eu accès, le journal contient bien la trace de ses actions passées. Mais c'est la mutation `revoquer_habilitation` qui doit elle-même être tracée (et elle l'est).
4. **La compromission du HSM**. Si le HSM lui-même est compromis (clés exfiltrées), un attaquant peut signer des entrées falsifiées qui semblent légitimes. Réponse : audit annuel des HSM, rotation des clés KEK (Prompt 2.2), surveillance physique des HSM (sceaux, scellés).
5. **La compromission du runtime Convex**. Si le hyperviseur Convex est compromis, l'attaquant peut intercepter et modifier les mutations à la volée. Réponse : déploiement Convex en **instance souveraine** (ET-04.1), durcissement de l'infrastructure (DSI à produire en M2).

## 5. Hypothèses opérationnelles

L'efficacité du journal repose sur les hypothèses suivantes (à vérifier en audit) :

| Hypothèse | Vérification | Responsable |
|---|---|---|
| Les sauvegardes out-of-band sont effectuées toutes les 24h | Logs de l'orchestrateur de sauvegarde + comparaison de hash | Exploitation (RSSI) |
| Les sauvegardes sont signées et stockées sur support séparé | Inventaire physique trimestriel | RSSI |
| L'horloge système est synchronisée NTP authentifié | Monitoring NTP + alerte si dérive > 1s | Exploitation |
| L'accès direct aux tables Convex est restreint au RSSI | Revue des droits d'accès console | RSSI |
| Le code de la mutation `appendAudit` n'a pas été altéré | Hash du déploiement comparé au dépôt source | Architecte logiciel |
| Aucun chemin de code applicatif ne contourne `appendAuditEntry` | Revue de code à 4 yeux (EQ-01.2) + grep CI | Architecte logiciel |

## 6. Procédure de réaction à une rupture de chaîne

Si `verifyAuditChain` retourne `ok: false` :

1. **Geler** : interdire toute nouvelle écriture dans `journal_audit` (mode read-only sur le déploiement).
2. **Alerter** : notification immédiate du RSSI, du SG-CNS et de l'Architecte sécurité.
3. **Sauvegarder l'état** : snapshot complet du déploiement Convex + capture de tous les journaux système.
4. **Investiguer** : comparer les hash avec les sauvegardes out-of-band des dernières 30 jours. Identifier la séquence de la première rupture et corréler avec les journaux système.
5. **Rapporter** : produire un rapport d'incident à destination du Comité de pilotage et de l'audit externe (ES-03.2).
6. **Décider** : selon la gravité, soit restaurer depuis la sauvegarde validée la plus récente (perte de données acceptable), soit lancer une enquête forensique complète.

La procédure détaillée fait l'objet du PCO (livrable M16) et est testée semestriellement (ES-04.1).

## 7. Bénéfices résiduels

Même si un attaquant parvient à manipuler le journal sans être détecté, la **présence du chaînage** :
- augmente significativement le coût et le temps d'une attaque réussie ;
- garantit que toute manipulation laisse au moins une trace exploitable par enquête forensique ;
- décourage les passages à l'acte (effet dissuasif documenté en sécurité de l'information).

C'est une défense en profondeur, pas une garantie absolue.

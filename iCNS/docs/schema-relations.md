# Schéma iCNS — Relations entre tables

**Référence** : NTSAGUI/CNS/CDC/2026/001 §2 — Prompt 1.1
**Version du schéma** : 0.1 (Mai 2026)
**Classification** : CONFIDENTIEL DÉFENSE — annexe technique

Ce document décrit les 11 tables cœur du schéma iCNS et leurs relations. Le schéma source fait foi : [`convex/schema.ts`](../convex/schema.ts). Les validateurs d'énumération sont définis dans [`convex/validators/classification.ts`](../convex/validators/classification.ts).

## 1. Cartographie générale

```
                       ┌─────────────────────┐
                       │      services       │
                       │  (13 organismes)    │
                       └──────────┬──────────┘
                                  │ 1 ↔ N
                                  ▼
                       ┌─────────────────────┐         ┌──────────────────────┐
                       │    utilisateurs     │◀────────│   habilitations      │
                       │  (matricule, role)  │ N ↔ 1   │ (classifMax, BdC)    │
                       └──────────┬──────────┘         └──────────────────────┘
                                  │
                                  │ produit
                                  ▼
┌─────────────────────┐   ┌─────────────────────┐         ┌──────────────────────┐
│  types_dossier      │──▶│ dossiers_           │◀────────│ etapes_parcours      │
│  (config parcours)  │1↔N│ renseignement       │ 1 ↔ N   │ (instances étapes)   │
└──────────┬──────────┘   └──────────┬──────────┘         └──────────────────────┘
           │ 1 ↔ 1                   │
           ▼                         │ 1 ↔ N
┌─────────────────────┐              │
│ schemas_reference   │              ▼
│ (pattern de réf.)   │     ┌────────────────────┐
└─────────────────────┘     │      pieces        │
                            │ (notes, fiches,    │
                            │  fichiers iDoc)    │
                            └────────────────────┘
                                  │
                                  │ trace
                                  ▼
                            ┌────────────────────┐
                            │ consultations_     │
                            │ dossier            │  SD/TSD uniquement
                            └────────────────────┘
                            
                       ┌────────────────────┐         ┌────────────────────┐
                       │ copies_classifiees │◀────────│  journal_audit     │
                       │ (snapshots r/o)    │         │ (chaîne SHA-256)   │
                       └────────────────────┘         └────────────────────┘
                                  ▲                            ▲
                                  │                            │ append-only
                          créée lors de                  pour CHAQUE
                          la transmission              écriture sensible
```

## 2. Tables et relations en détail

### 2.1. `services`
Source de vérité des 13 organismes bénéficiaires (CDC §1.3 : B2, DGDI, DGR, DGSS, GR, GN, FAG×3, POLICE, SILAM, DGSP, DOUANE).

- **Clé primaire** : `_id` (Convex)
- **Clé fonctionnelle** : `code` (enum strict via `serviceCodeValidator`)
- **Relations sortantes** : aucune
- **Relations entrantes** :
  - `utilisateurs.serviceId` (1 service ↔ N utilisateurs)
  - `services.parentServiceId` (auto-référence pour les sous-services)
- **Index** : `by_code`, `by_actif`

### 2.2. `utilisateurs`
Agents et opérateurs habilités à utiliser iCNS. Le `matricule` (identifiant interne anonyme) est utilisé dans tous les index d'audit et de croisement. Les champs nominatifs sont chiffrés.

- **Clé primaire** : `_id`
- **Clé fonctionnelle** : `matricule` (unique)
- **Relations sortantes** :
  - `utilisateurs.serviceId` → `services._id`
- **Relations entrantes** :
  - `habilitations.utilisateurMatricule` (1 utilisateur ↔ N habilitations)
  - `journal_audit.utilisateurMatricule`
  - `consultations_dossier.utilisateurMatricule`
  - `dossiers_renseignement.createdByMatricule`, `signedByDirecteurMatricule`
  - `pieces.addedByMatricule`, `signedByMatricule`
  - `etapes_parcours.contributeursMatricules[]`
  - `copies_classifiees.autorisationImpressionParMatricule`
- **Index** : `by_matricule`, `by_service`, `by_role`, `by_actif`

### 2.3. `habilitations`
Clearance + besoin-d'en-connaître (EF-04). Une habilitation associe un utilisateur à une classification maximale et un périmètre. Plusieurs habilitations actives peuvent coexister (cumul de périmètres).

- **Clé primaire** : `_id`
- **Relations sortantes** :
  - `habilitations.utilisateurMatricule` → `utilisateurs.matricule` (logique, par valeur)
  - `habilitations.delivreParMatricule` → `utilisateurs.matricule` (autorité émettrice)
- **Règle métier** : un utilisateur accède à un dossier ssi il existe une habilitation active (`revoque == false`, dans la fenêtre `valideAPartirDe`–`valideJusquA`) dont `classificationMax ≥ dossier.classification` ET dont le périmètre couvre le dossier (mots-clés, zone géographique, fonctionnel, période).
- **Index** : `by_utilisateur`, `by_utilisateur_actif`, `by_classification_max`

### 2.4. `schemas_reference`
Patterns de génération de référence classifiée. Pattern type : `{code}/{yyyy}/{service}/{classification}/{seq}` produisant `MP/2026/DGSS/TSD/0007`.

- **Clé primaire** : `_id`
- **Clé fonctionnelle** : `code`
- **Relations entrantes** :
  - `types_dossier.schemaReferenceId` → `schemas_reference._id`
- **Index** : `by_code`

### 2.5. `types_dossier`
Configuration métier d'un type de dossier (EF-01.4) : référence, classification minimale, parcours, durée de rétention, services autorisés.

- **Clé primaire** : `_id`
- **Clé fonctionnelle** : `code`
- **Relations sortantes** :
  - `types_dossier.schemaReferenceId` → `schemas_reference._id`
- **Relations entrantes** :
  - `dossiers_renseignement.typeDossierId` → `types_dossier._id`
- **Contraintes** :
  - `dureeRetentionAns` doit être cohérent avec `classificationMin` (EF-06.3 : DR 5 ans, CD 10 ans, SD 30 ans, TSD 50 ans).
  - `parcours[]` doit contenir au moins une étape avec `roleRequis = "directeur_service"` pour respecter EF-01.5 (signature directeur obligatoire avant transmission).
- **Index** : `by_code`, `by_actif`

### 2.6. `dossiers_renseignement`
Cœur du système. Chaque ligne = un dossier de renseignement actif ou clôturé.

- **Clé primaire** : `_id`
- **Clé fonctionnelle** : `reference` (générée à la création depuis `schemas_reference.pattern`)
- **Relations sortantes** :
  - `dossiers_renseignement.typeDossierId` → `types_dossier._id`
  - `dossiers_renseignement.serviceProducteurCode` → `services.code` (logique, par valeur)
  - `dossiers_renseignement.createdByMatricule` → `utilisateurs.matricule`
  - `dossiers_renseignement.signedByDirecteurMatricule` → `utilisateurs.matricule` (optionnel)
- **Relations entrantes** :
  - `pieces.dossierId` (1 dossier ↔ N pièces)
  - `etapes_parcours.dossierId` (1 dossier ↔ N étapes)
  - `consultations_dossier.dossierId` (1 dossier ↔ N consultations)
  - `copies_classifiees.dossierOriginalId` (1 dossier ↔ N copies — typiquement 1)
  - `journal_audit.dossierId` (optionnel)
- **Champs chiffrés** : `encryptedTitre`, `encryptedSynthese`
- **Hash d'intégrité** : `hashIntegrite` (SHA-256) recalculé à chaque modification
- **Transition d'états (EF-01)** : constitution → validation_section → validation_direction → transmis_cns → cloture_(positif|negatif|administratif) → archive
- **Suspension/Reprise (EF-01.8)** : tout statut non terminal peut être basculé en `suspendu` (et inversement) ; les délais sont gelés pendant la suspension.
- **Clôture irréversible (EF-01.10)** : aucune transition ne sort des statuts `cloture_*` ou `archive`.
- **Index** : `by_reference`, `by_classification`, `by_service_producteur`, `by_statut`, `by_urgence`, `by_createdAt`, `by_crisis`, `by_service_statut`

### 2.7. `pieces`
Pièces composant un dossier (EF-01.3) : notes, fiches individu/organisation, pièces probantes, transcriptions, rapports, pièces de procédure, avis.

- **Clé primaire** : `_id`
- **Relations sortantes** :
  - `pieces.dossierId` → `dossiers_renseignement._id`
  - `pieces.addedByMatricule` → `utilisateurs.matricule`
  - `pieces.signedByMatricule` → `utilisateurs.matricule` (optionnel)
  - `pieces.fileStorageId` → Convex `_storage` (stockage chiffré)
- **Contraintes** :
  - Si `typePiece == "avis"`, alors une signature qualifiée est attendue (`signedByMatricule`, `signatureQualifieeBlob`, `signedAt`).
  - `mimeType` doit correspondre au type de pièce déclaré (cf. iDocument — EF-05.7).
- **Hash d'intégrité** : `hashIntegrite` (SHA-256 sur metadata + contenu déchiffré)
- **Index** : `by_dossier`, `by_dossier_type`, `by_addedBy`

### 2.8. `etapes_parcours`
Instances d'étapes franchies dans le parcours d'un dossier. Permet de tracer l'historique fin du dossier sans ambiguïté.

- **Clé primaire** : `_id`
- **Relations sortantes** :
  - `etapes_parcours.dossierId` → `dossiers_renseignement._id`
- **Contraintes** :
  - Pour un même `dossierId`, les `etapeIndex` doivent former une suite continue (avec retours possibles via `motifSortie == "renvoi"`).
  - `etapeCode` et `etapeLabel` sont des copies pour rester lisibles si la config `types_dossier` change ultérieurement.
- **Index** : `by_dossier`, `by_dossier_etape`

### 2.9. `copies_classifiees`
Copie read-only laissée sur le service producteur quand un dossier est transmis (EF-01.6). Le dossier original quitte le service ; la copie reste pour permettre la traçabilité interne.

- **Clé primaire** : `_id`
- **Relations sortantes** :
  - `copies_classifiees.dossierOriginalId` → `dossiers_renseignement._id`
- **Champs chiffrés** : `encryptedSnapshot` (copie complète du dossier au moment de la transmission)
- **Contrainte impression** : `impressionAutorisee == false` par défaut. L'impression nécessite une autorisation tracée (`autorisationImpressionParMatricule`, `autorisationImpressionAt`).
- **Index** : `by_dossier_original`, `by_service_producteur`, `by_dateTransmission`

### 2.10. `consultations_dossier`
Traçabilité fine SD/TSD (EF-04.5). Toute consultation d'un dossier dont la classification est SD ou TSD doit être tracée individuellement ici, en complément du `journal_audit` générique.

- **Clé primaire** : `_id`
- **Relations sortantes** :
  - `consultations_dossier.dossierId` → `dossiers_renseignement._id`
  - `consultations_dossier.utilisateurMatricule` → `utilisateurs.matricule`
- **Cas d'usage** : alimente le rapport hebdomadaire des consultations SD/TSD destiné au SG-CNS (EF-04.6).
- **Index** : `by_dossier`, `by_utilisateur`, `by_horodatage`, `by_classification`

### 2.11. `journal_audit`
Journal immuable chaîné SHA-256 (EF-08, Prompt 1.2). C'est la pièce maîtresse du dispositif de traçabilité.

- **Clé primaire** : `_id`
- **Clé fonctionnelle** : `sequence` (numéro d'ordre 1-based, strictement croissant)
- **Chaînage** : `hashEntreeCourante` = SHA-256(`sequence` + `utilisateurMatricule` + `serviceUtilisateur` + `action` + `classificationDossier` + `dossierId` + `cibleEntiteType` + `cibleEntiteId` + `detail` + `horodatage` + `adresseIP` + `poste` + `hashEntreePrecedente`)
- **Entrée initiale (genesis)** : `hashEntreePrecedente == "GENESIS"`
- **Règle d'append** : strictement séquentiel — Convex garantit l'unicité de `sequence` via une mutation transactionnelle (cf. `convex/audit.ts`).
- **Vérification** : la mutation `verifyAuditChain()` parcourt l'intégralité du journal et recalcule chaque hash pour détecter toute manipulation.
- **Sauvegarde** : la chaîne complète est exportée toutes les 24h vers un système séparé (out-of-band) pour empêcher toute tentative de réécriture coordonnée.
- **Index** : `by_sequence`, `by_horodatage`, `by_utilisateur`, `by_action`, `by_dossier`, `by_hash_courant`

## 3. Politique de classification et contrôle d'accès

| Niveau | Code | Rétention (EF-06.3) | Traçabilité consultation |
|---|---|---|---|
| Diffusion Restreinte | DR | 5 ans | Journal audit générique |
| Confidentiel Défense | CD | 10 ans | Journal audit générique |
| Secret Défense | SD | 30 ans | `consultations_dossier` individuelle |
| Très Secret Défense | TSD | 50 ans | `consultations_dossier` individuelle |

**Règle d'accès (EF-04.2)** :
```
accès(utilisateur, dossier) ssi
    ∃ habilitation h, h.utilisateurMatricule = utilisateur.matricule
    ∧ h.revoque = false
    ∧ now ∈ [h.valideAPartirDe, h.valideJusquA]
    ∧ h.classificationMax ≥ dossier.classification
    ∧ perimetre_couvre(h, dossier)
```

La fonction `perimetre_couvre(h, dossier)` retourne true ssi le dossier croise l'un des mots-clés, zones géographiques, domaines fonctionnels ou périodes de l'habilitation. L'implémentation détaillée fait l'objet de la Phase 2 (Prompt 2.1).

## 4. Cycle de vie d'un dossier — diagramme d'états

```
              ┌──────────────┐
        ────▶│ constitution │◀──────────────────────────────┐
              └──────┬───────┘                                │
                     │ soumission                             │ renvoi
                     ▼                                        │ (motif obligatoire)
              ┌──────────────────────┐                        │
              │ validation_section   │────────────────────────┤
              └──────┬───────────────┘                        │
                     │ visa chef de section                   │
                     ▼                                        │
              ┌──────────────────────┐                        │
              │ validation_direction │────────────────────────┤
              └──────┬───────────────┘                        │
                     │ signature qualifiée directeur          │
                     ▼                                        │
              ┌──────────────────────┐                        │
              │   transmis_cns       │                        │
              └──────┬───────────────┘                        │
                     │                                        │
        suspension ◀─┼─▶ reprise (gèle/dégèle les délais)     │
                     │                                        │
                     ▼                                        │
              ┌──────────────────────────────────────┐        │
              │ cloture_positif / cloture_negatif /  │        │
              │ cloture_administratif (IRRÉVERSIBLE) │        │
              └──────┬───────────────────────────────┘        │
                     │                                        │
                     ▼  versement automatique selon rétention │
              ┌──────────────────────┐                        │
              │      archive         │                        │
              └──────────────────────┘                        │
                                                              │
                              renvoye_incomplet ──────────────┘
```

## 5. Tables LEGACY — feuille de route de retrait

Les tables héritées d'`executif.ga` sont conservées pour permettre à l'UI existante de continuer à fonctionner pendant la transition. Plan de retrait :

| Phase | Tables à retirer |
|---|---|
| P2 (M3–M5) — auth iCNS | `users`, `userRoles` (remplacés par `utilisateurs`) |
| P2 — audit iCNS | `auditLogs` (remplacé par `journal_audit`) |
| P3 (M6–M8) — iDocument iCNS | `documents`, `documentFolders`, `documentFolderItems`, `documentHistory`, `documentTemplates`, `generatedDocuments`, `idoc*` |
| P3 — dossiers iCNS | `intelligenceReports`, `surveillanceTargets`, `threatIndicators`, `encryptedMessages` (fusionnés dans `dossiers_renseignement` + `pieces`) |
| P4 (M9–M11) — iCom | `incomingMails`, `icorr*` |
| P4 — Cockpit SG-CNS | `officialDecrees`, `legalReviews`, `administrativeArchives` |
| P5 (M12–M14) — iArchive | `iarch*` |
| Hors scope (à supprimer) | `nationalKpis`, `signalements`, `opinionPublique`, `presidentialDecisions`, `conversationSessions`, `conversationMessages`, `iastedConfig`, `budgetNational`, `chantiers`, `conseilMinistresSessions`, `decretsOrdonnances`, `decretComments`, `decretSignatures`, `analyticsVoiceEvents`, `roleFeedback`, `receptionVisitors` |

Le `knowledgeBaseDocuments` peut être conservé pour alimenter le moteur de croisement de la cellule CNS (Prompt 4.2).

## 6. Notes d'implémentation

- **Convex Reactive Queries** : les vues temps réel du Cockpit SG-CNS (Prompt 4.3) s'appuieront directement sur les index ci-dessus, sans matérialisation intermédiaire.
- **Champs `encrypted*`** : pendant la Phase 1 (M1–M2), aucune fonction de chiffrement n'est encore en place. Le code applicatif peut écrire le contenu en clair dans ces champs pour les besoins de développement local, à condition que l'environnement reste isolé (cf. ES-02.5 — aucune donnée réelle dans l'environnement de dev). Le branchement HSM/AES-256 sera réalisé en Phase 2 (Prompt 2.2).
- **Hash d'intégrité** : à recalculer à chaque mutation. Une fonction utilitaire centralisée sera fournie dans `convex/lib/integrity.ts` lors de l'implémentation des mutations (Prompt 3.2).
- **Indexes composés** : `by_service_statut` permet au cockpit SG-CNS de lister rapidement les dossiers en `transmis_cns` par service. D'autres indexes composés seront ajoutés au fur et à mesure des besoins de filtrage du Cockpit (Prompt 4.3) et de la cellule CNS (Prompt 4.2).

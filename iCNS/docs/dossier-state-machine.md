# Machine d'états du dossier de renseignement iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01) — Prompt 3.2
**Classification** : CONFIDENTIEL DÉFENSE — annexe métier

## 1. Vue d'ensemble

Un dossier de renseignement suit un parcours d'évaluation strict, paramétré par son `types_dossier`. Le statut courant est toujours l'une des 10 valeurs de l'énumération `StatutDossierValue` (cf. `convex/validators/classification.ts`).

```
                ┌──────────────┐
           ┌──▶ │ constitution │ ─────────────────────────┐
           │    └──────┬───────┘                          │
           │           │ soumettre_section                │ renvoyer_a_constitution
           │           ▼                                  │
           │    ┌──────────────────────┐                  │
           │    │ validation_section   │ ─────────────────┤
           │    └──────┬───────────────┘                  │
           │           │ soumettre_direction              │ renvoyer_a_section
           │           ▼                                  │
           │    ┌──────────────────────┐                  │
           │    │ validation_direction │ ─────────────────┤
           │    └──────┬───────────────┘                  │
           │           │ signer_et_transmettre            │
           │           │ (signature_directeur)            │
           │           ▼                                  │
           │    ┌──────────────────────┐                  │
           │    │   transmis_cns       │ ─── marquer_incomplet_par_cns
           │    └──────┬───────────────┘
           │           │ cloturer_positif / cloturer_negatif / cloturer_administratif
           │           │ (motif_cloture)
           │           ▼
           │    ┌──────────────────────┐
           │    │ cloture_*            │ (irréversible — EF-01.10)
           │    └──────┬───────────────┘
           │           │ archiver (auto par cron rétention)
           │           ▼
           │    ┌──────────────────────┐
           │    │      archive         │ (état final)
           │    └──────────────────────┘
           │
           └─── renvoye_incomplet ◀─── (depuis transmis_cns)
                      │ (le service reprend en constitution)
                      ▼
                      constitution
```

### 1.1. Suspension et reprise (EF-01.8)

Tout statut **non terminal** (`constitution`, `validation_section`, `validation_direction`, `transmis_cns`, `renvoye_incomplet`) peut être basculé en `suspendu` par un rôle autorisé (`directeur_service`, `sg_cns`, `rssi`).

Le statut `suspendu` est ré-éligible à `reprendre`, qui le ramène au statut précédent. Les délais cible (`types_dossier.parcours[].delaiCibleHeures`) sont gelés pendant la suspension.

## 2. Matrice rôle × statut → actions disponibles

Le code applicatif s'appuie sur `applicableActions(currentStatus, role)` exposé dans `convex/dossiers/state_machine.ts`. Voici la matrice de référence pour les rôles principaux :

| Statut | officier_traitant | chef_section | directeur_service | analyste_cns | sg_cns |
|---|---|---|---|---|---|
| `constitution` | soumettre_section + suspendre? | soumettre_section + suspendre | suspendre | — | — |
| `validation_section` | — | soumettre_direction + renvoyer_a_constitution + suspendre | renvoyer_a_constitution + suspendre | — | — |
| `validation_direction` | — | — | signer_et_transmettre + renvoyer_a_section + renvoyer_a_constitution + suspendre | — | — |
| `transmis_cns` | — | — | suspendre | marquer_incomplet_par_cns + suspendre | toutes clôtures + marquer_incomplet_par_cns + suspendre |
| `renvoye_incomplet` | (le dossier repart en constitution) | | | | |
| `suspendu` | — | — | reprendre | — | reprendre |
| `cloture_*` | — | — | — | — | archiver |

Notes :
- `directeur_service` peut suspendre depuis `constitution` uniquement si configuration le permet (rôle plus large dans ce module).
- Les rôles `rssi`, `auditeur` et `admin_technique` n'ont pas d'action métier ; ils ont des droits transverses (lecture journal, déverrouillage compte, etc.).

## 3. Exigences déclarées par transition (`requires`)

| Action | Exigences |
|---|---|
| `signer_et_transmettre` | `signature_directeur` (blob qualifié HSM) |
| `renvoyer_a_section` / `renvoyer_a_constitution` | `motif_renvoi` |
| `marquer_incomplet_par_cns` | `motif_renvoi` |
| `suspendre` | `motif_renvoi` (ré-utilisé comme motif de suspension) |
| `cloturer_*` | `motif_cloture` |
| `soumettre_section` / `soumettre_direction` / `reprendre` / `archiver` | aucune |

Les exigences sont vérifiées par les mutations dans `convex/dossiers/*` ; la machine d'états elle-même ne fait que déclarer leur présence.

## 4. Atomicité de la transmission (EF-01.6)

`transmettreDossier` (cf. `convex/dossiers/transmit.ts`) est **transactionnelle** :

1. patch du statut → `transmis_cns`
2. patch de l'étape courante → `terminee` motif `transmission`
3. insert dans `copies_classifiees` (snapshot chiffré read-only)
4. insert dans `journal_audit` (chaîné)

Si une étape échoue, **rien** n'est persisté (Convex OCC). En particulier, il n'existe **aucun chemin de code** où le dossier passe en `transmis_cns` sans qu'une copie classifiée soit créée.

## 5. Génération de la référence classifiée

À la création (`createDossier`), la référence est générée selon le pattern de `schemas_reference` :

- Exemple : `MP/2026/DGSS/TSD/0007`
  - `MP` : code du `types_dossier`
  - `2026` : année courante
  - `DGSS` : code service producteur (= service de l'utilisateur)
  - `TSD` : classification demandée
  - `0007` : séquence (`seqWidth` = 4 → pad sur 4 chiffres)

La séquence est calculée par comptage des dossiers existants avec le même préfixe. En cas de collision OCC (deux créations simultanées), Convex retente automatiquement la mutation et la séquence est incrémentée correctement.

## 6. Tests

Les invariants de la machine sont couverts par `tests/dossier_lifecycle.test.ts` :

- transitions nominales pour chaque rôle ;
- refus des actions non autorisées (notamment la signature qui exige strictement `directeur_service`) ;
- aucune sortie possible d'un statut terminal sauf `archiver` depuis `cloture_*` ;
- suspendre/reprendre depuis tous les statuts non terminaux ;
- présence des exigences (`requires`) sur les transitions sensibles.

## 7. Évolutions prévues (Phase 4 et au-delà)

- **Statut précédent** : actuellement la reprise depuis `suspendu` retourne en `constitution`. À enrichir en stockant `statutAvantSuspension` pour reprendre exactement où on était.
- **Délégation de signature** : possibilité pour un directeur d'autoriser un chef de section à signer en son absence (avec révocation tracée).
- **Workflow personnalisé par type** : étapes intermédiaires dynamiques (ex. revue juridique) selon `types_dossier.parcours`.
- **Évaluation BdC complète** : intégration du périmètre besoin-d'en-connaître pour la lecture (Phase 4, Prompt 4.2).

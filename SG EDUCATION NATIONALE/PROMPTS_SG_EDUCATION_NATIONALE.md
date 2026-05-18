# Suite de Prompts — Plateforme SG Éducation Nationale du Gabon

> **Contexte** : Plateforme centralisée des acteurs de l'Éducation Nationale gabonaise.
> Remontée d'informations : Établissements → SG → Ministre.
> Architecture : Réseau d'établissements (1 établissement = 1 compte), professionnels de l'éducation (1 pro = 1 compte).
>
> **Modalité d'exécution** : Exécuter les prompts dans l'ordre indiqué (Phase 0 → Phase 12). Chaque prompt est autonome mais s'appuie sur les précédents. Modifier l'architecture existante sans tout reconstruire.

---

## PHASE 0 — Audit & Préparation du Socle Existant

### Prompt 0.1 — Audit de l'architecture actuelle

```
Avant toute modification, effectue un audit complet de l'architecture existante du projet :

1. Liste exhaustive des modules présents (iDocument, iCorrespondance, iAsted, etc.) avec leur état (actif, deprecated, expérimental).
2. Schéma de la base de données actuelle : tables, relations, indexes, contraintes.
3. Système d'authentification existant : providers, RBAC, multi-tenancy déjà en place ou non.
4. Stack technique confirmée : framework backend, ORM, frontend, gestion d'état.
5. Patterns de workflow présents (RequestWorkflow, PTM multi-niveaux).
6. Conventions de nommage et structure des dossiers.

Produis un rapport `AUDIT_EXISTANT.md` avec :
- Ce qui est réutilisable tel quel
- Ce qui doit être étendu
- Ce qui doit être créé ex nihilo
- Les risques d'impact sur les modules existants
- Un diagramme de l'architecture cible (mermaid)

Ne modifie AUCUN code à ce stade. Rapport uniquement.
```

### Prompt 0.2 — Charte de nommage métier Éducation Nationale

```
Établis la charte de nommage métier pour la plateforme SG Éducation Nationale (men.ga).

Définis les entités-clés et leurs identifiants :
- Établissement (école, collège, lycée, université, CFP, école technique)
- Professionnel de l'éducation (enseignant, directeur, censeur, surveillant, agent admin)
- Circonscription (commune, département, province académique)
- Hiérarchie : Ministre → SG → Directions centrales → Inspections académiques → Établissements → Personnel

Génère un fichier `GLOSSAIRE_METIER.md` contenant :
1. Glossaire complet des termes (FR + sigles officiels gabonais : DGEPP, DGES, IGE, etc.)
2. Convention de nommage des tables (préfixe `edu_`)
3. Convention de nommage des comptes (ex : `etab-{code_etab}@men.ga`, `pro-{matricule}@men.ga`)
4. Codification des établissements (proposition basée sur la structure administrative gabonaise : Province-Département-Type-Numéro)
5. Codification des matricules personnel
6. Niveaux d'enseignement (préscolaire, primaire, collège, lycée général/technique, supérieur)

Aucune modification de code. Document métier uniquement.
```

---

## PHASE 1 — Modélisation des Données Centrale

### Prompt 1.1 — Schéma de base : Établissements

```
Crée le schéma de données du module `edu_establishments` selon la charte définie en Phase 0.

Table principale `edu_establishments` :
- id (UUID)
- code_men (string unique, ex : "EST-G1-LIB-LYC-001")
- denomination_officielle (string)
- denomination_courte (string)
- type_etablissement (enum : PRESCOLAIRE, PRIMAIRE, COLLEGE, LYCEE_GENERAL, LYCEE_TECHNIQUE, CFP, SUPERIEUR, AUTRE)
- statut_juridique (enum : PUBLIC, PRIVE_LAIC, PRIVE_CONFESSIONNEL, CONVENTIONNE)
- province, departement, commune, quartier
- coordonnees_gps (lat/lng)
- adresse_postale, telephone, email_officiel
- date_creation_etablissement
- inspection_rattachement (FK)
- chef_etablissement_id (FK vers edu_professionals)
- effectif_eleves_declare
- effectif_personnel_declare
- nombre_salles, capacite_accueil
- statut_activite (enum : OUVERT, FERME, EN_REHABILITATION, SUSPENDU)
- date_derniere_inspection
- account_id (FK vers identités — 1 établissement = 1 compte)
- created_at, updated_at, archived_at

Tables liées :
- `edu_establishment_documents` (statuts, autorisations, agréments)
- `edu_establishment_infrastructure` (bâtiments, salles, équipements)
- `edu_establishment_history` (changements de statut, fusions, fermetures)

Produis :
1. Le DDL SQL complet (PostgreSQL) avec contraintes, indexes, triggers d'audit
2. Les migrations dans le format du projet existant
3. Le modèle ORM correspondant
4. Les seeds pour les 9 provinces du Gabon et leurs inspections académiques

Respecte les conventions du projet existant identifiées en Phase 0.
```

### Prompt 1.2 — Schéma de base : Professionnels de l'éducation

```
Crée le schéma de données du module `edu_professionals` — chaque professionnel = 1 compte.

Table principale `edu_professionals` :
- id (UUID)
- matricule_men (string unique, ex : "PRO-1985-04-12345")
- numero_cnss, numero_cnamgs (optionnels)
- civilite, nom, prenoms, nom_jeune_fille
- date_naissance, lieu_naissance, nationalite
- piece_identite_type, piece_identite_numero
- email_pro, email_perso, telephone_pro, telephone_perso
- photo_id (FK storage)
- corps_metier (enum : ENSEIGNANT, DIRECTEUR, CENSEUR, SURVEILLANT_GENERAL, CONSEILLER_PEDA, INSPECTEUR, AGENT_ADMIN, AGENT_TECHNIQUE, AGENT_SANTE_SCOLAIRE)
- grade, echelon, indice
- diplomes (JSONB)
- specialites_enseignement (array : matières enseignées)
- niveau_enseignement (array)
- date_recrutement, date_titularisation
- type_contrat (enum : FONCTIONNAIRE, CONTRACTUEL, VACATAIRE, BENEVOLE)
- etablissement_actuel_id (FK)
- poste_actuel (string)
- date_affectation_actuelle
- statut_administratif (enum : EN_ACTIVITE, DETACHE, EN_DISPONIBILITE, EN_CONGE_LONGUE, EN_FORMATION, RETRAITE, DECEDE)
- account_id (FK vers identités — 1 pro = 1 compte)
- created_at, updated_at, archived_at

Tables liées :
- `edu_professional_assignments` (historique des affectations)
- `edu_professional_documents` (diplômes, actes, arrêtés)
- `edu_professional_disciplinary` (sanctions, récompenses)
- `edu_professional_formations` (formations continues suivies)

Livrables :
1. DDL SQL complet
2. Migrations
3. Modèle ORM
4. Seeds : grilles de grade fonction publique gabonaise + corps métiers officiels
5. Vue matérialisée `v_personnel_par_etablissement` pour requêtes rapides

Respecte la charte de nommage et les conventions du projet.
```

### Prompt 1.3 — Hiérarchie administrative & Rattachements

```
Modélise la hiérarchie administrative complète de l'Éducation Nationale gabonaise.

Tables :
- `edu_ministere` (singleton : Ministère de l'Éducation Nationale)
- `edu_directions_centrales` (DGEPP, DGES, DGAS, IGE, etc.)
- `edu_inspections_academiques` (par province + spécialisées)
- `edu_circonscriptions_scolaires` (sous-découpage des inspections)
- `edu_unites_rattachement` (table polymorphe liant un établissement ou un personnel à un nœud hiérarchique)

Modélise la relation :
Ministre → Cabinet → SG (Secrétariat Général) → Directions Centrales → Inspections → Circonscriptions → Établissements → Personnels

Chaque nœud doit pouvoir :
- Recevoir des remontées de ses subordonnés
- Émettre des instructions descendantes
- Avoir un responsable (FK vers edu_professionals)
- Définir ses propres règles de visibilité

Livrables :
1. DDL avec arbre hiérarchique (closure table ou ltree PostgreSQL)
2. Seeds complets de la structure officielle gabonaise (toutes les directions, toutes les inspections)
3. API de requêtage : `get_ancestors(node_id)`, `get_descendants(node_id)`, `get_visible_establishments(user_id)`
4. Diagramme mermaid de la hiérarchie

Aucun établissement, aucun personnel ne doit exister sans rattachement hiérarchique valide.
```

---

## PHASE 2 — Authentification & Comptes

### Prompt 2.1 — Système de comptes : 1 entité = 1 compte

```
Étends le système d'authentification existant pour supporter le modèle "1 entité = 1 compte".

Règles :
- Chaque établissement possède un compte institutionnel (email du type `etab-{code}@men.ga`)
- Chaque professionnel possède un compte personnel (email `pro-{matricule}@men.ga` + email perso optionnel)
- Un compte établissement peut avoir plusieurs délégataires (chef d'établissement + censeur + secrétaire pédagogique)
- Un compte pro peut être délégataire de plusieurs comptes établissement (cas d'un inspecteur)

Implémente :
1. Type de compte : `ACCOUNT_TYPE` (ETABLISSEMENT, PROFESSIONNEL, INSPECTION, DIRECTION_CENTRALE, CABINET, SG, MINISTRE, SYSTEM)
2. Table `edu_account_delegations` : qui peut agir au nom de qui, avec quelles permissions, sur quelle période
3. Workflow d'activation des comptes :
   - Création initiale par le SG / Inspection (compte provisoire)
   - Première connexion → vérification d'identité → activation
   - Régénération possible des credentials (mot de passe perdu)
4. Politique de mots de passe stricte (12+ caractères, MFA obligatoire pour Inspection et au-dessus)
5. Audit complet : `edu_account_audit_log` (connexions, créations, délégations, désactivations)

Livrables :
- Migrations + modèles
- Endpoints API : `/auth/account/activate`, `/auth/delegations/grant`, `/auth/delegations/revoke`
- Documentation `AUTH_MODEL.md` avec schémas de séquence
```

### Prompt 2.2 — RBAC : Rôles et permissions multi-niveaux

```
Définis le système de rôles et permissions (RBAC + ABAC) de la plateforme.

Rôles institutionnels (du plus élevé au plus bas) :
1. MINISTRE — vision totale, droit d'arbitrage final
2. DIRECTEUR_CABINET — pré-traitement des dossiers Ministre
3. SECRETAIRE_GENERAL — orchestration centrale, vision totale opérationnelle
4. SG_ADJOINT — délégué SG
5. DIRECTEUR_CENTRAL — vision sur son domaine (DGEPP, DGES, etc.)
6. INSPECTEUR_GENERAL — contrôle transversal
7. INSPECTEUR_ACADEMIQUE — vision sur sa province
8. CHEF_CIRCONSCRIPTION — vision sur sa circonscription
9. CHEF_ETABLISSEMENT — vision sur son établissement
10. CENSEUR / SURVEILLANT_GENERAL — vision opérationnelle établissement
11. ENSEIGNANT — vision sur ses classes
12. AGENT_ADMIN — vision restreinte selon rôle
13. CITOYEN_OBSERVATEUR — accès aux statistiques publiques (futur)

Permissions atomiques (exemples) :
- `establishment.read.own`, `establishment.read.subordinates`, `establishment.read.all`
- `professional.create`, `professional.assign`, `professional.discipline`
- `report.submit`, `report.validate`, `report.consolidate`, `report.broadcast`
- `dossier.create`, `dossier.transmit`, `dossier.archive`
- `kpi.view.establishment`, `kpi.view.province`, `kpi.view.national`

Implémente :
1. Matrice rôle × permission (table `edu_role_permissions`)
2. Politique ABAC : un INSPECTEUR ne voit que les établissements de sa province (filtre automatique)
3. Décorateurs / middlewares de vérification
4. Endpoint `/me/permissions` qui retourne les permissions effectives
5. Page admin : gestion des rôles personnalisés

Livrables : migrations, code, matrice CSV `MATRICE_RBAC.csv`, documentation.
```

---

## PHASE 3 — Réseau des Établissements

### Prompt 3.1 — Module Réseau des Établissements

```
Implémente le module `network` qui matérialise le réseau des établissements de l'Éducation Nationale.

Fonctionnalités :
1. **Annuaire national des établissements** : recherche multi-critères (province, type, statut, niveau, effectif, géolocalisation)
2. **Fiche établissement** publique (limitée) et institutionnelle (complète)
3. **Carte interactive** des établissements (Leaflet ou Mapbox) avec clustering par province
4. **Tableau de bord établissement** (vue chef d'établissement) :
   - Effectifs élèves & personnel
   - Indicateurs pédagogiques
   - Dossiers en cours
   - Communications reçues du SG / Inspection
   - Calendrier des inspections prévues
5. **Workflow d'enrôlement d'un nouvel établissement** :
   - Création par Inspection (statut PROVISOIRE)
   - Activation du compte par le SG
   - Première mise à jour de fiche par chef d'établissement
   - Validation par Inspection
   - Passage en statut OPERATIONNEL
6. **Mise à jour annuelle obligatoire** des fiches (campagne de rentrée scolaire)

Composants UI à créer :
- `<EstablishmentDirectory />` (page annuaire)
- `<EstablishmentCard />` (carte récap)
- `<EstablishmentDetailPage />`
- `<EstablishmentMap />`
- `<EstablishmentDashboard />` (vue chef)
- `<EstablishmentEnrollmentWizard />` (assistant de création)

Backend : endpoints REST/GraphQL conformes au standard du projet.
Tests : couvrir au minimum les workflows de création, mise à jour, recherche, archivage.
```

### Prompt 3.2 — Géolocalisation & couverture territoriale

```
Ajoute la couche géospatiale au module réseau.

Objectifs :
1. Chaque établissement a des coordonnées GPS validées (PostGIS si disponible)
2. Calcul automatique des distances entre établissements
3. Analyse de couverture : taux de scolarisation théorique par zone (établissement le plus proche, capacité résiduelle)
4. Identification des "zones blanches" éducatives
5. Export cartographique pour le Ministre (carte des sous-effectifs / sur-effectifs)

Livrables :
- Migration PostGIS + index géospatial
- Service `GeographicCoverageService` avec méthodes :
  - `findNearestEstablishments(lat, lng, type, radius_km)`
  - `getCoverageScore(province_id)`
  - `getCapacitySaturation(establishment_id)`
  - `identifyWhiteZones(province_id, threshold_km)`
- Composant `<CoverageHeatmap />`
- Job nocturne de recalcul des indicateurs de couverture
- Documentation `GEOSPATIAL.md`
```

---

## PHASE 4 — Gestion du Personnel de l'Éducation

### Prompt 4.1 — Module Personnel : Annuaire et profils

```
Implémente le module `personnel` — la matérialisation "1 professionnel = 1 compte".

Fonctionnalités :
1. **Annuaire national du personnel** (visibilité selon RBAC)
2. **Fiche professionnelle** complète :
   - État civil + identifiants administratifs
   - Carrière (recrutement → affectations successives → grade)
   - Diplômes et formations
   - Spécialités d'enseignement
   - Évaluations annuelles
   - Documents officiels (arrêtés, actes)
3. **Workflow d'enrôlement d'un nouveau personnel** :
   - Création par Inspection ou DGRH
   - Affectation initiale à un établissement
   - Activation du compte personnel
   - Première connexion → complétion du profil → validation
4. **Mobilité du personnel** :
   - Demande de mutation (workflow : pro → chef étab → inspection → SG → arrêté)
   - Affectation forcée (top-down depuis SG)
   - Détachement / mise à disposition
5. **Validation des mises à jour** : un agent ne peut pas modifier seul son grade, son matricule, ou son corps — cela passe par un workflow validé

Composants UI :
- `<PersonnelDirectory />`
- `<PersonnelProfile />` (vue auto)
- `<PersonnelInstitutionalProfile />` (vue Inspection/SG)
- `<MobilityRequestForm />`
- `<AssignmentTimeline />` (frise chronologique des affectations)

Backend : endpoints + workflows + jobs de notification.
```

### Prompt 4.2 — Présence, services et activité

```
Ajoute la couche "activité quotidienne" pour le personnel.

Fonctionnalités :
1. **Service hebdomadaire** : emploi du temps déclaré, heures effectives
2. **Présence/absence** (relevé par chef d'établissement, mensuel) :
   - Présence normale
   - Absence justifiée (congé, mission, maladie)
   - Absence injustifiée (déclenche alerte vers Inspection)
3. **Congés** : workflow de demande → validation chef → validation inspection
4. **Missions** : ordre de mission, frais, rapport de mission
5. **Sanctions disciplinaires** : workflow strict avec procès-verbal, droits de la défense, archivage

Tables :
- `edu_professional_schedule`
- `edu_professional_attendance` (par mois)
- `edu_leave_requests`
- `edu_mission_orders`
- `edu_disciplinary_proceedings`

Alertes automatiques :
- Absence injustifiée > 3 jours → notification Inspection
- Taux d'absence > 20% sur un mois → alerte SG
- Sanction de niveau 3+ → notification SG obligatoire

Livrables : modèles, workflows, jobs, dashboards.
```

---

## PHASE 5 — Système de Remontée d'Informations (Reporting)

### Prompt 5.1 — Modèle de remontées (dossiers)

```
Conçois et implémente le **moteur de remontée d'informations** qui est le cœur de la plateforme.

Principes :
1. Une remontée = un "dossier" typé qui transite dans la hiérarchie selon un workflow
2. Origine : un établissement (le plus souvent) ou un personnel
3. Destination finale : SG ou Ministre, selon le type
4. Traçabilité totale : qui a vu, qui a annoté, qui a validé, qui a transmis, quand

Réutilise le pattern **RequestWorkflow (12 statuts)** du projet existant et adapte-le à l'Éducation Nationale.

Types de dossiers à supporter dès la V1 :
- `RAPPORT_RENTREE` (rapport de rentrée scolaire — campagne annuelle)
- `RAPPORT_TRIMESTRIEL` (rapport pédagogique trimestriel)
- `INCIDENT_ETABLISSEMENT` (incident grave : violence, accident, sinistre)
- `DEMANDE_MATERIEL` (demande d'équipement / mobilier)
- `DEMANDE_PERSONNEL` (demande d'affectation de personnel)
- `RECLAMATION_PARENT` (transmise par chef d'établissement)
- `ALERTE_INFRASTRUCTURE` (bâtiment dangereux, inondation, etc.)
- `RAPPORT_INSPECTION` (rapport d'une visite d'inspection)
- `STATISTIQUE_MENSUELLE` (effectifs, présences, etc.)
- `DOSSIER_DISCIPLINAIRE` (élève ou personnel)

Pour chaque type :
- Schéma de données dédié
- Workflow propre (étapes, validations, délais SLA)
- Documents annexes attendus
- Visibilité / confidentialité

Livrables :
1. Table mère `edu_dossiers` + tables filles par type
2. Moteur de workflow réutilisé du projet existant
3. Matrice "Type × Étape × Acteur autorisé"
4. Système de notifications (email + in-app)
5. SLA et alertes d'escalade automatique
6. Documentation `WORKFLOW_DOSSIERS.md`
```

### Prompt 5.2 — Campagnes de remontée

```
Implémente le système de **campagnes** : remontées massives synchronisées (rentrée, examens, fin d'année).

Une campagne =
- Un type de remontée
- Un périmètre (tous les établissements / une province / un type)
- Une fenêtre temporelle (date d'ouverture / date de clôture)
- Un template de formulaire
- Un suivi de complétion en temps réel

Cas d'usage prioritaires :
1. **Campagne de rentrée** (septembre) : effectifs élèves, personnel présent, matériel disponible
2. **Campagne trimestrielle** : résultats académiques, taux de réussite, taux de présence
3. **Campagne effectifs** (mensuelle) : variations d'effectifs
4. **Campagne examens** : inscriptions, résultats, taux de réussite

Fonctionnalités :
- Lancement d'une campagne par le SG ou Direction Centrale
- Notification automatique à tous les établissements concernés
- Relances automatiques aux retardataires (J-5, J-2, J-0, J+1, J+3)
- Tableau de bord SG : taux de complétion en temps réel, par province, par inspection
- Consolidation automatique des résultats
- Export pour le Ministre dès la clôture

Livrables :
- Tables `edu_campaigns`, `edu_campaign_responses`
- Composant `<CampaignBuilder />` (création par SG)
- Composant `<CampaignFillForm />` (remplissage par chef étab)
- Composant `<CampaignProgressDashboard />`
- Jobs de relance + consolidation
- Templates pré-configurés (rentrée, trimestriel, etc.)
```

### Prompt 5.3 — Transmission, annotation, validation

```
Implémente le moteur de transmission des dossiers entre niveaux hiérarchiques.

Chaque dossier suit un chemin : Émetteur → Validateur N1 → Validateur N2 → ... → Destinataire final.

Fonctionnalités requises :
1. **Bordereau de transmission** : généré automatiquement à chaque transmission, signé électroniquement
2. **Annotation** : chaque acteur peut annoter (privée ou visible) avant transmission
3. **Validation / Rejet** : un dossier peut être rejeté et retourné à l'émetteur avec motif
4. **Demande de complément** : un validateur peut demander des pièces complémentaires
5. **Délégation temporaire** : un agent absent peut déléguer sa validation
6. **Escalade automatique** : si délai SLA dépassé, le dossier monte au niveau N+1
7. **Traçabilité complète** : journal d'audit immuable

Réutilise le pattern PTM multi-niveaux (sgg.ga) du projet existant.

Composants UI :
- `<DossierInbox />` (boîte de réception par acteur)
- `<DossierDetailView />` avec timeline complète
- `<DossierAnnotationPanel />`
- `<TransmissionAction />` (bouton + modal de transmission)
- `<DossierAuditLog />` (journal des actions)

Backend :
- Endpoints : `/dossiers/:id/transmit`, `/dossiers/:id/annotate`, `/dossiers/:id/reject`, `/dossiers/:id/request-info`
- Service `DossierWorkflowEngine`
- Jobs : escalade SLA, relances
```

---

## PHASE 6 — Espace SG (Secrétariat Général)

### Prompt 6.1 — Tableau de bord SG

```
Construis l'espace de travail du Secrétaire Général — le cockpit central de la plateforme.

Vue d'accueil SG :
1. **Indicateurs nationaux temps réel** :
   - Nombre total d'établissements actifs / par type / par province
   - Effectif total personnel en activité
   - Nombre de dossiers en cours / en retard / clos ce mois
   - Taux de complétion des campagnes en cours
   - Alertes critiques non traitées
2. **Carte nationale interactive** :
   - Densité d'établissements
   - Zones d'alerte (incidents récents, sous-effectifs)
3. **File "À traiter par moi"** :
   - Dossiers en attente de transmission au Ministre
   - Dossiers en attente d'arbitrage SG
   - Demandes d'instruction
4. **Vue "Pulse" par province** :
   - Choisir une province → voir l'état complet (établissements, personnel, dossiers, alertes)
5. **Lanceur de campagne** : démarrer une nouvelle campagne de remontée
6. **Tableau des escalades** : ce qui aurait dû être traité plus bas mais est remonté

Composants :
- `<SGDashboard />` (page racine)
- `<NationalKpiBar />`
- `<NationalAlertFeed />`
- `<SGInbox />`
- `<ProvinceDrillDown />`

Performance : le dashboard doit charger en moins de 2 secondes pour les KPI principaux (cache + matérialisation).
```

### Prompt 6.2 — Outils d'arbitrage et de pilotage

```
Implémente les outils d'arbitrage et d'instruction du SG.

Fonctionnalités :
1. **Émission d'instructions descendantes** :
   - Note de service nationale (vers tous les établissements)
   - Note de service ciblée (par province, par type d'établissement)
   - Circulaire ministérielle (préparée par SG, signée par Ministre)
2. **Demandes d'enquête** : déclenchement d'une enquête de l'IGE sur un établissement
3. **Saisine d'une Direction Centrale** : confier un dossier à une Direction pour instruction
4. **Préparation de dossier Ministre** :
   - Compilation d'un dossier complet (note synthèse + pièces)
   - Recommandation SG
   - Transmission au cabinet Ministre
5. **Réponse aux saisines externes** : courriers entrants au Ministère qui atterrissent au SG

Tables :
- `edu_sg_instructions`
- `edu_sg_enquetes`
- `edu_sg_saisines`
- `edu_minister_briefing_packs`

Composants :
- `<InstructionComposer />` (éditeur riche + diffusion ciblée)
- `<EnqueteLauncher />`
- `<MinisterBriefingBuilder />`

Workflow strict : toute instruction nationale doit être contre-signée par un SG_ADJOINT avant diffusion.
```

---

## PHASE 7 — Espace Ministre

### Prompt 7.1 — Cabinet du Ministre & Vue exécutive

```
Construis l'espace Ministre — vision stratégique, pas opérationnelle.

L'écran d'accueil Ministre est volontairement épuré et stratégique :

1. **3-5 KPI nationaux clés** (gros chiffres) :
   - Effectif scolarisé national
   - Taux de réussite global aux examens
   - Couverture territoriale (% communes avec établissement opérationnel)
   - Indice de satisfaction (calculé sur remontées)
   - Budget exécuté vs alloué (si module budget connecté)
2. **Pulse hebdomadaire** : 1 page synthèse, générée chaque vendredi par le SG
3. **Dossiers signalés Ministre** : ceux préparés par SG avec recommandation
4. **Alertes critiques** : incidents graves, crises
5. **Agenda ministériel** : visites, inspections programmées, événements

Composants :
- `<MinisterCockpit />`
- `<MinisterWeeklyPulse />`
- `<MinisterSignalsFeed />`
- `<MinisterCriticalAlerts />`

Filtres et drill-down : depuis chaque KPI, possibilité de descendre dans le détail (province → établissement) — mais en mode lecture, sans action opérationnelle.

Génération automatique d'un "Brief matinal du Ministre" envoyé chaque jour à 7h (PDF synthèse + lien plateforme).
```

### Prompt 7.2 — Outils de décision Ministre

```
Implémente les outils de décision et signature électronique du Ministre.

Fonctionnalités :
1. **Validation de dossier** : signature électronique d'un dossier remonté par le SG
2. **Émission d'arrêtés** : workflow Ministre → publication → notification
3. **Audience et instructions** : compte-rendu d'audiences, instructions verbales formalisées
4. **Conseil hebdomadaire** : agenda + relevé de décisions
5. **Communication présidentielle** : transmission d'un dossier vers la Présidence (workflow externe)

Sécurité :
- MFA obligatoire à chaque signature
- Signature qualifiée (eIDAS-like) si infrastructure disponible
- Horodatage cryptographique de chaque acte

Livrables : modèles, workflows, composants UI, intégration signature électronique (ex : DocuSign / Lumin / module interne).
```

---

## PHASE 8 — Gestion Documentaire Centralisée

### Prompt 8.1 — Coffre-fort documentaire

```
Implémente le coffre-fort documentaire de la plateforme.

Réutilise et étends le module **iDocument** existant.

Types de documents gérés :
- Documents officiels (arrêtés, décrets, circulaires)
- Actes administratifs personnel (recrutement, titularisation, mutation)
- Documents établissement (statuts, agréments, plans, photos)
- Documents pédagogiques (programmes, manuels)
- Pièces justificatives des dossiers
- Procès-verbaux (conseils, inspections, examens)

Fonctionnalités :
1. **Stockage chiffré** + signature numérique
2. **Versioning** : un document a un historique de versions
3. **Métadonnées riches** : auteur, signataires, mots-clés, classification (PUBLIC, INTERNE, CONFIDENTIEL, SECRET)
4. **Recherche full-text** + recherche par métadonnées (OCR sur PDF scannés)
5. **Politique de rétention** : durée légale par type, archivage automatique, purge contrôlée
6. **Permissions granulaires** : qui peut lire, télécharger, partager, imprimer
7. **Traçabilité** : qui a consulté quoi, quand
8. **Partage temporaire** : lien expirant signé

Tables :
- `edu_documents`
- `edu_document_versions`
- `edu_document_signatures`
- `edu_document_access_log`
- `edu_document_shares`

Intégration : module **iCorrespondance** existant pour les pièces jointes des courriers.
```

### Prompt 8.2 — Bibliothèque pédagogique nationale

```
Crée le module "bibliothèque pédagogique" — ressources pédagogiques officielles validées.

Objectifs :
- Centraliser les programmes officiels (par niveau, par matière)
- Référencer les manuels agréés
- Permettre aux enseignants d'accéder à des ressources pédagogiques validées
- Permettre aux inspecteurs de diffuser des fiches méthodologiques

Fonctionnalités :
- Catalogue avec recherche multi-facettes (niveau, matière, type)
- Workflow de validation pédagogique (proposition → inspecteur de matière → DGEPP → publication)
- Téléchargement et statistiques d'usage
- Évaluation par les enseignants (étoiles + commentaires modérés)
- Suggestion de ressources complémentaires

Sécurité : seuls les contenus validés sont publiés. Aucun contenu utilisateur n'est public sans validation.
```

---

## PHASE 9 — Communication & Workflow Transversal

### Prompt 9.1 — Messagerie institutionnelle

```
Implémente la messagerie institutionnelle interne.

Caractéristiques :
- Messagerie **asynchrone** institutionnelle (≠ messagerie instantanée temps réel)
- Compatible avec le pattern courrier officiel (avec accusé de réception, signature)
- Réutilise le module **iCorrespondance** existant
- Conversation = thread officiel (peut générer un PDF "fil de discussion" archivable)
- Destinataires : individus, fonctions (ex : "tous les chefs d'établissement de l'Estuaire"), groupes

Fonctionnalités :
- Composeur riche avec pièces jointes
- Confidentialité (chiffré côté serveur, accès logué)
- Modèles de courrier institutionnel (note, demande, transmission)
- Délégation : un agent peut autoriser un assistant à lire sa boîte
- Recherche puissante (expéditeur, destinataire, date, mots-clés, pièce jointe)
- Statut : non lu, lu, traité, classé, archivé
- Conformité au format **RequestWorkflow** pour escalade automatique
```

### Prompt 9.2 — Notifications, alertes, abonnements

```
Implémente le système unifié de notifications et alertes.

Canaux :
- In-app (priorité 1)
- Email (priorité 2)
- SMS (priorité 3, réservé aux alertes critiques)
- Push web (priorité 4, optionnel)

Types d'événements notifiables :
- Nouveau dossier reçu
- Transmission attendue (rappel)
- SLA bientôt dépassé
- Campagne ouverte / clôturée
- Note de service nationale
- Alerte critique (incident grave)
- Validation/rejet d'un de mes dossiers
- Mention dans une annotation

Fonctionnalités :
- Préférences par utilisateur (par type d'événement × par canal)
- Règles d'abonnement automatique (ex : un Inspecteur est automatiquement abonné à tout incident de sa province)
- Centre de notifications avec marquage "vu / non vu"
- Digest quotidien optionnel (résumé du jour 18h)
- Alertes critiques bypassent les préférences (toujours envoyées tous canaux disponibles)

Tables : `edu_notifications`, `edu_notification_preferences`, `edu_alert_rules`.
```

---

## PHASE 10 — Statistiques, KPI, Analytics

### Prompt 10.1 — Indicateurs nationaux

```
Construis le moteur d'indicateurs nationaux de l'Éducation Nationale.

Indicateurs prioritaires (à calculer automatiquement) :
1. **Indicateurs d'effectifs** :
   - Effectif total scolarisé (par niveau, sexe, province)
   - Ratio élèves/enseignant (par établissement, par circonscription)
   - Évolution annuelle
2. **Indicateurs de couverture** :
   - Taux brut de scolarisation
   - Taux net de scolarisation
   - Indice de parité fille/garçon
3. **Indicateurs de réussite** :
   - Taux de passage en classe supérieure
   - Taux de réussite aux examens nationaux (CEP, BEPC, BAC)
   - Taux de redoublement, d'abandon
4. **Indicateurs RH** :
   - Taux d'absentéisme du personnel
   - Pyramide des âges
   - Couverture statutaire (titulaires vs vacataires)
5. **Indicateurs de qualité** :
   - Score d'inspection moyen
   - Délai moyen de traitement des dossiers
   - Taux de complétion des campagnes

Implémentation :
- Vues matérialisées + jobs de rafraîchissement
- Service `IndicatorEngine` avec API : `getIndicator(code, scope, period)`
- Composant générique `<IndicatorWidget />` (gros chiffre + tendance + sparkline)
- Page `/statistiques` filtrable
- Export CSV / Excel / PDF de tableaux statistiques
- Conformité aux nomenclatures UNESCO / ISCED (pour comparaisons internationales)

Documentation : `INDICATEURS.md` avec définition précise de chaque indicateur (formule, sources, limites).
```

### Prompt 10.2 — Rapports automatisés

```
Implémente la génération automatique de rapports périodiques.

Rapports à générer :
1. **Rapport hebdomadaire SG** (généré chaque vendredi 16h)
   - Synthèse de la semaine : dossiers traités, alertes, KPI clés
2. **Brief quotidien Ministre** (chaque jour 7h)
   - 1 page : 3-5 chiffres + 2-3 dossiers signalés
3. **Rapport mensuel par province** (premier lundi du mois)
4. **Rapport annuel de l'Éducation Nationale** (assistant guidé pour fin d'année)
5. **Rapport d'inspection** (pour chaque inspection terminée)

Caractéristiques :
- Templates personnalisables (avec logo officiel)
- Génération PDF + version HTML interactive
- Diffusion automatique aux destinataires configurés
- Signature électronique du rapport
- Archivage automatique au coffre-fort

Stack technique :
- Moteur de template (Handlebars / Jinja-like)
- Génération PDF (Puppeteer / wkhtmltopdf)
- Scheduler robuste (avec retry)
- Composant `<ReportBuilder />` pour créer des templates personnalisés
```

---

## PHASE 11 — Sécurité, Audit, Conformité

### Prompt 11.1 — Audit complet & traçabilité

```
Renforce la couche d'audit et de traçabilité.

Exigences :
1. **Toute action sensible est loguée** dans une table immuable (`edu_audit_log`) :
   - Connexions / déconnexions
   - Créations / modifications / suppressions de dossiers
   - Transmissions et validations
   - Accès à des documents confidentiels
   - Modifications de permissions
   - Changements de statut d'établissement / personnel
2. **Append-only** : pas de modification ni de suppression des entrées d'audit
3. **Signature en chaîne** (hash N = hash(N-1) + payload) pour détecter altération
4. **Export audit** réservé au SG et à l'IGE
5. **Tableau de bord audit** : visualisation des actions sensibles, détection d'anomalies
6. **Alertes de sécurité** :
   - Connexion depuis IP inhabituelle
   - Multiples échecs d'authentification
   - Téléchargement massif inhabituel
   - Modification de rôle anormale

Conformité :
- Référentiel RGS (France) / référentiels gabonais si existants
- Préparation d'une "data protection impact assessment" pour données personnelles
- Politique de rétention des données personnelles conformes loi 001/2011 du Gabon (protection données)
```

### Prompt 11.2 — Protection des données personnelles

```
Mets en conformité la plateforme avec la protection des données personnelles.

Actions :
1. **Cartographie des traitements** : pour chaque table contenant des données personnelles, documenter la finalité, la base légale, la durée de conservation, les destinataires
2. **Droits des personnes** :
   - Droit d'accès (export complet de ses données par tout pro)
   - Droit de rectification (workflow de demande de correction)
   - Droit à l'effacement limité (impossible pour données institutionnelles, possible pour données accessoires)
3. **Minimisation** : revue de toutes les tables pour supprimer les champs non strictement nécessaires
4. **Pseudonymisation** des données dans les environnements non-prod
5. **Politique de mot de passe** + MFA obligatoire pour rôles sensibles
6. **Chiffrement** :
   - En transit (TLS 1.3)
   - Au repos (chiffrement disque + chiffrement applicatif pour champs sensibles)
7. **Notification de violation** : procédure interne en cas de fuite

Documents à produire :
- `REGISTRE_TRAITEMENTS.md`
- `POLITIQUE_DONNEES.md`
- `PROCEDURE_BREACH.md`
```

---

## PHASE 12 — Mise en Production & Adoption

### Prompt 12.1 — Plan de bascule par cohortes

```
Conçois le plan de déploiement progressif de la plateforme.

Phases d'adoption proposées :
1. **Pilote (3 mois)** : 1 province (suggéré : Estuaire) + Cabinet Ministre + SG + 2-3 Directions Centrales
2. **Vague 1 (3 mois)** : 4 provinces supplémentaires
3. **Vague 2 (3 mois)** : 4 dernières provinces
4. **Consolidation (3 mois)** : tous les acteurs onboardés, désactivation des anciens canaux

Pour chaque phase, prépare :
- Plan de communication interne
- Calendrier de formation (par rôle)
- Support de formation (guides PDF, vidéos courtes, parcours e-learning)
- Plan de migration de données (import depuis fichiers Excel existants)
- Plan de support utilisateur (hotline, ticketing, FAQ)
- Indicateurs d'adoption (taux de comptes activés, taux d'usage actif, NPS)

Livrables :
- `PLAN_DEPLOIEMENT.md`
- Templates de communication
- Parcours de formation par rôle (chef étab, enseignant, inspecteur, SG)
- Scripts de migration de données
```

### Prompt 12.2 — Onboarding utilisateurs

```
Implémente les parcours d'onboarding par rôle.

Pour chaque rôle (chef étab, enseignant, inspecteur, SG, etc.) :
1. **Premier accès** : guide interactif (tour produit step-by-step)
2. **Checklist de complétion** : tâches à faire pour activer pleinement son compte (compléter profil, vérifier rattachement, etc.)
3. **Modules de formation contextuelle** : tutoriels intégrés
4. **Base de connaissance** intégrée (`/aide`) avec recherche
5. **Demande d'assistance** : ticket vers le support

Composants :
- `<OnboardingTour />` (lib type Intro.js)
- `<CompletionChecklist />`
- `<HelpCenter />`
- `<SupportTicketForm />`

Mesure : suivi du taux d'achèvement de l'onboarding par rôle, identification des points de friction.
```

### Prompt 12.3 — Recette, performance, montée en charge

```
Plan de recette et tests de charge avant déploiement national.

Tests à mener :
1. **Tests fonctionnels** : couvrir chaque workflow critique avec scénarios end-to-end
2. **Tests de charge** : simuler 10 000 utilisateurs simultanés en période de rentrée
3. **Tests de sécurité** : audit OWASP, pentest, revue des permissions
4. **Tests de résilience** : panne base, panne réseau, restauration
5. **Tests d'accessibilité** : WCAG 2.1 AA (établissements en zone reculée avec faible débit)
6. **Tests mobiles** : conception responsive vérifiée sur smartphones bas/moyen de gamme
7. **Tests de migration** : import des données historiques sans perte

Livrables :
- `PLAN_RECETTE.md` avec matrice de tests
- Rapports de tests de charge avec recommandations d'infrastructure
- Rapport d'audit sécurité
- Plan de remédiation des écarts

Critères de Go/No-Go pour mise en production :
- 100% des scénarios critiques passent
- 0 vulnérabilité critique ou haute non résolue
- Temps de réponse P95 < 1.5s sur les pages principales
- Capacité validée pour pic de rentrée (×10 trafic nominal)
```

---

## Annexe A — Modules existants à étendre vs à créer

| Module existant | Action | Détail |
|---|---|---|
| iDocument | Étendre | Ajouter typologie documents EN |
| iCorrespondance | Étendre | Patterns courrier institutionnel |
| iAsted | Évaluer | Pertinence pour EN à confirmer |
| RequestWorkflow (12 statuts) | Réutiliser | Moteur dossiers EN |
| PTM multi-niveaux (sgg.ga) | Réutiliser | Hiérarchie de validation |
| Auth core | Étendre | Comptes établissement + délégations |
| **(nouveau)** edu_establishments | Créer | Phase 1.1 |
| **(nouveau)** edu_professionals | Créer | Phase 1.2 |
| **(nouveau)** edu_dossiers | Créer | Phase 5.1 |
| **(nouveau)** edu_campaigns | Créer | Phase 5.2 |

---

## Annexe B — Ordre d'exécution recommandé

```
P0.1 → P0.2 → P1.1 → P1.2 → P1.3
     → P2.1 → P2.2
     → P3.1 → P3.2
     → P4.1 → P4.2
     → P5.1 → P5.2 → P5.3
     → P6.1 → P6.2
     → P7.1 → P7.2
     → P8.1 → P8.2
     → P9.1 → P9.2
     → P10.1 → P10.2
     → P11.1 → P11.2
     → P12.1 → P12.2 → P12.3
```

Estimation : 12 à 18 mois en équipe de 4-6 développeurs + 1 PO + 1 designer + appui métier (DSI Ministère).

---

## Annexe C — Glossaire rapide

- **SG** : Secrétariat Général / Secrétaire Général du Ministère
- **DGEPP** : Direction Générale de l'Enseignement Pré-scolaire et Primaire
- **DGES** : Direction Générale de l'Enseignement Secondaire
- **DGAS** : Direction Générale des Affaires Sociales
- **IGE** : Inspection Générale de l'Éducation
- **CFP** : Centre de Formation Professionnelle
- **CEP / BEPC / BAC** : examens nationaux
- **MEN** : Ministère de l'Éducation Nationale

---

*Fin de la suite de prompts. Chaque prompt est conçu pour être autonome et exécutable séquentiellement avec Claude Code ou tout assistant IA capable d'écrire du code structuré.*

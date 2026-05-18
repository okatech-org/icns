# iCNS — Spécification Fonctionnelle Complète

## Projet : Conseil National de Sécurité (CNS) — République Gabonaise
## Version : 1.0 — Mai 2026
## Statut : Document de référence — CLASSIFIÉ
## Niveau de classification du document : CONFIDENTIEL DÉFENSE

---

## 1. Vision et Positionnement

### 1.1. Définition

**iCNS** (i-Conseil National de Sécurité) est la plateforme souveraine de **collecte, de coordination et de synthèse du renseignement national**. Elle constitue l'outil de travail du Conseil National de Sécurité (CNS), placé sous l'autorité du **Président de la République** et opéré au quotidien par le **Secrétaire Général du CNS**.

iCNS centralise les informations sensibles (dossiers, notes, fiches, rapports, signalements) produites par l'ensemble des services de renseignement, des forces de défense et de sécurité, et des administrations de sécurité de la République Gabonaise. Elle organise leur remontée, leur traitement, leur analyse croisée et la production de synthèses stratégiques pour la plus haute autorité de l'État.

Le module **iCorrespondance** — réinstancié dans un environnement de haute sécurité — est le mécanisme de **transmission officielle et tracée** des dossiers entre services et vers le CNS. Chaque transmission a valeur de note de service officielle, horodatée, signée et auditée.

### 1.2. Positionnement institutionnel

iCNS s'inscrit dans la chaîne de commandement suivante :

```
Président de la République (autorité suprême — destinataire des synthèses)
        ▲
Secrétaire Général du Conseil National de Sécurité (opérateur principal)
        ▲
Conseil National de Sécurité (organe de coordination — centralise)
        ▲
Services de Renseignement   |  Forces de Défense et Sécurité  |  Administrations
   (producteurs de renseignement et de dossiers)
```

iCNS n'est pas un outil de communication. C'est un **outil de souveraineté** : il garantit que toute information stratégique produite par un service de l'État puisse être portée à la connaissance du chef de l'État via le SG-CNS, dans un cadre maîtrisé, traçable et confidentiel.

### 1.3. Principes fondamentaux

1. **Le renseignement remonte, il ne se duplique pas.** Quand un dossier quitte un service après traitement et est transmis au CNS, seule une **copie classifiée en lecture seule** reste dans le service émetteur, marquée comme telle. Le dossier actif suit son ascension hiérarchique.
2. **Chaque dossier suit un parcours d'évaluation défini.** Le type d'information (renseignement humain, technique, judiciaire, frontière, etc.) détermine le circuit de validation, d'analyse et de remontée.
3. **Les droits sont liés à l'habilitation, au besoin d'en connaître, et au niveau de classification.** Aucun accès n'est global. Tout est contextuel et tracé.
4. **Tout est tracé, indélébile et auditable.** Chaque action — consultation, ajout, signature, transmission, impression — est enregistrée dans un journal d'audit immuable, accessible aux autorités de contrôle.
5. **Un compte = une identité habilitée.** Chaque utilisateur du système est un agent dont l'identité, le service de rattachement, le grade, le niveau d'habilitation et le périmètre de besoin-d'en-connaître sont enregistrés et certifiés.
6. **Compartimentation systématique.** Un dossier secret ne sort pas de son compartiment, sauf décision explicite et tracée du SG-CNS ou du Président.

---

## 2. Acteurs et Comptes

### 2.1. Niveau stratégique

**Président de la République** — Destinataire suprême des synthèses du CNS. Dispose d'un accès en lecture sur tous les dossiers consolidés et synthèses de l'organe de coordination. Peut requérir un dossier nominatif sur tout sujet de sécurité nationale. Toutes ses consultations sont tracées dans un journal présidentiel scellé.

**Secrétaire Général du Conseil National de Sécurité (SG-CNS)** — Opérateur principal de la plateforme. Reçoit les dossiers, oriente leur traitement, coordonne les services, produit les notes de synthèse à destination du Président. Dispose des droits d'agrégation, de croisement et de demande d'éclaircissement auprès de tout service.

### 2.2. Services de Renseignement et de Sécurité Spéciaux

**B2 — Direction Générale de la Contre-Ingérence et de la Sécurité Militaire**
- Renseignement militaire, sécurité de l'État, lutte contre le terrorisme, surveillance du territoire.
- Produit : notes de renseignement militaire, dossiers de menace, fiches de surveillance, rapports de contre-ingérence.
- Compte de service : `cns.b2.gov.ga`

**DGDI — Direction Générale de la Documentation et de l'Immigration** (ex-CEDOC)
- Contrôle des frontières, passeports, renseignement migratoire.
- Produit : fiches de signalement frontalier, dossiers d'individus signalés, rapports de flux migratoires, alertes biométriques.
- Compte de service : `cns.dgdi.gov.ga`

**DGR — Direction Générale des Recherches**
- Sous l'autorité de la Gendarmerie. Police judiciaire d'élite et renseignement intérieur.
- Produit : procès-verbaux sensibles, dossiers d'enquête classifiés, fiches de renseignement intérieur.
- Compte de service : `cns.dgr.gov.ga`

**DGSS — Direction Générale des Services Spéciaux**
- Rattachée à la Garde Républicaine. Protection des institutions et de la haute autorité.
- Produit : dossiers de menace contre les institutions, fiches de protection rapprochée, rapports de sécurité présidentielle.
- Compte de service : `cns.dgss.gov.ga`

### 2.3. Forces de Défense et de Sécurité

**Garde Républicaine (GR)** — Protection du Président et des sites stratégiques. Unités d'intervention et de renseignement propres. Compte : `cns.gr.gov.ga`.

**Gendarmerie Nationale** — Sécurité publique, police judiciaire, zones rurales. Compte : `cns.gendarmerie.gov.ga`.

**Forces Armées Gabonaises (FAG)** — Armée de Terre, Armée de l'Air, Marine Nationale. Comptes :
- `cns.fag.terre.gov.ga`
- `cns.fag.air.gov.ga`
- `cns.fag.marine.gov.ga`

**Police Nationale** — Ordre public, sécurité urbaine. Compte : `cns.police.gov.ga`.

### 2.4. Unités Spécialisées et Administrations de Sécurité

**SILAM — Service de l'Informatique, de la Logistique et des Archives Magnétiques**
- Renseignement technique : écoutes, cybersécurité. Rattaché à la Présidence.
- Produit : transcriptions, rapports techniques, analyses cyber, fiches d'interception.
- Compte de service : `cns.silam.gov.ga`

**CNS — Secrétariat permanent du Conseil National de Sécurité**
- Cellule de coordination, d'analyse et de synthèse.
- Compte de service : `cns.secretariat.gov.ga`

**DGSP — Direction Générale de la Sécurité Pénitentiaire**
- Surveillance carcérale, signalements détenus sensibles.
- Compte de service : `cns.dgsp.gov.ga`

**Douane Gabonaise** — Unités de surveillance et de lutte contre les trafics illicites.
- Compte de service : `cns.douane.gov.ga`

### 2.5. Comptes individuels

Chaque agent enregistré dispose d'un compte personnel certifié avec :
- Identité légale et matricule
- Service de rattachement
- Grade / fonction
- Niveau d'habilitation (Confidentiel Défense, Secret Défense, Très Secret Défense)
- Périmètre de besoin-d'en-connaître (sujets, zones géographiques, types de dossiers)
- Carte d'identification matérielle (token cryptographique, badge ou carte agent)
- Signature électronique qualifiée

---

## 3. Concepts Métier

### 3.1. Le Dossier de Renseignement (entité centrale)

Un **dossier de renseignement** est un conteneur classifié regroupant des éléments d'information (notes, fiches, pièces, médias, transcriptions) sur un sujet, une personne, un événement ou une menace. Il est créé par un service producteur et circule selon un parcours de validation jusqu'au CNS.

**Attributs d'un dossier de renseignement :**

- Référence unique classifiée (générée selon un schéma de numérotation sécurisé)
- Type de dossier (menace, surveillance, signalement, événement, etc.)
- Service producteur
- Service porteur actuel (qui détient le dossier actif)
- Étape courante dans le parcours
- Statut global (brouillon, en remontée, en analyse au CNS, transmis au SG, transmis au Président, archivé, clôturé)
- Niveau de classification (Diffusion Restreinte, Confidentiel Défense, Secret Défense, Très Secret Défense)
- Sujet (personne, organisation, lieu, événement, thématique)
- Date de création, date de l'événement renseigné, date de péremption éventuelle
- Mots-clés et tags pour le croisement
- Liste des pièces constitutives

### 3.2. Le Schéma de Référence Classifiée

Chaque dossier reçoit une référence dont le format intègre la classification et la traçabilité :

- **Note de renseignement militaire** : `RM/2026/B2/SD/0142` (type/année/service/classification/séquentiel)
- **Fiche frontalière** : `FF/2026/DGDI/CD/0871`
- **Dossier de menace présidentielle** : `MP/2026/DGSS/TSD/0007`
- **Rapport d'interception technique** : `RIT/2026/SILAM/SD/2391`
- **Synthèse CNS** : `SY/2026/CNS/SD/0034`

Codes de classification : **DR** (Diffusion Restreinte), **CD** (Confidentiel Défense), **SD** (Secret Défense), **TSD** (Très Secret Défense).

Codes de services : B2, DGDI, DGR, DGSS, GR, GN (Gendarmerie), FAG-T, FAG-A, FAG-M, PN, SILAM, DGSP, DOU (Douane), CNS.

### 3.3. Les Pièces et Éléments du Dossier

Un dossier de renseignement contient un ensemble d'éléments dont la nature est définie par le type de dossier :

- **Note de renseignement** : production textuelle datée, signée, classifiée
- **Fiche individu** : identité, alias, biométrie, antécédents, lien social et financier
- **Fiche organisation** : raison sociale, dirigeants, lien capitalistique, liens étrangers
- **Pièce probante** : document scanné, photographie, capture vidéo, enregistrement
- **Transcription** : retranscription d'une interception (SILAM)
- **Rapport d'analyse** : production analytique d'un service
- **Pièce de procédure** : PV, ordonnance, mandat (DGR, Gendarmerie, Police)
- **Avis** : appréciation d'un service consulté à titre d'expert

Chaque pièce a :
- Un type, un intitulé, une date de production
- Un statut : brouillon, vérifiée, validée, signée
- Un producteur (service/agent à l'origine)
- Un signataire (autorité l'ayant validée)
- Un niveau de classification (qui peut être supérieur à celui du dossier — auquel cas le dossier est élevé)
- Un lien vers le fichier (stocké chiffré dans iDocument-Secure)

### 3.4. Le Parcours d'Évaluation (Workflow Sécurité)

Le parcours définit le **circuit de validation et de remontée** d'un dossier. Il est déterminé par le type de dossier et la criticité.

**Structure d'une étape de parcours :**

- Service / cellule destinataire
- Actions attendues (analyser, croiser, signer, viser, transmettre)
- Rôles autorisés (officier traitant, chef de section, directeur, SG-CNS, Président)
- Conditions de passage (analyse validée, contre-vérification effectuée, croisement positif, signature du directeur)
- Délai de traitement attendu (variable selon la criticité)
- Actions de blocage : suspension, classement sans suite, demande d'éclaircissement, escalade d'urgence

**Règle de remontée et de copie :** Quand un dossier est transmis au niveau supérieur, le dossier actif quitte le service. Une **copie classifiée en lecture seule**, marquée "COPIE — Transmise le [date] vers [destinataire]", reste dans le service producteur. Les droits sur cette copie sont restreints : pas de duplication, pas d'impression sauf autorisation explicite du directeur du service ET du SG-CNS.

### 3.5. La Correspondance Officielle Sécurité

Au-delà des dossiers de renseignement, iCNS gère la **correspondance officielle entre services de sécurité** :

- Demande d'information à un service tiers (réquisition interne)
- Note de coordination entre services
- Directive du SG-CNS à un service
- Message présidentiel à un service via le SG-CNS
- Compte-rendu de mission

La correspondance officielle suit les mêmes principes : référence, classification, traçabilité, accusé de réception, signature électronique.

### 3.6. Les Délais et l'Urgence

Trois niveaux d'urgence opérationnels :

- **Routine** : traitement standard, délais paramétrés par type de dossier (24h à 30 jours)
- **Urgent** : traitement prioritaire, escalade automatique au chef de service, délai cible 4 à 24h
- **Flash / Crise** : remontée immédiate au SG-CNS et au Président. Notification simultanée, traitement parallèle, mobilisation du CNS en formation restreinte. Délai cible : moins de 1h pour la première synthèse.

Le système alerte automatiquement le SG-CNS si un dossier urgent stagne, et notifie le Président si un dossier Flash n'a pas reçu de synthèse dans le délai cible.

### 3.7. L'Annuaire Souverain

iCNS dispose d'un annuaire souverain interne et certifié :

- **Un compte = une identité d'agent certifiée.** Pas d'invitation externe, pas d'accès partagé.
- **Un service = une chaîne de commandement.** Les transmissions vers un service sont routées vers le bureau d'ordre, puis dispatchées au chef de section pertinent.
- **Une administration = un point d'entrée sécurisé.** Bureau du Cabinet, Secrétariat Général, etc.

La résolution du destinataire est strictement contrôlée : si la procédure cible "le SG-CNS", le système route exclusivement vers la personne en titre, avec délégation possible uniquement vers un chef de cabinet explicitement habilité.

---

## 4. Rôles et Habilitations

### 4.1. Rôles fonctionnels dans une procédure de renseignement

Les droits sont **contextuels**, déterminés par le type de dossier, l'étape en cours, le niveau de classification et l'habilitation de l'agent :

- **Officier traitant** : agent désigné qui constitue, enrichit et porte le dossier au sein de son service
- **Chef de section / cellule** : valide la production de son équipe, vise les pièces
- **Directeur de service** : signe les notes officielles, transmet au niveau supérieur, peut classer
- **Analyste CNS** : reçoit les dossiers au secrétariat du CNS, effectue le croisement multi-services, prépare la synthèse
- **Secrétaire Général du CNS** : reçoit les dossiers consolidés, oriente, demande des éclaircissements, signe les notes au Président
- **Président de la République** : destinataire des synthèses, peut requérir tout dossier nominativement
- **Auditeur / Contrôleur** : accès en consultation au journal d'audit (pas au contenu des dossiers actifs), sous mandat
- **Administrateur système** : gère les comptes, les habilitations, la configuration technique — n'a JAMAIS accès au contenu des dossiers

### 4.2. Matrice des droits par étape et par classification

| Action | Habilitation minimale | Conditions |
|---|---|---|
| Consulter un dossier DR | CD | Besoin-d'en-connaître établi |
| Consulter un dossier CD | CD | Besoin-d'en-connaître + appartenance à la procédure |
| Consulter un dossier SD | SD | Inscription nominative sur la liste de diffusion |
| Consulter un dossier TSD | TSD | Autorisation explicite du SG-CNS ou du Président |
| Ajouter une pièce | Officier traitant assigné | Pièce de niveau ≤ niveau du dossier |
| Signer une pièce | Signataire désigné | Habilitation ≥ classification de la pièce |
| Viser le dossier | Chef de section | Au sein du service producteur |
| Transmettre au niveau supérieur | Directeur de service | Validation interne complète |
| Émettre une demande d'éclaircissement | Analyste CNS, SG-CNS | Dossier au CNS |
| Classer / clôturer | Directeur de service + visa SG-CNS | Pour tout dossier ayant atteint le CNS |
| Demander un dossier nominativement | Président, SG-CNS | Toujours autorisé, toujours tracé |
| Imprimer | Directeur uniquement | Autorisation explicite, marquage filigrane |
| Faire une copie hors système | Interdite par défaut | Dérogation présidentielle uniquement |

### 4.3. Niveaux de classification

- **Diffusion Restreinte (DR)** : information administrative sensible, à ne pas diffuser hors cercle professionnel.
- **Confidentiel Défense (CD)** : information dont la divulgation compromet la sécurité ou les intérêts de l'État.
- **Secret Défense (SD)** : information dont la divulgation porte une atteinte grave à la défense nationale et à la sécurité de l'État.
- **Très Secret Défense (TSD)** : information dont la divulgation porte une atteinte exceptionnellement grave à la défense nationale, à la sûreté de l'État ou à la vie de personnes. Diffusion strictement nominative, sur ordre du SG-CNS ou du Président.

Toute consultation d'un dossier SD ou TSD est tracée individuellement, horodatée, et fait l'objet d'un rapport hebdomadaire au SG-CNS.

### 4.4. Besoin-d'en-connaître

Le **besoin-d'en-connaître** (need-to-know) est appliqué systématiquement :
- Définition par mots-clés, zones géographiques, périmètre fonctionnel, période
- Validation par le directeur du service de l'agent
- Révision périodique (trimestrielle pour SD, mensuelle pour TSD)
- Révocation immédiate possible (mutation, mise à pied, instruction disciplinaire)

---

## 5. Cycle de Vie d'un Dossier de Renseignement

### 5.1. Création

Un dossier est créé par un **officier traitant** au sein de l'un des services producteurs :

1. Sélection du type de dossier (le type détermine le parcours et la classification minimale)
2. Génération automatique de la référence classifiée
3. Renseignement du sujet, des mots-clés, du niveau de classification
4. Mise en place du parcours instancié (étapes pré-configurées selon le type)
5. Le dossier est positionné en étape de constitution interne au service

### 5.2. Constitution et enrichissement

L'officier traitant et les contributeurs autorisés constituent le dossier :

- Production de notes de renseignement
- Ajout de pièces probantes (chiffrées au repos, accès journalisé)
- Croisement avec les bases internes du service
- Demande de pièces complémentaires à un autre service (réquisition interne)
- Indication des sources (sans nécessairement les exposer — application du principe de protection des sources)

### 5.3. Validation interne au service

Avant transmission au CNS, le dossier passe par la chaîne hiérarchique du service producteur :
1. **Chef de section** : visa technique, contrôle de la qualité du renseignement
2. **Directeur du service** : signature officielle, validation politique, classement éventuel

### 5.4. Transmission au Conseil National de Sécurité

À la signature du directeur, le dossier est transmis au **secrétariat permanent du CNS** :

1. Le dossier actif quitte le service producteur
2. Une copie classifiée en lecture seule reste, marquée "TRANSMIS CNS — [date]"
3. Le secrétariat CNS est notifié (alerte sur la criticité)
4. Un analyste CNS est assigné selon le sujet

### 5.5. Analyse et croisement au CNS

Les analystes du CNS effectuent le travail de **synthèse multi-sources** :

- Croisement avec les dossiers d'autres services portant sur le même sujet
- Identification des convergences et des divergences
- Demandes d'éclaircissement aux services contributeurs
- Production d'une **note de synthèse CNS** pour le SG

### 5.6. Validation par le Secrétaire Général

Le **SG-CNS** reçoit la note de synthèse et :
- La vise et la signe pour transmission au Président
- Ou demande un complément d'analyse
- Ou classe le sujet sans suite (avec motivation)
- Ou convoque une formation restreinte du CNS si la criticité le justifie

### 5.7. Transmission au Président

Pour les dossiers d'importance stratégique, le SG-CNS produit une **note présidentielle** :
- Synthèse opérationnelle (1 à 3 pages selon doctrine)
- Options de décision proposées (le cas échéant)
- Annexes documentaires consultables sur demande

La transmission est tracée dans le journal présidentiel scellé.

### 5.8. Suspension et reprise

Un dossier peut être **suspendu** par le directeur du service producteur ou par le SG-CNS, notamment :
- En attente d'une information complémentaire
- Sur instruction présidentielle (mise en sommeil stratégique)
- Pour préserver une opération en cours

La suspension est tracée. La reprise relance les délais.

### 5.9. Clôture et archivage

Le dossier est clôturé quand :
- L'objectif de renseignement est atteint (synthèse présidentielle finale)
- Le sujet est classé sans suite par le SG-CNS
- Le Président clôt le dossier par décision politique

À la clôture, le dossier passe en lecture seule et est transféré dans **iArchive-Secure**, avec une politique de rétention adaptée à la classification (10 à 50 ans pour SD/TSD, déclassification éventuelle après expertise du SGDSN-équivalent).

---

## 6. Fonctionnalités Détaillées

### 6.1. Gestion des dossiers de renseignement

- Création de dossier avec sélection du type et classification
- Constitution interactive : intégration de notes, fiches, pièces probantes, transcriptions
- Visualisation du parcours de remontée : indication du service porteur, de l'étape, du délai
- Transmission tracée avec contrôle de l'intégrité (hash, signature)
- Historique complet et indélébile : chaque action est tracée
- Copies de passage classifiées en lecture seule après remontée

### 6.2. Cellule de coordination CNS

- Tableau de bord opérationnel des dossiers en cours d'analyse
- Croisement multi-services : recherche par sujet, individu, lieu, période
- Détection automatique de doublons et de convergences (mots-clés, biométrie, lieux)
- Demande d'éclaircissement structurée vers un service
- Production de synthèses (canevas pré-formatés CNS)

### 6.3. Bureau présidentiel

- Liste des notes présidentielles transmises (chronologique)
- Demande nominative de dossier (recherche multi-critères avec habilitation présidentielle universelle)
- Marquage des dossiers nécessitant une décision présidentielle
- Journal des consultations présidentielles (scellé)

### 6.4. Correspondance officielle entre services

- Réquisition interne (demande formelle à un service tiers)
- Note de coordination (multi-destinataires intra-CNS)
- Directive du SG-CNS (descente d'instruction)
- Compte-rendu de mission (remontée hiérarchique standard)

### 6.5. Recherche et registre classifié

- Registre chronologique séparé par service et par classification
- Recherche par référence, sujet, individu, période, mots-clés
- Filtres : classification, statut, urgence, service producteur, service porteur
- Recherche stricte respectant le besoin-d'en-connaître (un résultat n'est affiché que si l'agent a le droit de le voir)

### 6.6. Notifications et alertes

- Notification de réception d'un dossier transmis
- Alerte de délai (Flash, Urgent, Routine)
- Alerte de convergence (le système signale un croisement positif avec un dossier d'un autre service, sans en révéler le contenu sans habilitation)
- Alerte de menace imminente (escalade au SG-CNS et au Président)
- Notification de demande d'éclaircissement du CNS

### 6.7. Tableaux de bord par profil

- **Officier traitant** : mes dossiers en constitution, mes dossiers en attente de visa
- **Chef de section** : dossiers à viser, dossiers de l'équipe
- **Directeur de service** : flux du service, dossiers à signer, dossiers transmis au CNS
- **Analyste CNS** : dossiers en analyse, croisements à explorer, synthèses à produire
- **SG-CNS** : flux global, dossiers à valider, notes à signer pour le Président, alertes Flash
- **Président** : notes présidentielles, dossiers nominatifs requis, alertes critiques

### 6.8. Audit et contrôle

- Journal d'audit immuable de toutes les actions
- Rapport mensuel d'activité par service
- Rapport hebdomadaire des consultations SD/TSD au SG-CNS
- Accès auditeur (sous mandat) — consultation des métadonnées d'action sans accès au contenu

---

## 7. Architecture des Données

### 7.1. Entités principales

**DossierRenseignement**
```
id                      : identifiant unique
reference               : string (référence classifiée générée)
typeDossierId           : référence vers TypeDossier
sujet                   : string
motsCles                : string[]
serviceProducteurId     : référence vers Service
servicePorteurId        : référence vers Service (qui détient le dossier actif)
etapeCouranteId         : référence vers EtapeParcours
classification          : "DR" | "CD" | "SD" | "TSD"
urgence                 : "routine" | "urgent" | "flash"
statut                  : "brouillon" | "constitution" | "validation_service" | "remontee_cns" | "analyse_cns" | "synthese_sg" | "transmis_president" | "suspendu" | "classe" | "cloture" | "archive"
dateCreation            : timestamp
dateEvenement           : timestamp | null
datePeremption          : timestamp | null
dateDerniereAction      : timestamp
hashIntegrite           : string (hash cryptographique du contenu)
metadata                : Record<string, any>
```

**Piece**
```
id                      : identifiant unique
dossierId               : référence vers DossierRenseignement
type                    : "note" | "fiche_individu" | "fiche_organisation" | "preuve" | "transcription" | "rapport" | "procedure" | "avis"
intitule                : string
contenu                 : string (chiffré)
fichierIdSecure         : référence vers iDocument-Secure (fichier chiffré)
producteurId            : référence vers Utilisateur
signataireId            : référence vers Utilisateur | null
classification          : "DR" | "CD" | "SD" | "TSD"
statut                  : "brouillon" | "verifiee" | "validee" | "signee"
dateProduction          : timestamp
sourceProtegee          : boolean (true = source non exposée)
hashContenu             : string
```

**TypeDossier** (configuration)
```
id                      : identifiant unique
code                    : string (ex: "MENACE_TERRO", "FRONTIERE_SIGNALEMENT", "SURVEILLANCE_INDIVIDU")
nom                     : string
classificationMin       : "DR" | "CD" | "SD" | "TSD"
schemaReference         : string (modèle de génération de référence)
piecesAttendues         : PieceAttendue[]
parcours                : EtapeConfig[]
servicesProducteurs     : référence[] vers Service
politiqueArchivage      : référence vers PolitiqueArchivage
delaiCible              : number (heures pour Flash, jours pour Urgent/Routine)
actif                   : boolean
```

**EtapeParcours**
```
id                      : identifiant unique
dossierId               : référence vers DossierRenseignement
ordre                   : number
serviceId               : référence vers Service
celluleCible            : string | null (ex: "secretariat_cns", "bureau_sg")
actionsAttendues        : string[] (ex: ["analyser", "croiser", "synthetiser", "signer"])
rolesAutorises          : RoleEtape[]
conditionPassage        : string
delaiHeures             : number
statut                  : "a_venir" | "en_cours" | "complete" | "renvoi" | "saute" | "suspendu"
dateEntree              : timestamp | null
dateSortie              : timestamp | null
analystesAssignes       : référence[] vers Utilisateur
commentaires            : Commentaire[]
```

**CopieClassifiee** (copie en lecture seule après remontée)
```
id                      : identifiant unique
dossierOriginalId       : référence vers DossierRenseignement
serviceDetenteurId      : référence vers Service
etapeId                 : référence vers EtapeParcours
dateTransmission        : timestamp
snapshotChiffre         : blob (état complet chiffré du dossier au moment du passage)
droitsImpression        : boolean (par défaut false)
droitsDuplication       : boolean (par défaut false)
marque                  : "COPIE — Transmise le [date] vers [destinataire]"
hashIntegrite           : string
```

**JournalAudit** (immuable, append-only)
```
id                      : identifiant unique
dossierId               : référence vers DossierRenseignement | Correspondance | null
utilisateurId           : référence vers Utilisateur
serviceUtilisateur      : référence vers Service
action                  : string (ex: "creation", "consultation", "modification", "signature", "transmission", "tentative_acces_refusee", "impression", "export")
classificationDossier   : "DR" | "CD" | "SD" | "TSD" | null
detail                  : string
horodatage              : timestamp
adresseIP               : string
poste                   : string (identifiant du poste de travail)
hashChainage            : string (chaînage cryptographique avec l'entrée précédente — immuabilité)
```

**Habilitation**
```
id                      : identifiant unique
utilisateurId           : référence vers Utilisateur
niveauMax               : "DR" | "CD" | "SD" | "TSD"
perimetreMotsCles       : string[]
perimetreGeographique   : string[]
perimetreFonctionnel    : string[]
dateDelivrance          : timestamp
dateRevision            : timestamp
dateExpiration          : timestamp
autoriteDelivrance      : référence vers Utilisateur (directeur du service ou SG-CNS pour TSD)
statut                  : "active" | "suspendue" | "revoquee" | "expiree"
```

**ConsultationDossier** (pour SD et TSD — traçabilité renforcée)
```
id                      : identifiant unique
dossierId               : référence vers DossierRenseignement
utilisateurId           : référence vers Utilisateur
motif                   : string
horodatage              : timestamp
dureeSecondes           : number
piecesConsultees        : référence[]
```

### 7.2. Relations entre modules

```
iCNS ──── pièces / fichiers chiffrés ──→ iDocument-Secure (stockage chiffré au repos + en transit)
iCNS ──── archivage classifié ─────────→ iArchive-Secure (conservation longue, déclassification programmée)
iCNS ──── annuaire souverain ──────────→ Annuaire système (comptes agents certifiés)
iCNS ──── chaîne de commandement ──────→ Organigramme services / cellules
iCNS ──── transmission officielle ─────→ iCorrespondance (mécanisme de notification et de transmission)
```

---

## 8. Interfaces Utilisateur

### 8.1. Interface Officier Traitant (postes-agents)

Postes durcis (poste banalisé, écran filtrant, lecteur de carte, authentification multi-facteurs) :

**Espaces principaux :**
- Mes dossiers en constitution
- Dossiers de ma section
- Dossiers à viser
- Réquisitions reçues d'autres services
- Correspondance officielle

**Actions disponibles :**
- Créer un dossier (sélection du type)
- Produire une note de renseignement (éditeur sécurisé, traçage de toute modification)
- Joindre une pièce probante (upload chiffré, hash de contrôle)
- Soumettre au chef de section pour visa
- Consulter ses dossiers archivés (lecture seule)

### 8.2. Interface Direction de Service

Profil élargi pour le directeur et chefs de section :

- Vision consolidée du flux de production du service
- Dossiers en attente de visa / signature
- Tableaux d'activité (volume, délai moyen, taux de renvoi CNS)
- Habilitations en cours dans le service
- Transmission officielle vers le CNS

### 8.3. Interface Secrétariat CNS

Cellule d'analyse — fonctionnalités spécifiques :

- Flux entrant multi-services (filtre par classification, par urgence, par service)
- Outil de croisement (recherche sémantique inter-dossiers, alerte de convergence)
- Production de synthèse (canevas, intégration de pièces de plusieurs services dans une note unique)
- Demande d'éclaircissement (formulaire structuré vers un service)
- Préparation de la note SG → Président

### 8.4. Interface Secrétaire Général du CNS

Cockpit du SG :

- Flux global temps réel (dossiers en cours d'analyse, synthèses prêtes)
- Notes à signer pour le Président
- Alertes Flash en priorité haute
- Convocation virtuelle d'une formation restreinte du CNS
- Tableau de bord stratégique (cartographie des menaces, indicateurs)

### 8.5. Interface Présidentielle

Profil unique, sur poste sécurisé dédié (double authentification, environnement isolé) :

- Notes présidentielles (chronologique, par thème)
- Recherche nominative universelle (avec habilitation présidentielle)
- Marquage de décision (instruction, classement, demande d'approfondissement)
- Journal des consultations présidentielles (scellé)
- Communication directe avec le SG-CNS

### 8.6. Interface Auditeur / Inspecteur

Accès sur mandat, périmètre restreint :

- Consultation des métadonnées d'action (qui, quand, quoi — pas le contenu)
- Vérification de l'intégrité de la chaîne d'audit
- Rapport de conformité

---

## 9. Exemples de Parcours Types

### 9.1. Signalement frontalier biométrique (DGDI)

```
Étape 1 : Agent DGDI poste-frontière → Création de la fiche de signalement (alerte biométrique au passage)
Étape 2 : Cellule analyse DGDI → Vérification, croisement avec base nationale
Étape 3 : Directeur DGDI → Signature, transmission CNS
Étape 4 : Analyste CNS → Croisement avec B2, DGR, DGSS, Interpol
Étape 5 : SG-CNS → Visa et orientation (suivi opérationnel, surveillance, interpellation)
Étape 6 : Président → Information (si profil sensible)
```

Classification : CD ou SD selon le profil.

### 9.2. Menace présidentielle (DGSS)

```
Étape 1 : Officier DGSS → Production note de menace
Étape 2 : Chef de section DGSS → Visa, demande d'éclaircissement B2/SILAM si nécessaire
Étape 3 : Directeur DGSS → Signature, transmission immédiate (Flash)
Étape 4 : SG-CNS → Réception Flash, convocation formation restreinte si TSD
Étape 5 : Président → Notification immédiate, options de protection présentées
```

Classification : SD ou TSD. Urgence : Flash systématique.

### 9.3. Dossier de contre-ingérence (B2)

```
Étape 1 : Officier B2 → Constitution du dossier (notes, transcriptions SILAM, pièces probantes)
Étape 2 : Section contre-ingérence B2 → Analyse approfondie, croisement interne
Étape 3 : Directeur B2 → Signature, transmission CNS
Étape 4 : Analyste CNS → Croisement DGR (judiciaire), DGDI (frontière), DGSS (institutions)
Étape 5 : SG-CNS → Synthèse stratégique, recommandation au Président
Étape 6 : Président → Décision (instruction judiciaire, mesure administrative, opération discrète)
```

Classification : SD ou TSD.

### 9.4. Interception technique (SILAM)

```
Étape 1 : Cellule SILAM → Transcription d'interception, classification immédiate
Étape 2 : Chef SILAM → Visa technique
Étape 3 : Directeur SILAM → Signature, transmission ciblée (service demandeur d'origine OU CNS pour intérêt général)
Étape 4 : CNS (si applicable) → Intégration au dossier thématique en cours
```

Classification : SD systématique, TSD selon le sujet.

### 9.5. Rapport de trafic illicite (Douane)

```
Étape 1 : Brigade douanière → Constatation, PV, saisie éventuelle
Étape 2 : Direction régionale douane → Validation, qualification (trafic d'armes, stupéfiants, contrefaçon, traite)
Étape 3 : DG Douane → Transmission CNS si intérêt national
Étape 4 : Analyste CNS → Croisement DGDI, DGR, B2 (origine, réseaux)
Étape 5 : SG-CNS → Orientation : judiciarisation (DGR), surveillance prolongée (B2/DGDI), action diplomatique
```

Classification : DR à SD selon l'ampleur.

### 9.6. Synthèse hebdomadaire de sécurité présidentielle

```
Étape 1 : Analystes CNS → Agrégation des éléments des 7 derniers jours
Étape 2 : SG-CNS → Validation de la synthèse hebdomadaire
Étape 3 : Président → Lecture en réunion sécurité du lundi
```

Classification : SD. Périodicité fixe.

---

## 10. Règles Métier

1. **Aucun dossier ne peut être transmis sans référence classifiée enregistrée et hash d'intégrité.**
2. **La transmission est bloquée si la signature du directeur du service n'est pas apposée** sauf décision présidentielle exceptionnelle tracée.
3. **Un dossier transmis quitte le service producteur.** Seule une copie classifiée en lecture seule, marquée et chiffrée, reste sur place. Aucune duplication ni impression sans autorisation explicite.
4. **Toute consultation d'un dossier SD ou TSD est tracée individuellement** et apparaît dans le rapport hebdomadaire au SG-CNS.
5. **Le besoin-d'en-connaître est vérifié à chaque consultation.** L'habilitation seule ne suffit pas — la pertinence du périmètre est contrôlée.
6. **Une pièce ne peut pas être modifiée après signature.** Toute correction donne lieu à une pièce additionnelle, datée, signée, référencée à la pièce d'origine.
7. **La classification du dossier est élevée automatiquement** si une pièce ajoutée porte une classification supérieure.
8. **Les délais Flash déclenchent une escalade automatique** : SMS / appel chiffré au SG-CNS, notification présidentielle au-delà de 1h sans synthèse.
9. **La clôture est irréversible.** Un dossier clôturé est transféré en iArchive-Secure avec sa politique de rétention. La déclassification, le cas échéant, suit une procédure spécifique.
10. **La protection des sources est absolue.** Une source humaine n'est jamais nommée dans le dossier — elle est référencée par un identifiant chiffré géré par le service producteur. Seul le directeur du service connaît la correspondance.
11. **L'administrateur système n'a aucun accès au contenu des dossiers.** Il administre les comptes, les habilitations, l'infrastructure — pas le renseignement.
12. **Toute tentative d'accès non autorisé est tracée** et déclenche une alerte au directeur du service de l'agent et au RSSI.
13. **Le Président peut, à tout moment, requérir tout dossier**, y compris TSD. La requête est tracée dans le journal présidentiel scellé, accessible uniquement à un comité de contrôle parlementaire selon la loi.
14. **L'export hors système est par défaut interdit.** Toute dérogation est nominative, tracée, et signée par le SG-CNS.
15. **Tout matériel d'impression marque un filigrane** intégrant le nom de l'agent, l'horodatage et la référence du dossier.

---

## 11. Sécurité Technique

### 11.1. Infrastructure souveraine

- Hébergement souverain en territoire gabonais sur infrastructure dédiée
- Pas de dépendance à un cloud étranger
- Sauvegardes chiffrées dans un site secondaire physiquement distant
- Réseau privé virtuel inter-services, isolé du réseau internet public

### 11.2. Chiffrement

- Chiffrement au repos AES-256 sur tous les contenus de dossiers et pièces
- Chiffrement en transit TLS 1.3 sur toutes les communications inter-services et utilisateur-serveur
- Chiffrement homomorphe ou de bout en bout pour les pièces TSD (étude en cours)
- Gestion des clés par HSM (Hardware Security Module) souverain

### 11.3. Authentification

- Authentification multi-facteurs obligatoire (carte agent + PIN + biométrie sur postes habilités)
- Signature électronique qualifiée pour toute action de signature
- Sessions courtes (15 minutes d'inactivité = déconnexion)
- Verrouillage automatique du poste après déconnexion

### 11.4. Postes de travail

- Postes durcis (système d'exploitation contrôlé, pas d'USB en sortie, pas de Bluetooth, pas de Wi-Fi)
- Filtre de confidentialité écran obligatoire
- Caméras désactivées physiquement
- Audit régulier de l'intégrité des postes (EDR + audit physique)

### 11.5. Audit et intégrité

- Journal d'audit en chaîne cryptographique (chaque entrée référence le hash de la précédente — immuabilité prouvable)
- Sauvegarde du journal d'audit dans un coffre-fort numérique séparé
- Contrôle d'intégrité quotidien automatique
- Audit annuel externe par autorité de contrôle indépendante

### 11.6. Continuité d'activité

- Plan de continuité opérationnelle (PCO) testé semestriellement
- Site de repli opérationnel en moins de 4h
- Procédure papier dégradée documentée pour les dossiers Flash en cas d'indisponibilité système

---

## 12. Architecture Applicative

### 12.1. Backend (Convex — instance souveraine)

Tables Convex principales :

- `dossiers_renseignement` — les dossiers actifs
- `pieces` — les éléments constitutifs des dossiers (chiffrés)
- `types_dossier` — configuration des types et parcours
- `etapes_parcours` — étapes instanciées
- `copies_classifiees` — copies en lecture seule après remontée
- `journal_audit` — journal immuable
- `habilitations` — droits des agents
- `consultations_dossier` — traçabilité renforcée SD/TSD
- `services` — annuaire des services
- `utilisateurs` — annuaire des agents
- `schemas_reference` — modèles de numérotation classifiée

### 12.2. Frontend

Trois applications distinctes selon le profil :

| App | Profils | Caractéristiques |
|---|---|---|
| `agent-secure` | Officier traitant, chef de section, directeur de service | Postes des services producteurs |
| `cns-secure` | Analystes CNS, SG-CNS | Postes du Secrétariat permanent CNS |
| `president-secure` | Président de la République et cellule présidentielle de sécurité | Poste unique, environnement isolé |

Toutes les applications héritent du design Finder (dossiers, cartes A4, 3 modes de vue) adapté à une charte sobre, sombre, optimisée pour la lecture prolongée et la confidentialité visuelle.

### 12.3. Intégrations

- **iDocument-Secure** : stockage chiffré des fichiers
- **iArchive-Secure** : archivage longue durée et déclassification
- **iCorrespondance** : mécanisme de transmission officielle (réinstance sécurisée du module diplomatique)
- **Annuaire souverain** : comptes agents et organigrammes
- **HSM souverain** : gestion cryptographique des clés
- **Plateforme biométrique nationale** (pour DGDI) : flux de signalements
- **Système de transcription chiffrée SILAM** : flux d'interceptions

---

## 13. Gouvernance et Contrôle

### 13.1. Comité de pilotage

- Présidé par le SG-CNS
- Composé des directeurs des services utilisateurs
- Se réunit trimestriellement
- Décide des évolutions fonctionnelles, des règles métier, des politiques de classification

### 13.2. RSSI (Responsable de la Sécurité des Systèmes d'Information)

- Rattaché à la Présidence
- Garant de la sécurité technique
- Habilitation TSD
- Conduite des audits, gestion des incidents

### 13.3. Contrôle parlementaire

Selon la loi, une commission parlementaire restreinte composée de parlementaires habilités peut :
- Auditer les procédures (sans accès au contenu)
- Vérifier la conformité aux lois sur le renseignement
- Demander un rapport annuel d'activité statistique au SG-CNS

### 13.4. Procédure de déclassification

- À la demande du Président, du SG-CNS, ou à l'expiration de la période de rétention
- Examen par une commission de déclassification
- Critères : intérêt historique, fin de la sensibilité opérationnelle, demande d'accès légitime
- Versement éventuel aux Archives Nationales avec mention de la durée de classification d'origine

---

## 14. Évolutions Futures

- **Analyse augmentée par IA souveraine** : détection automatique de convergences, scoring de pertinence des sources, alertes prédictives — sur infrastructure isolée, sans rappel modèle externe.
- **Cartographie dynamique des menaces** : visualisation géographique temps réel des signalements, mouvements suspects, indicateurs croisés.
- **Reconnaissance biométrique étendue** : intégration des bases biométriques DGDI dans les fiches individus.
- **Module Crise** : tableau de commandement opérationnel pour gestion de crise (terrorisme, catastrophe, menace majeure), pilotable depuis la Présidence.
- **Liaison sécurisée avec services alliés** : protocole de partage de renseignement bilatéral avec services étrangers partenaires, sous contrôle strict du Président.
- **Module Forensic Numérique** : intégration des productions du SILAM (analyses forensic, cyber-incidents) directement dans iCNS.

---

## 15. Glossaire

- **CNS** : Conseil National de Sécurité
- **SG-CNS** : Secrétaire Général du Conseil National de Sécurité
- **B2** : Direction Générale de la Contre-Ingérence et de la Sécurité Militaire
- **DGDI** : Direction Générale de la Documentation et de l'Immigration
- **DGR** : Direction Générale des Recherches
- **DGSS** : Direction Générale des Services Spéciaux
- **GR** : Garde Républicaine
- **FAG** : Forces Armées Gabonaises
- **SILAM** : Service de l'Informatique, de la Logistique et des Archives Magnétiques
- **DGSP** : Direction Générale de la Sécurité Pénitentiaire
- **DR / CD / SD / TSD** : Diffusion Restreinte / Confidentiel Défense / Secret Défense / Très Secret Défense
- **HSM** : Hardware Security Module — module cryptographique matériel
- **RSSI** : Responsable de la Sécurité des Systèmes d'Information
- **PCO** : Plan de Continuité Opérationnelle
- **Besoin-d'en-connaître** : principe selon lequel un agent habilité n'accède qu'aux informations strictement nécessaires à sa mission

---

*Document de spécification fonctionnelle — iCNS — Conseil National de Sécurité — République Gabonaise — v1.0*
*Mai 2026 — CLASSIFICATION DU DOCUMENT : CONFIDENTIEL DÉFENSE*
*Diffusion : SG-CNS, Directeurs de services producteurs, RSSI, Comité de pilotage*

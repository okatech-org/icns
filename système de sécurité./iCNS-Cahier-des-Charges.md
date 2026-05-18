# Cahier des Charges — Plateforme iCNS

**Maître d'ouvrage :** Conseil National de Sécurité (CNS) — République Gabonaise
**Maître d'œuvre :** NTSAGUI Digital
**Référence :** NTSAGUI/CNS/CDC/2026/001
**Version :** 1.0 — Mai 2026
**Classification :** CONFIDENTIEL DÉFENSE

---

## Préambule

Le présent cahier des charges précise les exigences fonctionnelles, techniques, de sécurité, de qualité, de performance et de livraison auxquelles devra répondre la plateforme **iCNS** (i-Conseil National de Sécurité), ainsi que ses modules satellites **iDocument**, **iArchive** et **iCom**.

Il s'inscrit en complément du Plan de Développement (réf. NTSAGUI/CNS/PD/2026/001) et de la Spécification Fonctionnelle iCNS v1.0. En cas de contradiction entre les documents, le présent cahier des charges fait foi pour les exigences contraignantes.

---

## 1. Présentation du besoin

### 1.1. Contexte

La République Gabonaise ne dispose pas d'un outil centralisé, souverain et tracé pour la remontée, le croisement et la synthèse du renseignement national. Les treize entités de sécurité (services de renseignement, forces de défense et de sécurité, administrations de sécurité) opèrent en silos. Le SG-CNS reçoit l'information par des canaux hétérogènes.

### 1.2. Objet du marché

Conception, développement, déploiement et mise en service d'une plateforme logicielle souveraine, hébergée en territoire gabonais, dénommée **iCNS**, incluant trois modules satellites : **iDocument**, **iArchive**, **iCom**, ainsi qu'une API sécurisée à destination de l'application présidentielle (hors périmètre).

### 1.3. Bénéficiaires

- Bénéficiaire principal : Conseil National de Sécurité et son Secrétaire Général.
- Bénéficiaires opérationnels : B2, DGDI, DGR, DGSS, Garde Républicaine, Gendarmerie Nationale, FAG (Terre, Air, Marine), Police Nationale, SILAM, DGSP, Douane Gabonaise.
- Bénéficiaire ultime : Président de la République, via l'application présidentielle consommatrice de l'API iCNS.

---

## 2. Exigences fonctionnelles

### 2.1. EF-01 — Gestion des dossiers de renseignement

| ID | Exigence | Priorité |
|---|---|---|
| EF-01.1 | Le système doit permettre la création d'un dossier de renseignement par tout officier traitant habilité. | Obligatoire |
| EF-01.2 | Chaque dossier doit recevoir une référence unique classifiée selon un schéma paramétrable. | Obligatoire |
| EF-01.3 | Un dossier doit pouvoir contenir : notes, fiches individu, fiches organisation, pièces probantes, transcriptions, rapports, pièces de procédure, avis. | Obligatoire |
| EF-01.4 | Le système doit gérer un parcours d'évaluation paramétrable par type de dossier. | Obligatoire |
| EF-01.5 | Le système doit bloquer la transmission d'un dossier non signé par le directeur du service producteur. | Obligatoire |
| EF-01.6 | À chaque transmission, le dossier actif doit quitter le service producteur ; une copie classifiée en lecture seule doit rester sur place. | Obligatoire |
| EF-01.7 | Le système doit calculer un hash d'intégrité à chaque modification de dossier. | Obligatoire |
| EF-01.8 | Le système doit permettre la suspension et la reprise d'un dossier. | Obligatoire |
| EF-01.9 | Le système doit gérer la clôture d'un dossier (positive, négative, administrative). | Obligatoire |
| EF-01.10 | Toute clôture doit être irréversible. | Obligatoire |

### 2.2. EF-02 — Coordination CNS

| ID | Exigence | Priorité |
|---|---|---|
| EF-02.1 | Le Secrétariat permanent du CNS doit recevoir tous les dossiers transmis par les services. | Obligatoire |
| EF-02.2 | Le système doit proposer un outil de croisement multi-services par mots-clés, individus, organisations, lieux, périodes. | Obligatoire |
| EF-02.3 | Le système doit alerter le SG-CNS en cas de convergence détectée entre dossiers de services différents. | Obligatoire |
| EF-02.4 | Les analystes CNS doivent pouvoir émettre une demande d'éclaircissement structurée vers un service. | Obligatoire |
| EF-02.5 | Le système doit fournir un canevas de synthèse pour la production de notes pour le SG-CNS. | Obligatoire |
| EF-02.6 | Le SG-CNS doit pouvoir signer, viser, classer ou renvoyer une synthèse. | Obligatoire |

### 2.3. EF-03 — API présidentielle

| ID | Exigence | Priorité |
|---|---|---|
| EF-03.1 | Le système doit exposer une API REST à destination de l'application présidentielle. | Obligatoire |
| EF-03.2 | L'authentification de l'API doit se faire par mTLS avec certificats émis par la PKI souveraine. | Obligatoire |
| EF-03.3 | Les jetons d'accès doivent être de durée limitée (15 minutes maximum). | Obligatoire |
| EF-03.4 | Chaque appel API doit être journalisé dans un journal scellé spécifique à l'API présidentielle. | Obligatoire |
| EF-03.5 | L'autorisation d'accès à l'API doit être nominative et accordée explicitement par le SG-CNS. | Obligatoire |
| EF-03.6 | Le contrat d'API (OpenAPI/Swagger) doit être livré avec un cahier de tests et un client de référence. | Obligatoire |
| EF-03.7 | Aucune connexion réseau directe ne doit être possible entre le réseau opérationnel des services et l'application présidentielle, hors API. | Obligatoire |

### 2.4. EF-04 — Habilitations et besoin-d'en-connaître

| ID | Exigence | Priorité |
|---|---|---|
| EF-04.1 | Le système doit supporter quatre niveaux de classification : DR, CD, SD, TSD. | Obligatoire |
| EF-04.2 | L'accès à un dossier doit être conditionné par : habilitation ≥ classification du dossier ET appartenance au périmètre de besoin-d'en-connaître. | Obligatoire |
| EF-04.3 | Les habilitations doivent être révocables immédiatement. | Obligatoire |
| EF-04.4 | Le périmètre de besoin-d'en-connaître doit être défini par mots-clés, zones géographiques, périmètre fonctionnel, période. | Obligatoire |
| EF-04.5 | Toute consultation de dossier SD ou TSD doit être tracée individuellement. | Obligatoire |
| EF-04.6 | Le système doit produire un rapport hebdomadaire des consultations SD/TSD à destination du SG-CNS. | Obligatoire |

### 2.5. EF-05 — Module iDocument

| ID | Exigence | Priorité |
|---|---|---|
| EF-05.1 | iDocument doit chiffrer tous les fichiers au repos en AES-256. | Obligatoire |
| EF-05.2 | Les clés de chiffrement doivent être gérées par le HSM souverain. | Obligatoire |
| EF-05.3 | Un hash SHA-256 doit être calculé à chaque upload et vérifié à chaque lecture. | Obligatoire |
| EF-05.4 | iDocument doit refuser tout fichier dépassant 500 Mo par défaut (configurable par type de pièce). | Obligatoire |
| EF-05.5 | iDocument doit exposer une API interne à iCNS, iCom et iArchive. | Obligatoire |
| EF-05.6 | Chaque téléchargement, consultation, impression doit être journalisée. | Obligatoire |

### 2.6. EF-06 — Module iArchive

| ID | Exigence | Priorité |
|---|---|---|
| EF-06.1 | iArchive doit recevoir automatiquement les dossiers clôturés depuis iCNS. | Obligatoire |
| EF-06.2 | Le contenu archivé doit être strictement non modifiable. | Obligatoire |
| EF-06.3 | iArchive doit appliquer une politique de rétention par classification : DR (5 ans), CD (10 ans), SD (30 ans), TSD (50 ans). | Obligatoire |
| EF-06.4 | iArchive doit supporter une procédure de déclassification avec workflow d'approbation. | Obligatoire |
| EF-06.5 | iArchive doit permettre le versement aux Archives Nationales après déclassification. | Obligatoire |
| EF-06.6 | Un accès auditeur en lecture seule doit être possible sur mandat. | Obligatoire |

### 2.7. EF-07 — Module iCom

| ID | Exigence | Priorité |
|---|---|---|
| EF-07.1 | iCom doit gérer cinq types de communications : réquisition, note de coordination, directive, compte-rendu, demande d'éclaircissement. | Obligatoire |
| EF-07.2 | Chaque communication doit recevoir une référence unique. | Obligatoire |
| EF-07.3 | Chaque communication officielle doit être signée électroniquement (signature qualifiée). | Obligatoire |
| EF-07.4 | Un accusé de réception automatique et tracé doit être généré. | Obligatoire |
| EF-07.5 | iCom doit supporter trois niveaux d'urgence : Routine, Urgent, Flash. | Obligatoire |
| EF-07.6 | iCom doit déclencher une escalade automatique au SG-CNS sur une communication Flash non lue après 1 heure. | Obligatoire |
| EF-07.7 | Une communication doit pouvoir être rattachée à un dossier iCNS. | Souhaitable |

### 2.8. EF-08 — Audit et traçabilité

| ID | Exigence | Priorité |
|---|---|---|
| EF-08.1 | Chaque action utilisateur doit être enregistrée dans un journal d'audit immuable. | Obligatoire |
| EF-08.2 | Le journal d'audit doit utiliser un chaînage cryptographique (chaque entrée référence le hash de la précédente). | Obligatoire |
| EF-08.3 | Le journal doit être sauvegardé séparément du système opérationnel. | Obligatoire |
| EF-08.4 | Un auditeur habilité doit pouvoir consulter le journal sur mandat, sans accès au contenu des dossiers. | Obligatoire |
| EF-08.5 | Le journal doit être vérifiable cryptographiquement par un tiers indépendant. | Obligatoire |

---

## 3. Exigences techniques

### 3.1. ET-01 — Infrastructure

| ID | Exigence | Priorité |
|---|---|---|
| ET-01.1 | Hébergement exclusif en territoire gabonais. | Obligatoire |
| ET-01.2 | Aucune dépendance fonctionnelle à un opérateur cloud étranger. | Obligatoire |
| ET-01.3 | Deux sites physiques distants (primaire et repli). | Obligatoire |
| ET-01.4 | Réplication synchrone des données critiques entre sites. | Obligatoire |
| ET-01.5 | Site de repli opérationnel en moins de 4 heures. | Obligatoire |
| ET-01.6 | Test du PCO semestriel obligatoire. | Obligatoire |

### 3.2. ET-02 — Sécurité applicative

| ID | Exigence | Priorité |
|---|---|---|
| ET-02.1 | Chiffrement TLS 1.3 sur toutes les communications. | Obligatoire |
| ET-02.2 | Chiffrement AES-256 au repos sur tous les contenus de dossiers et pièces. | Obligatoire |
| ET-02.3 | Gestion des clés par HSM souverain certifié. | Obligatoire |
| ET-02.4 | Authentification multi-facteurs obligatoire : carte agent + PIN + biométrie. | Obligatoire |
| ET-02.5 | Signature électronique qualifiée pour toute action de signature. | Obligatoire |
| ET-02.6 | Session inactive déconnectée automatiquement après 15 minutes. | Obligatoire |
| ET-02.7 | Verrouillage automatique du poste après déconnexion. | Obligatoire |

### 3.3. ET-03 — Postes utilisateurs

| ID | Exigence | Priorité |
|---|---|---|
| ET-03.1 | Postes durcis avec système d'exploitation contrôlé. | Obligatoire |
| ET-03.2 | Aucun port USB en sortie. | Obligatoire |
| ET-03.3 | Bluetooth et Wi-Fi désactivés au niveau matériel. | Obligatoire |
| ET-03.4 | Filtre de confidentialité écran obligatoire. | Obligatoire |
| ET-03.5 | Caméras désactivées physiquement. | Obligatoire |
| ET-03.6 | EDR installé et supervisé. | Obligatoire |
| ET-03.7 | Audit régulier d'intégrité (EDR + physique). | Obligatoire |

### 3.4. ET-04 — Stack technique

| ID | Exigence | Priorité |
|---|---|---|
| ET-04.1 | Back-end : Convex (instance souveraine). | Obligatoire |
| ET-04.2 | Front-end : React + TypeScript, bundles séparés par profil. | Obligatoire |
| ET-04.3 | Bases de données : chiffrées au repos via HSM. | Obligatoire |
| ET-04.4 | Pas de dépendance critique à un CDN ou service externe. | Obligatoire |
| ET-04.5 | Code source dans un dépôt souverain, à droits restreints. | Obligatoire |

### 3.5. ET-05 — Performance

| ID | Exigence | Priorité |
|---|---|---|
| ET-05.1 | Temps de réponse moyen d'une consultation de dossier : < 2 secondes. | Obligatoire |
| ET-05.2 | Temps de transmission d'un dossier au CNS : < 5 secondes. | Obligatoire |
| ET-05.3 | Délai d'escalade Flash : alerte au SG-CNS en moins de 1 minute. | Obligatoire |
| ET-05.4 | Capacité simultanée : 500 utilisateurs actifs. | Obligatoire |
| ET-05.5 | Stockage initial : 50 To extensibles à 500 To. | Obligatoire |

### 3.6. ET-06 — Disponibilité

| ID | Exigence | Priorité |
|---|---|---|
| ET-06.1 | Taux de disponibilité visé : 99,9 % hors maintenance planifiée. | Obligatoire |
| ET-06.2 | Maintenance planifiée hors heures opérationnelles, avec préavis 72 h. | Obligatoire |
| ET-06.3 | Sauvegardes quotidiennes complètes chiffrées sur site de repli. | Obligatoire |
| ET-06.4 | RPO (Recovery Point Objective) : < 15 minutes. | Obligatoire |
| ET-06.5 | RTO (Recovery Time Objective) : < 4 heures. | Obligatoire |

---

## 4. Exigences de sécurité

### 4.1. ES-01 — Personnel NTSAGUI

| ID | Exigence | Priorité |
|---|---|---|
| ES-01.1 | Tous les intervenants NTSAGUI doivent être habilités Secret Défense avant prise de poste. | Obligatoire |
| ES-01.2 | Enquête administrative préalable pour chaque intervenant. | Obligatoire |
| ES-01.3 | Engagement de confidentialité personnel signé, valable après la mission. | Obligatoire |
| ES-01.4 | Le SG-CNS peut exiger la révocation immédiate d'un intervenant. | Obligatoire |

### 4.2. ES-02 — Locaux et postes NTSAGUI

| ID | Exigence | Priorité |
|---|---|---|
| ES-02.1 | Locaux NTSAGUI dédiés au projet, séparés des autres activités. | Obligatoire |
| ES-02.2 | Contrôle d'accès biométrique aux locaux. | Obligatoire |
| ES-02.3 | Postes de développement durcis, sans Internet direct. | Obligatoire |
| ES-02.4 | Sas de sortie de code contrôlé pour tout transfert vers les environnements client. | Obligatoire |
| ES-02.5 | Aucune donnée réelle ne doit entrer dans les environnements NTSAGUI. | Obligatoire |

### 4.3. ES-03 — Audits

| ID | Exigence | Priorité |
|---|---|---|
| ES-03.1 | Audit de conformité initial à M5 par cabinet indépendant. | Obligatoire |
| ES-03.2 | Audit de sécurité externe (intrusion + code + organisation) à M15. | Obligatoire |
| ES-03.3 | Audit annuel récurrent inclus en maintenance. | Obligatoire |
| ES-03.4 | Cabinet d'audit certifié, indépendant de NTSAGUI. | Obligatoire |

### 4.4. ES-04 — Continuité et reprise

| ID | Exigence | Priorité |
|---|---|---|
| ES-04.1 | Plan de Continuité Opérationnelle (PCO) documenté et testé semestriellement. | Obligatoire |
| ES-04.2 | Procédure dégradée papier pour traitement Flash en cas d'indisponibilité totale. | Obligatoire |
| ES-04.3 | Plan de Reprise d'Activité (PRA) testé annuellement. | Obligatoire |

### 4.5. ES-05 — Souveraineté du code

| ID | Exigence | Priorité |
|---|---|---|
| ES-05.1 | Le code source est la propriété pleine et entière de la République Gabonaise. | Obligatoire |
| ES-05.2 | Dépôt en séquestre à chaque livraison majeure auprès d'une autorité désignée. | Obligatoire |
| ES-05.3 | Documentation technique exhaustive remise à M16. | Obligatoire |
| ES-05.4 | Réversibilité totale garantie : à tout moment, le CNS peut reprendre l'opération. | Obligatoire |

---

## 5. Exigences qualité

### 5.1. EQ-01 — Méthodologie

| ID | Exigence | Priorité |
|---|---|---|
| EQ-01.1 | Démarche itérative par sprints de 4 semaines. | Obligatoire |
| EQ-01.2 | Revue de code à quatre yeux systématique. | Obligatoire |
| EQ-01.3 | Revue sécurité formelle en fin de sprint, en présence du RSSI. | Obligatoire |
| EQ-01.4 | Validation de chaque incrément par le SG-CNS ou son représentant. | Obligatoire |

### 5.2. EQ-02 — Tests

| ID | Exigence | Priorité |
|---|---|---|
| EQ-02.1 | Couverture de tests unitaires : minimum 80 %. | Obligatoire |
| EQ-02.2 | Tests d'intégration automatisés pour chaque module. | Obligatoire |
| EQ-02.3 | Tests de charge avant chaque mise en production. | Obligatoire |
| EQ-02.4 | Tests d'intrusion à M15 par cabinet certifié. | Obligatoire |
| EQ-02.5 | Tests utilisateurs avec représentants des services pilotes en P3 et P4. | Obligatoire |

### 5.3. EQ-03 — Documentation

| ID | Exigence | Priorité |
|---|---|---|
| EQ-03.1 | Documentation fonctionnelle par module, à jour. | Obligatoire |
| EQ-03.2 | Documentation technique : architecture, déploiement, exploitation. | Obligatoire |
| EQ-03.3 | Manuels utilisateurs par profil (agent, direction, CNS, SG-CNS). | Obligatoire |
| EQ-03.4 | Procédures opérationnelles documentées. | Obligatoire |
| EQ-03.5 | Documentation en français, classifiée selon le contenu. | Obligatoire |

---

## 6. Exigences de livraison

### 6.1. EL-01 — Calendrier

| ID | Exigence | Priorité |
|---|---|---|
| EL-01.1 | Durée totale : 18 mois (M1 → M18). | Obligatoire |
| EL-01.2 | Pilote opérationnel restreint à M12. | Obligatoire |
| EL-01.3 | Mise en service intégrale à M18. | Obligatoire |
| EL-01.4 | Pénalités de retard contractualisées en cas de dépassement des jalons critiques (M12, M18). | Obligatoire |

### 6.2. EL-02 — Livrables obligatoires

| Phase | Livrable | Échéance |
|---|---|---|
| P1 | Spécifications fonctionnelles détaillées | M2 |
| P1 | DAT (Dossier d'Architecture Technique) | M2 |
| P1 | DSI (Dossier de Sécurité Initial) | M2 |
| P2 | Infrastructure souveraine opérationnelle | M5 |
| P2 | Rapport d'audit de conformité initial | M5 |
| P3 | Module iDocument opérationnel | M6 |
| P3 | Lot 1 : modules agent et direction | M8 |
| P4 | Module iCom opérationnel | M9 |
| P4 | Lot 2 : cellule CNS, module SG-CNS | M11 |
| P4 | Pilote opérationnel restreint en production | M12 |
| P5 | Module iArchive opérationnel | M13 |
| P5 | API présidentielle (contrats, endpoints, mTLS) | M13 |
| P5 | Documentation API + cahier de tests | M13 |
| P5 | Lot 3 : API présidentielle, Crise, services restants | M14 |
| P6 | Rapport d'audit de sécurité externe | M15 |
| P6 | Documentation technique exhaustive | M16 |
| P6 | Plans de formation et supports | M16 |
| P6 | PCO validé | M16 |
| P6 | Mise en service intégrale — PV de réception | M18 |

### 6.3. EL-03 — Formation

| ID | Exigence | Priorité |
|---|---|---|
| EL-03.1 | Formation des agents des 13 services. | Obligatoire |
| EL-03.2 | Formation des administrateurs internes (CNS / SILAM). | Obligatoire |
| EL-03.3 | Supports pédagogiques fournis (manuels, vidéos, fiches). | Obligatoire |
| EL-03.4 | Formation de formateurs internes pour la pérennité. | Obligatoire |

---

## 7. Gouvernance contractuelle

### 7.1. Comité de pilotage stratégique

- **Président :** Secrétaire Général du Conseil National de Sécurité.
- **Membres :** Directeurs des services pilotes, RSSI, Directeur de projet NTSAGUI.
- **Fréquence :** mensuelle.
- **Pouvoirs :** validation des jalons, arbitrages, gestion des risques, validation des changements de périmètre.

### 7.2. Comité technique

- **Animation :** Directeur de projet NTSAGUI.
- **Membres :** Architectes NTSAGUI, référents techniques services.
- **Fréquence :** hebdomadaire.

### 7.3. Comité de sécurité

- **Président :** RSSI désigné par la Présidence.
- **Convocation :** à la demande, ou systématique avant chaque jalon majeur.

### 7.4. Reporting

- Rapport mensuel d'avancement au SG-CNS.
- Rapport hebdomadaire technique.
- Rapport d'audit à chaque jalon.
- Alerte immédiate en cas d'incident significatif.

---

## 8. Conditions financières

Les conditions financières feront l'objet d'une convention distincte, signée par le SG-CNS et l'autorité budgétaire compétente, à l'issue de la Phase 1 (M2) sur la base du DAT validé. Les modalités de paiement seront alignées sur les jalons de livraison.

---

## 9. Maintenance et garantie

### 9.1. Garantie

- Garantie de bon fonctionnement de 12 mois à compter du PV de mise en service intégrale (M18).
- Pendant la garantie, toute anomalie est corrigée gratuitement par NTSAGUI dans un délai maximum de :
  - 4 heures pour une anomalie bloquante (P0)
  - 24 heures pour une anomalie majeure (P1)
  - 5 jours ouvrés pour une anomalie mineure (P2)

### 9.2. Maintenance post-garantie

- Maintenance corrective 24/7 — astreinte permanente.
- Maintenance évolutive par lots semestriels.
- Audit de sécurité annuel obligatoire.
- Contrat de maintenance triennal renouvelable.

### 9.3. Transfert de compétences

- Année 1 (M6 → M18) : immersion d'ingénieurs internes dans l'équipe NTSAGUI.
- Année 2 : co-maintenance.
- Année 3 : maintenance opérée en interne, NTSAGUI en support niveau 3.

---

## 10. Pénalités et résiliation

### 10.1. Pénalités de retard

- Jalons critiques (M12, M18) : pénalité contractualisée par jour de retard.
- Jalons intermédiaires : pénalité plafonnée, sur sollicitation du Comité de pilotage.

### 10.2. Résiliation

- Pour faute grave : possibilité de résiliation immédiate par le SG-CNS.
- Pour manquement aux exigences de sécurité : résiliation de plein droit.
- En cas de résiliation, le code source en séquestre est libéré à la République Gabonaise.

---

## 11. Annexes

- Annexe A — Spécification Fonctionnelle iCNS v1.0
- Annexe B — Plan de Développement v2.0
- Annexe C — Prompts d'implémentation (document séparé)
- Annexe D — Référentiel de classification et d'habilitations (à produire en P1)
- Annexe E — Modèle de convention de partage de renseignement inter-services (à produire en P1)

---

*Fin du Cahier des Charges — iCNS — NTSAGUI Digital / CNS — Mai 2026*
*CONFIDENTIEL DÉFENSE*

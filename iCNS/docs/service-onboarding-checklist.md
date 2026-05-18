# Checklist d'onboarding d'un service iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §6.1 — Prompt 6.3
**À remplir** pour chaque service à basculer en production
**Validation** : RSSI du service + Directeur de projet NTSAGUI

## Service concerné : ___________________  Date prévue : ___ / ___ / ____

## 1. Infrastructure et postes

- [ ] N postes durcis livrés et installés sur site
- [ ] OS contrôlé installé et durci (ET-03.1)
- [ ] Ports USB désactivés matériellement (ET-03.2)
- [ ] Bluetooth et Wi-Fi désactivés matériellement (ET-03.3)
- [ ] Filtres de confidentialité écran installés (ET-03.4)
- [ ] Caméras désactivées physiquement (ET-03.5)
- [ ] EDR installé et supervisé (ET-03.6)
- [ ] Audit d'intégrité initial signé par le RSSI (ET-03.7)
- [ ] Inventaire des postes consigné (modèles, n° de série, agents affectés)

## 2. PKI et cartes agents

- [ ] Liste nominative des agents à provisionner validée par le directeur du service
- [ ] Cartes agents émises par la PKI souveraine (X.509)
- [ ] Cartes distribuées en main propre, sous accusé signé
- [ ] PIN initial communiqué par canal séparé (papier sous pli scellé)
- [ ] Capture biométrique réalisée pour chaque agent (gabarits stockés sur poste durci uniquement)

## 3. Habilitations

- [ ] Tableau des habilitations rempli pour chaque agent :
  - matricule, rôle iCNS, classificationMax (DR/CD/SD/TSD), périmètre BdC
- [ ] Validation par le RSSI du service
- [ ] Import dans la table `habilitations` via interface admin

## 4. Formations

- [ ] Officiers traitants formés (4 h, support manuel)
- [ ] Chefs de section formés (6 h, focus workflow + visa)
- [ ] Directeur de service formé (4 h, focus signature qualifiée + sécurité)
- [ ] Référent technique du service formé (8 h, focus admin + audit)
- [ ] Attestations de formation signées (archivées)

## 5. Procédures et documents

- [ ] Manuel utilisateur remis (1 exemplaire par agent, classifié selon contenu)
- [ ] Procédure dégradée papier disponible sur site (ES-04.2)
- [ ] Liste de contact d'urgence affichée (RSSI, SG-CNS, NTSAGUI 24/7)
- [ ] Engagement de confidentialité signé par chaque agent

## 6. Tests fonctionnels avant Go

À effectuer en présence du référent NTSAGUI :

- [ ] Connexion carte + PIN + biométrie : OK pour 3 agents pilotes
- [ ] Création d'un dossier de test (type DEMO, classification DR) : OK
- [ ] Soumission au chef → visa → signature directeur → transmission CNS : OK
- [ ] Copie classifiée créée sur le service producteur : OK
- [ ] Lecture côté cellule CNS confirmée
- [ ] Communication iCom Routine reçue : OK + accusé
- [ ] Communication Flash test → escalade SG-CNS observée

## 7. Validation finale

- [ ] PV de bascule du service signé par : Directeur de service, RSSI service, Directeur projet NTSAGUI
- [ ] Date et heure d'ouverture effective consignées
- [ ] Période d'observation 72 h démarrée

# Plan de bascule en production — iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §6 (EL-01) — Prompt 6.3
**Période** : M15 → M18 (6 semaines de bascule progressive)
**Décideur final** : SG-CNS

## 1. Approche

Bascule progressive en **3 vagues** sur les 13 services, avec **PV de validation SG-CNS avant chaque vague** et **fenêtre d'observation de 72 h** entre les vagues.

```
M15 ───── M16 ───── M17 ───── M18
       │       │       │
       V1      V2      V3   ← PV de mise en service intégrale
```

### Vague 1 (S1–S2) — Services pilotes
- **B2** (sécurité d'État)
- **DGDI** (documentation et investigations)

### Vague 2 (S3–S4) — Renseignement et défense
- **DGR**
- **DGSS**
- **SILAM**
- **Gendarmerie Nationale (GN)**
- **Garde Républicaine (GR)**

### Vague 3 (S5–S6) — Forces et administrations
- **FAG Terre**, **FAG Air**, **FAG Marine**
- **Police Nationale**
- **DGSP**
- **Douane**

## 2. Pré-requis communs à chaque vague

- [ ] Postes durcis provisionnés et acceptés par le RSSI du service
- [ ] Cartes agents émises et distribuées (PKI souveraine)
- [ ] Formations agents et directeurs effectuées
- [ ] Habilitations chargées dans `habilitations` (revue par le RSSI)
- [ ] Référents techniques NTSAGUI affectés au service (présence physique pendant la vague)
- [ ] Procédure de rollback testée en homologation

## 3. Checklist d'onboarding d'un service

Voir [docs/service-onboarding-checklist.md](./service-onboarding-checklist.md).

## 4. Procédure jour J

1. **J-1 — 17h** : annonce officielle au service par le directeur
2. **J — 06h** : équipe NTSAGUI sur place
3. **J — 06h30** : déploiement applicatif (rolling update Convex)
4. **J — 07h** : check-list de smoke test
   - [ ] `getCurrentUser` répond pour 1 agent du service
   - [ ] Création d'un dossier test type `DEMO`
   - [ ] Transmission test → copie classifiée créée
   - [ ] Lecture d'un dossier transmis depuis `cns-secure`
   - [ ] Inbox iCom vide initialement, ajout test OK
   - [ ] Aucune erreur dans `journal_audit`
5. **J — 08h** : ouverture aux utilisateurs du service
6. **J — 08h → 17h** : présence support NTSAGUI sur place
7. **J → J+3** : observation 72 h, métriques temps réel
   - Temps de réponse, taux d'erreur, alertes Flash escaladées
8. **J+3 — 14h** : revue avec SG-CNS → Go / No-Go pour vague suivante

## 5. Démantèlement progressif des circuits papier

À partir de la **semaine 4** (vague 2 stabilisée) :
- Arrêt de la production de notes papier pour communications < SD
- Réduction progressive des envois physiques inter-services
- Maintien d'un circuit papier pour les situations Flash en cas d'indisponibilité iCNS (procédure dégradée — ES-04.2)

## 6. PV de mise en service intégrale (M18)

Signataires : SG-CNS, RSSI, Directeur de projet NTSAGUI.

Contenu minimal :
- Liste exhaustive des 13 services basculés
- Indicateurs de fin de bascule (temps de réponse, taux d'erreur, nombre d'utilisateurs actifs)
- Confirmation absence de perte de données
- Liste des findings d'audit en cours de remédiation et leurs deadlines
- Accord pour démarrage de la **garantie 12 mois** (cf. CDC §9.1)

## 7. Annexes

- [Procédure de rollback](./rollback-procedures.md)
- [Checklist d'onboarding service](./service-onboarding-checklist.md)
- [Modèle de PV de vague](#) (à fournir au format Word avec en-tête classifié)

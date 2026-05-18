# Procédures de rollback — iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 — Prompt 6.3
**Décideur** : SG-CNS, sur avis du Directeur de projet NTSAGUI
**Délai cible** : retour à l'état antérieur en < 2 h

## 1. Quand déclencher un rollback ?

Critères de rollback (un seul suffit) :
- Taux d'erreur > 1 % sur les opérations critiques (création, transmission)
- Perte de données détectée
- Faille de sécurité critique exploitée
- RTO/RPO dépassés pendant l'observation 72 h

## 2. Procédure de rollback d'une vague

1. **Décision** — SG-CNS valide. Heure consignée dans le journal de crise.
2. **Geler** les écritures iCNS sur le périmètre concerné (read-only via flag global).
3. **Notifier** les services impactés par canal alternatif (SMS chiffré ou téléphonique).
4. **Revenir** au déploiement Convex précédent (procédure rolling rollback).
5. **Vérifier** :
   - Les écritures depuis le passage à la nouvelle version ne sont pas perdues
   - Le journal d'audit reste cohérent (`verifyAuditChain`)
   - Les sessions actives sont invalidées (les utilisateurs doivent se ré-authentifier)
6. **Réactiver** les écritures avec la version précédente.
7. **Communiquer** : note iCom Directive du SG-CNS aux directeurs des services.
8. **Post-mortem** dans les 7 jours.

## 3. Cas particulier — données déjà produites avec la nouvelle version

Si des dossiers / pièces ont été produits avec la nouvelle version :
- Les blobs chiffrés restent lisibles par la version précédente si la KEK n'a pas changé.
- Les nouveaux schémas (champs additionnels) sont ignorés sans casse par la version précédente (Convex tolère les champs en plus).
- Cas critique : si une migration de schéma destructrice a eu lieu → restauration depuis sauvegarde quotidienne (RPO 15 min — ET-06.4).

## 4. Rollback d'urgence — disponibilité du PCO

Si le rollback applicatif est impossible (anomalie infra) :
- Activer le **site de repli** (RTO < 4 h — ET-06.5) selon procédure PCO documentée.
- Service iCNS continue depuis le repli en lecture seule pendant l'investigation.

## 5. Rollback HSM / KEK

Cas exceptionnel — voir [docs/key-management.md §6 Récupération](./key-management.md) :
- 2 administrateurs sur 3 reconstituent la KEK de récupération (Shamir 2-of-3).
- Réinjection dans un nouveau HSM.
- Pendant la fenêtre, les déchiffrements sont indisponibles → service en mode dégradé.

## 6. Tests de rollback obligatoires

- En homologation **avant chaque vague** de bascule (M15+).
- Tous les **6 mois** pendant la maintenance (rotation annuelle de la KEK incluse).

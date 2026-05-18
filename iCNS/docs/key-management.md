# Gestion des clés cryptographiques iCNS

**Référence** : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.2, ET-02.3, ET-02.5) — Prompt 2.2
**Classification** : CONFIDENTIEL DÉFENSE — annexe sécurité
**Version** : 0.1 — Mai 2026

Ce document décrit la stratégie de gestion des clés cryptographiques iCNS — KEK, DEK, JWT signing — et les procédures opérationnelles de rotation, sauvegarde et récupération.

## 1. Architecture à deux niveaux (envelope encryption)

```
                ┌─────────────────────────────────────────────────────┐
                │     HSM SOUVERAIN (PKCS#11)                         │
                │                                                     │
                │   ┌───────────────────────────────────────────┐    │
                │   │  KEK active (Key Encryption Key)          │    │
                │   │  - AES-256                                │    │
                │   │  - jamais exportée                        │    │
                │   │  - rotation annuelle                      │    │
                │   └───────────────────────────────────────────┘    │
                │   ┌───────────────────────────────────────────┐    │
                │   │  KEK précédente (pendant fenêtre rotation)│    │
                │   └───────────────────────────────────────────┘    │
                └───────────────────┬─────────────────────────────────┘
                                    │ wrap / unwrap
                                    ▼
                ┌─────────────────────────────────────────────────────┐
                │  Convex backend (encrypt/decrypt service)           │
                │                                                     │
                │   - Génère une DEK par pièce/dossier (AES-256-GCM) │
                │   - Wrappe la DEK avec la KEK via HSM              │
                │   - Stocke {wrappedDEK, iv, ct, ctx} dans le doc   │
                └─────────────────────────────────────────────────────┘
```

**Avantages** :
- La KEK ne quitte jamais le HSM (ET-02.3).
- Chaque pièce a sa propre DEK : compromission d'une DEK = compromission d'une seule pièce.
- La rotation de la KEK ne nécessite **pas** de réchiffrer tous les contenus (qui pèsent peut-être plusieurs To) : seulement les DEK (~32 octets chacune), réchiffrement rapide.

## 2. Modes d'exécution

Le service de chiffrement supporte deux modes, contrôlés par `ICNS_CRYPTO_MODE` :

### 2.1. `dev` — développement et tests

- **KEK** : dérivée via PBKDF2-HMAC-SHA256 (200 000 itérations) à partir de `ICNS_KEK_DEV_PASSPHRASE`.
- **Salt** : constant (`iCNS-DEV-KEK-SALT-v1`) — garanti par le code (cf. `convex/crypto/dek_manager.ts`).
- **Cache** : la KEK dérivée est mémoïsée pour éviter le coût PBKDF2 sur chaque appel.
- **Limite** : la passphrase est lisible côté serveur Convex. Cette configuration est **strictement interdite en production**.

### 2.2. `hsm` — production

- **KEK** : stockée dans le HSM souverain. Convex actions appellent un sidecar PKCS#11 qui expose deux endpoints internes (mTLS) :
  - `POST /wrap` — paramètre : DEK en clair ; retour : blob wrappé.
  - `POST /unwrap` — paramètre : blob wrappé ; retour : DEK en clair.
- **Sidecar** : déployé sur un nœud durci séparé du back-end applicatif. Ne fait que pass-through vers le HSM. À implémenter en complément de Phase 2 (livrable M4–M5).
- **Authentification du sidecar** : mTLS avec certificat émis par la PKI souveraine. Liste des appelants autorisés gérée par le RSSI.

**Statut Mai 2026** : le mode `hsm` est défini en interface mais l'implémentation effective est portée par le livrable d'infrastructure M5. Les composants applicatifs sont prêts.

## 3. Algorithmes cryptographiques

| Usage | Algorithme | Notes |
|---|---|---|
| Chiffrement contenu | **AES-256-GCM** | Tag d'authentification 128 bits. IV 96 bits aléatoire par message. `contextKey` inclus comme AAD. |
| Wrap des DEK | **AES-256-GCM** (mode dev) | Sera **AES-KW (RFC 3394)** en prod si supporté par le HSM, sinon AES-GCM. |
| Dérivation KEK (dev) | **PBKDF2-HMAC-SHA256, 200 000 it.** | Recommandation OWASP 2023. |
| Signature JWT (dev) | **HMAC-SHA256** | cf. Prompt 2.1. |
| Signature JWT (prod) | **RSA-PSS-SHA256** ou **ECDSA-P256-SHA256** | Selon le HSM. À trancher en Prompt 2.2 (intégration). |
| Hash d'intégrité | **SHA-256** | Tables iCNS + journal d'audit. |

## 4. Sidecar HSM — spécification interne

### 4.1. Endpoints

```
POST /v1/wrap
  Body: { "dek": "<base64>", "keyLabel": "icns-kek-active" }
  Auth: mTLS — certificat client autorisé
  Réponse: { "wrappedDEK": "<base64>" }

POST /v1/unwrap
  Body: { "wrappedDEK": "<base64>", "keyLabel": "icns-kek-active" }
  Auth: mTLS
  Réponse: { "dek": "<base64>" }

GET /v1/active-key
  Auth: mTLS
  Réponse: { "keyLabel": "icns-kek-active", "rotationDue": "2027-05-12T..." }
```

### 4.2. Liste des appelants autorisés

Mainteue par le RSSI dans un fichier `/etc/icns-hsm-acl.yaml` :

```yaml
allowedClients:
  - serial: SN-CONVEX-PRIMARY
    cn: "CN=icns-convex-primary"
    role: read-write
  - serial: SN-CONVEX-REPLICA
    cn: "CN=icns-convex-replica"
    role: read-only
  - serial: SN-RSSI-ADMIN
    cn: "CN=rssi-admin"
    role: admin
```

### 4.3. Audit du sidecar

Toute requête est journalisée dans un fichier append-only `/var/log/icns-hsm/audit.log`, exporté toutes les 24h vers le système d'audit externe (out-of-band, cf. modèle de menace du journal d'audit).

## 5. Rotation de la KEK

### 5.1. Cadence

Rotation **annuelle**, programmée hors heures opérationnelles (week-end 2h-5h du matin). La date prévue est dans la réponse de `/v1/active-key`.

### 5.2. Procédure (sans interruption de service)

1. **J-30** : génération de la nouvelle KEK dans le HSM. Étiquetage `icns-kek-2027`.
2. **J-30 → J-1** : le sidecar accepte les deux KEK (`icns-kek-2026` et `icns-kek-2027`). Toutes les écritures nouvelles utilisent la nouvelle KEK.
3. **J-Day** : bascule de `keyLabel` par défaut sur la nouvelle KEK.
4. **J → J+30** : job batch nocturne qui parcourt toutes les pièces existantes, déchiffre chaque DEK avec l'ancienne KEK, la rewrap avec la nouvelle, met à jour le blob. Pendant cette fenêtre, l'application déchiffre transparemment dans les deux sens.
5. **J+30** : vérification que toutes les pièces sont passées sous la nouvelle KEK. Mise à la retraite de l'ancienne KEK (qui reste néanmoins dans le HSM pour les sauvegardes archivées — voir §6).
6. **J+30** : audit annuel obligatoire (ES-03.3).

### 5.3. Code applicatif — `rewrapDEK`

La fonction `rewrapDEK` du module `convex/crypto/dek_manager.ts` permet de réchiffrer une DEK existante sous une nouvelle KEK. En mode HSM, elle invoque deux fois le sidecar (`unwrap` avec ancienne KEK, `wrap` avec nouvelle KEK). En mode dev, elle utilise la KEK courante.

Voir `tests/crypto_integration.test.ts` (suite « Rotation de KEK ») pour un test reproductible de la procédure.

## 6. Sauvegardes et récupération

### 6.1. Sauvegarde des données chiffrées

Les blobs chiffrés (champs `encrypted*` du schéma) sont sauvegardés normalement par les sauvegardes Convex (cf. ET-06.3). Aucune mesure spéciale n'est nécessaire — leur valeur sans la KEK est nulle.

### 6.2. Sauvegarde des KEK

Le HSM dispose d'un mécanisme de **wrap d'export** sécurisé :
- 3 administrateurs HSM (RSSI, Architecte sécurité, Directeur DSI) détiennent chacun un fragment Shamir d'une **KEK de récupération** (split 2-of-3).
- À chaque rotation, le HSM exporte les KEK actives sous forme wrappée par la KEK de récupération.
- Les wraps exportés sont stockés sur 2 sites séparés (PCO + coffre RSSI).

### 6.3. Procédure de récupération

En cas de perte simultanée des deux HSM (PCO + secondaire) :

1. Convocation immédiate de 2 des 3 administrateurs (selon la matrice 2-of-3).
2. Reconstitution de la KEK de récupération à partir des deux fragments Shamir.
3. Réinjection des KEK wrappées exportées dans un nouveau HSM.
4. Reprise du service.

Temps de récupération cible (RTO) : < 4h (ET-06.5).

### 6.4. Test de récupération

Annuel obligatoire, dans le cadre du test du PRA (ES-04.3). Réalisé sur un environnement isolé qui simule la perte des HSM.

## 7. Variables d'environnement

### 7.1. Mode développement

```bash
# Convex
ICNS_CRYPTO_MODE=dev
ICNS_KEK_DEV_PASSPHRASE=<chaîne ≥ 32 caractères, à régénérer par déploiement>
ICNS_JWT_MODE=dev
ICNS_JWT_DEV_SECRET=<chaîne ≥ 32 caractères>
```

### 7.2. Mode production

```bash
# Convex
ICNS_CRYPTO_MODE=hsm
ICNS_HSM_SIDECAR_URL=https://hsm-sidecar.internal:8443
ICNS_HSM_SIDECAR_CERT_PATH=/run/secrets/convex-mtls.pem
ICNS_HSM_SIDECAR_KEY_PATH=/run/secrets/convex-mtls.key
ICNS_HSM_SIDECAR_CA_PATH=/run/secrets/pki-souveraine-ca.pem
ICNS_JWT_MODE=hsm
# JWT_DEV_SECRET non utilisé en hsm
```

Les variables Convex sont définies via `npx convex env set <KEY> <VALUE>` et stockées chiffrées par Convex.

## 8. Hypothèses et limites résiduelles

1. **Confiance dans le HSM** : si le HSM lui-même est compromis (extraction de clés via faille hardware, side-channel, vol physique), tout le système est compromis. Mitigation : audits HSM annuels, sceaux physiques, surveillance vidéo des bays HSM, redondance géographique.
2. **Confiance dans le runtime Convex** : si l'environnement Convex est compromis (root sur l'hôte), un attaquant peut intercepter les DEK déchiffrées en mémoire pendant qu'elles sont utilisées. Mitigation : durcissement OS, segmentation réseau, EDR (ET-03.6), revue d'accès trimestrielle.
3. **Confiance dans le sidecar** : le sidecar HSM est un point sensible. Mitigation : isolation réseau, mTLS strict, ACL `/etc/icns-hsm-acl.yaml` revue mensuellement par le RSSI.
4. **Pas de PFS pour les données chiffrées au repos** : si la KEK est compromise rétroactivement (ex. vol des sauvegardes Shamir + reconstruction), toutes les pièces wrappées sous cette KEK sont déchiffrables. Mitigation : rotation annuelle, déclassification automatique progressive (politique de rétention EF-06.3).

## 9. Roadmap d'intégration

| Jalon | Livrable | Statut |
|---|---|---|
| M3 | Mode dev opérationnel — encrypt/decrypt service + DEK manager + tests | ✅ (Prompt 2.2) |
| M4 | Spécification finale du sidecar HSM PKCS#11 + provisioning HSM physique | ⏳ |
| M5 | Branchement Convex action ↔ sidecar + tests sur SoftHSM en CI | ⏳ |
| M6 | Migration des pièces existantes vers les blobs chiffrés iCNS | ⏳ |
| M5/M16 | Procédures opérationnelles : rotation, sauvegarde Shamir, récupération | ⏳ doc à compléter en M16 |

# iCNS — Plateforme i-Conseil National de Sécurité

**Référence projet** : NTSAGUI/CNS/2026
**Classification** : CONFIDENTIEL DÉFENSE
**État** : 🟡 Phase 0 — bootstrap (M0)

## Présentation

iCNS est le système souverain de remontée, croisement et synthèse du renseignement national vers le Conseil National de Sécurité (CNS) du Gabon.

L'application orchestre les flux d'information entre les 13 services de renseignement et de sécurité, le secrétariat permanent du CNS et le Secrétaire Général du CNS (SG-CNS). Une API sécurisée alimente l'application présidentielle (hors périmètre) en synthèses signées.

Documents de référence (dans `../système de sécurité./`) :
- `iCNS-Cahier-des-Charges.md` — exigences contractuelles
- `iCNS-Spécification-Fonctionnelle.md` — spec fonctionnelle v1.0
- `iCNS-Plan-de-Developpement-NTSAGUI-Digital.pdf` — plan de développement
- `iCNS-Prompts-Implementation.md` — prompts d'implémentation par phase

## Origine du code

Cette application a été bootstrappée par fork de `executif.ga` (Espace Présidentiel) le 12 mai 2026, puis adaptée :

- ✅ Suppression du module **iAsted Page** (les composants partagés `components/iasted/*` sont conservés pour migration ultérieure vers ChatGPT)
- ✅ Suppression des espaces **Directeur de Cabinet**, **Cabinet Privé**, **Directeur du Protocole**
- ✅ Suppression de l'intégration **ElevenLabs** (sera remplacée par OpenAI / ChatGPT)
- ⏳ **Firebase** et **Supabase** conservés temporairement — migration prévue en Phase 2 (cf. Prompt 2.1 / 2.2) vers PKI souveraine + HSM PKCS#11
- ⏳ Schéma Convex actuel à refondre en Phase 1 (cf. Prompt 1.1) pour intégrer les 11 tables iCNS (dossiers_renseignement, pièces, types_dossier, parcours, copies_classifiees, journal_audit chaîné, habilitations, etc.)

## Stack

- **Vite 5** + **React 18** + **TypeScript** + **Tailwind CSS**
- **Convex** (back-end) — à migrer vers instance souveraine
- **Radix UI** (Shadcn) + **Framer Motion**
- **Zustand** (state) + **TanStack Query**
- **react-hook-form** + **zod**
- **react-router-dom** v6
- **sonner** (toasts), **lucide-react** (icônes)

## Démarrage

Pré-requis : Node.js ≥ 18 ou Bun.

```sh
# 1. Installer les dépendances
bun install
# ou : npm install

# 2. Copier le template d'environnement
cp .env.example .env.local
# puis remplir VITE_CONVEX_URL et VITE_FIREBASE_* a minima

# 3. Lancer le serveur de développement
bun run dev
# ou : npm run dev

# 4. (optionnel) Démarrer Convex en parallèle
bun run dev:convex
# ou les deux ensemble
bun run dev:all
```

## Roadmap (18 mois — M1 → M18)

| Phase | Période | Livrables principaux |
|---|---|---|
| **P1 — Cadrage** | M1–M2 | DAT, DSI, schéma Convex iCNS (Prompts 1.1, 1.2) |
| **P2 — Socle sécurité** | M3–M5 | Auth carte agent, HSM PKCS#11, infra souveraine (Prompts 2.1, 2.2) |
| **P3 — Lot 1** | M6–M8 | iDocument durci, gestion dossiers, UI Officier Traitant (Prompts 3.1–3.3) |
| **P4 — Lot 2** | M9–M11 | iCom, croisement CNS, cockpit SG-CNS (Prompts 4.1–4.3) |
| **P5 — Lot 3** | M12–M14 | iArchive, API présidentielle, module Crise (Prompts 5.1–5.3) |
| **P6 — Homologation** | M15–M18 | Tests de charge, audit sécurité externe, bascule (Prompts 6.1–6.3) |

## Modules en place (état actuel)

| Module | Statut | Source |
|---|---|---|
| iDocument | 🟡 Hérité de `executif.ga` — à durcir (HSM, AES-256, hash) | `src/components/idocument/`, `src/services/idocument/`, `convex/` |
| iArchive | 🟡 Hérité — à durcir (append-only, rétention DR/CD/SD/TSD) | `src/components/iarchive/`, `src/services/iarchive/` |
| iCorrespondance → iCom | 🟡 Hérité — à étendre (5 types comms, urgences, Flash) | `src/components/icorrespondance/`, `src/services/icorrespondance/` |
| Cellule de coordination CNS | 🔴 À créer (Prompt 4.2) | — |
| Cockpit SG-CNS | 🟡 `SecretariatGeneralSpace.tsx` à refondre | `src/pages/SecretariatGeneralSpace.tsx` |
| API présidentielle | 🔴 À créer (Prompt 5.2) | — |
| Module Crise | 🔴 À créer (Prompt 5.3) | — |
| Journal d'audit chaîné | 🔴 À créer en remplacement de `auditLogService` (Prompt 1.2) | `src/services/auditLogService.ts` (legacy) |

## Sécurité

**ATTENTION** : pendant la phase de développement, AUCUNE donnée réelle ne doit être saisie. L'environnement n'est pas encore homologué CONFIDENTIEL DÉFENSE.

- Les contenus chiffrés AES-256 + HSM ne seront opérationnels qu'à partir de Phase 2 (M3+).
- L'authentification multi-facteurs (carte agent + PIN + biométrie) n'est pas encore en place.
- Le journal d'audit immuable (chaînage SHA-256) reste à implémenter.

Pour signaler un incident ou une vulnérabilité : contacter le RSSI désigné par la Présidence (jamais de canal externe).

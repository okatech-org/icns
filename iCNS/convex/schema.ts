// Schéma Convex iCNS — Conseil National de Sécurité
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01) à §2.8 (EF-08)
// Prompt d'implémentation : 1.1 (Modélisation du schéma de données iCNS)
//
// Principes de sécurité (ET-02) :
// - Tous les contenus sensibles sont chiffrés AES-256 côté application (HSM),
//   et stockés ici sous forme de chaîne `v.string()` opaque (jamais en clair).
// - Chaque table sensible porte un champ `hashIntegrite` (SHA-256) recalculé
//   à chaque modification (EF-01.7).
// - Toute opération d'écriture sur une table sensible doit déclencher l'ajout
//   d'une entrée dans `journal_audit` (chaînée SHA-256 — cf. Prompt 1.2).
//
// Convention :
// - Les tables iCNS portent des noms en français (snake_case) conformément à
//   la spec fonctionnelle.
// - Les tables LEGACY (héritées d'executif.ga) gardent leur nommage initial
//   et sont marquées comme telles. Elles seront retirées progressivement au
//   fur et à mesure de la mise en service des modules iCNS.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  classificationValidator,
  roleICNSValidator,
  serviceCodeValidator,
  statutDossierValidator,
  typePieceValidator,
  urgenceValidator,
} from "./validators/classification";

export default defineSchema({
  // ════════════════════════════════════════════════════════════════════
  // ─── iCNS — TABLES CŒUR (Prompt 1.1) ─────────────────────────────────
  // ════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────
  // Services — configuration des 13 services bénéficiaires (CDC §1.3).
  //
  // Source de vérité pour la liste des organismes producteurs.
  // ─────────────────────────────────────────────────────────────────────
  services: defineTable({
    code: serviceCodeValidator, // B2, DGDI, DGR, …
    nomComplet: v.string(), // « Direction Générale du Renseignement »
    typeOrganisme: v.union(
      v.literal("renseignement"),
      v.literal("force_defense"),
      v.literal("administration_securite"),
    ),
    parentServiceId: v.optional(v.id("services")), // pour les sous-services
    actif: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_actif", ["actif"]),

  // ─────────────────────────────────────────────────────────────────────
  // Utilisateurs iCNS — agents habilités.
  //
  // Note vie privée : le matricule est l'identifiant utilisé dans les index
  // d'audit et de croisement (EF-04.2 — jamais le nom en clair en index).
  // Les champs nominatifs (prénom, nom) sont chiffrés.
  // ─────────────────────────────────────────────────────────────────────
  utilisateurs: defineTable({
    matricule: v.string(), // identifiant interne anonyme — utilisé pour audit
    serviceId: v.id("services"),
    role: roleICNSValidator,
    encryptedPrenom: v.string(), // chiffré AES-256 (HSM)
    encryptedNom: v.string(), // chiffré AES-256 (HSM)
    encryptedEmail: v.optional(v.string()), // chiffré
    hashIntegrite: v.string(), // SHA-256 (matricule|prenom|nom|email|serviceId|role)
    actif: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Pour les profils techniques (RSSI, admin, auditeur), serviceId peut
    // pointer vers un service interne CNS.
  })
    .index("by_matricule", ["matricule"])
    .index("by_service", ["serviceId"])
    .index("by_role", ["role"])
    .index("by_actif", ["actif"]),

  // ─────────────────────────────────────────────────────────────────────
  // Habilitations — clearance + besoin-d'en-connaître (EF-04).
  //
  // Une habilitation porte sur un utilisateur, fixe la classification max
  // accessible et délimite le périmètre de besoin-d'en-connaître. Plusieurs
  // habilitations actives peuvent coexister (cumul des périmètres).
  // ─────────────────────────────────────────────────────────────────────
  habilitations: defineTable({
    utilisateurMatricule: v.string(), // référence à utilisateurs.matricule
    classificationMax: classificationValidator,
    // Périmètre de besoin-d'en-connaître (EF-04.4)
    perimetreMotsCles: v.array(v.string()), // mots-clés autorisés
    perimetreZonesGeo: v.array(v.string()), // zones (codes ISO ou interne)
    perimetreFonctionnel: v.array(v.string()), // domaines (terrorisme, narcotrafic, …)
    perimetreDateDebut: v.number(), // période — bornes en millis epoch
    perimetreDateFin: v.optional(v.number()),
    // Cycle de vie de l'habilitation
    valideAPartirDe: v.number(),
    valideJusquA: v.optional(v.number()),
    revoque: v.boolean(),
    motifRevocation: v.optional(v.string()), // chiffré si sensible
    delivreParMatricule: v.string(), // matricule de l'autorité ayant délivré
    horodatageDelivrance: v.number(),
  })
    .index("by_utilisateur", ["utilisateurMatricule"])
    .index("by_utilisateur_actif", ["utilisateurMatricule", "revoque"])
    .index("by_classification_max", ["classificationMax"]),

  // ─────────────────────────────────────────────────────────────────────
  // Schémas de référence — patterns de génération de référence classifiée.
  //
  // Exemple : `{code}/{yyyy}/{servicecode}/{classification}/{seq}`
  // produit `MP/2026/DGSS/TSD/0007` (Prompt 1.1).
  // ─────────────────────────────────────────────────────────────────────
  schemas_reference: defineTable({
    code: v.string(), // ex. "MP", "RC"
    label: v.string(),
    pattern: v.string(), // ex. "{code}/{yyyy}/{service}/{classification}/{seq}"
    seqWidth: v.number(), // largeur de la séquence (ex. 4 pour 0007)
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // ─────────────────────────────────────────────────────────────────────
  // Types de dossier — configuration métier (EF-01.4).
  //
  // Définit, pour chaque type de dossier, le schéma de référence à utiliser,
  // la classification minimale, le parcours d'évaluation, la durée de
  // rétention et les services producteurs autorisés.
  // ─────────────────────────────────────────────────────────────────────
  types_dossier: defineTable({
    code: v.string(), // ex. "MP" (Mise en cause Personnelle)
    label: v.string(),
    description: v.optional(v.string()),
    schemaReferenceId: v.id("schemas_reference"),
    classificationMin: classificationValidator,
    dureeRetentionAns: v.number(), // 5 / 10 / 30 / 50 selon classif (EF-06.3)
    servicesProducteursAutorises: v.array(serviceCodeValidator),
    // Parcours d'évaluation : liste ordonnée d'étapes avec rôle requis,
    // condition de passage et délai cible.
    parcours: v.array(
      v.object({
        index: v.number(),
        code: v.string(), // ex. "constitution", "validation_section"
        label: v.string(),
        roleRequis: roleICNSValidator,
        delaiCibleHeures: v.number(),
        peutRenvoyer: v.boolean(), // l'étape peut renvoyer à l'étape précédente
      }),
    ),
    actif: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_actif", ["actif"]),

  // ─────────────────────────────────────────────────────────────────────
  // Dossiers de renseignement — table principale (EF-01).
  //
  // Le titre et les notes sensibles sont chiffrés.
  // Le `hashIntegrite` couvre l'ensemble des champs critiques et est
  // recalculé à chaque modification.
  // ─────────────────────────────────────────────────────────────────────
  dossiers_renseignement: defineTable({
    reference: v.string(), // ex. "MP/2026/DGSS/TSD/0007" — générée à la création
    typeDossierId: v.id("types_dossier"),
    classification: classificationValidator,
    urgence: urgenceValidator,
    statut: statutDossierValidator,
    serviceProducteurCode: serviceCodeValidator,
    currentEtapeIndex: v.number(), // index dans types_dossier.parcours
    encryptedTitre: v.string(), // chiffré AES-256
    encryptedSynthese: v.optional(v.string()), // chiffré AES-256 (résumé)
    hashIntegrite: v.string(), // SHA-256
    // Cycle de vie
    createdByMatricule: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Validation hiérarchique (EF-01.5)
    signedByDirecteurMatricule: v.optional(v.string()),
    signatureQualifieeBlob: v.optional(v.string()), // signature qualifiée (HSM)
    signatureAt: v.optional(v.number()),
    // Transmission au CNS (EF-01.6)
    transmittedAt: v.optional(v.number()),
    transmittedToService: v.optional(v.string()), // "CNS_SECRETARIAT" en général
    // Suspension (EF-01.8) / clôture (EF-01.9)
    suspendedAt: v.optional(v.number()),
    suspendReason: v.optional(v.string()),
    resumedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    closeMotif: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    // Liaison à une crise éventuelle (cf. Prompt 5.3)
    crisisLabel: v.optional(v.string()),
  })
    .index("by_reference", ["reference"])
    .index("by_classification", ["classification"])
    .index("by_service_producteur", ["serviceProducteurCode"])
    .index("by_statut", ["statut"])
    .index("by_urgence", ["urgence"])
    .index("by_createdAt", ["createdAt"])
    .index("by_crisis", ["crisisLabel"])
    .index("by_service_statut", ["serviceProducteurCode", "statut"]),

  // ─────────────────────────────────────────────────────────────────────
  // Pièces — éléments composant un dossier (EF-01.3).
  //
  // Les pièces probantes binaires sont stockées via iDocument
  // (fileStorageId pointe vers Convex `_storage`). Les notes textuelles sont
  // stockées chiffrées dans `encryptedContent`.
  // ─────────────────────────────────────────────────────────────────────
  pieces: defineTable({
    dossierId: v.id("dossiers_renseignement"),
    typePiece: typePieceValidator,
    libelle: v.string(), // libellé court — peut être en clair (peu sensible)
    encryptedContent: v.optional(v.string()), // contenu textuel chiffré
    fileStorageId: v.optional(v.id("_storage")), // pour pièces binaires (iDocument)
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    hashIntegrite: v.string(), // SHA-256
    addedByMatricule: v.string(),
    addedAt: v.number(),
    obligatoire: v.boolean(), // selon la config du type_dossier
    // Pour les pièces signées (avis du directeur, etc.)
    signatureQualifieeBlob: v.optional(v.string()),
    signedByMatricule: v.optional(v.string()),
    signedAt: v.optional(v.number()),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_dossier_type", ["dossierId", "typePiece"])
    .index("by_addedBy", ["addedByMatricule"]),

  // ─────────────────────────────────────────────────────────────────────
  // Étapes du parcours — instances par dossier (EF-01.4).
  //
  // Une ligne par étape franchie dans le parcours du dossier. Permet de
  // tracer qui a travaillé sur le dossier, à quelle étape et combien de
  // temps.
  // ─────────────────────────────────────────────────────────────────────
  etapes_parcours: defineTable({
    dossierId: v.id("dossiers_renseignement"),
    etapeIndex: v.number(), // doit correspondre à types_dossier.parcours[i].index
    etapeCode: v.string(), // copie du code pour résilience aux changements
    etapeLabel: v.string(),
    contributeursMatricules: v.array(v.string()),
    dateEntree: v.number(),
    dateSortie: v.optional(v.number()),
    motifSortie: v.optional(
      v.union(
        v.literal("transmission"),
        v.literal("renvoi"),
        v.literal("suspension"),
        v.literal("cloture"),
      ),
    ),
    motifRenvoi: v.optional(v.string()), // détail en cas de renvoi
    suspendue: v.boolean(),
    etat: v.union(
      v.literal("en_cours"),
      v.literal("terminee"),
      v.literal("suspendue"),
    ),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_dossier_etape", ["dossierId", "etapeIndex"]),

  // ─────────────────────────────────────────────────────────────────────
  // Copies classifiées — copie read-only laissée sur le service producteur
  // après transmission (EF-01.6).
  //
  // Snapshot immuable du dossier au moment de la transmission. Porte un
  // tampon visuel « COPIE — Transmise le … vers … » et l'impression est
  // bloquée sauf autorisation explicite.
  // ─────────────────────────────────────────────────────────────────────
  copies_classifiees: defineTable({
    dossierOriginalId: v.id("dossiers_renseignement"),
    referenceOriginale: v.string(), // copie de la référence du dossier source
    serviceProducteurCode: serviceCodeValidator,
    classification: classificationValidator,
    dateTransmission: v.number(),
    destinataire: v.string(), // ex. "CNS_SECRETARIAT"
    encryptedSnapshot: v.string(), // snapshot complet chiffré
    hashIntegrite: v.string(), // SHA-256 du snapshot
    impressionAutorisee: v.boolean(), // par défaut false
    autorisationImpressionParMatricule: v.optional(v.string()),
    autorisationImpressionAt: v.optional(v.number()),
  })
    .index("by_dossier_original", ["dossierOriginalId"])
    .index("by_service_producteur", ["serviceProducteurCode"])
    .index("by_dateTransmission", ["dateTransmission"]),

  // ─────────────────────────────────────────────────────────────────────
  // Consultations de dossiers — traçabilité fine SD/TSD (EF-04.5).
  //
  // Toute consultation d'un dossier SD ou TSD doit être tracée
  // individuellement. Les classifications DR/CD sont tracées via le journal
  // d'audit générique uniquement.
  // ─────────────────────────────────────────────────────────────────────
  consultations_dossier: defineTable({
    utilisateurMatricule: v.string(),
    dossierId: v.id("dossiers_renseignement"),
    referenceDossier: v.string(), // copie de réf pour faciliter l'audit
    classificationDossier: classificationValidator,
    typeConsultation: v.union(
      v.literal("lecture"),
      v.literal("telechargement_piece"),
      v.literal("impression"),
      v.literal("export_synthese"),
    ),
    horodatage: v.number(),
    adresseIP: v.string(),
    poste: v.string(), // identifiant du poste durci
    serviceUtilisateur: serviceCodeValidator,
  })
    .index("by_dossier", ["dossierId"])
    .index("by_utilisateur", ["utilisateurMatricule"])
    .index("by_horodatage", ["horodatage"])
    .index("by_classification", ["classificationDossier"]),

  // ─────────────────────────────────────────────────────────────────────
  // Journal d'audit — entrée immuable chaînée SHA-256 (EF-08, Prompt 1.2).
  //
  // L'append est strictement séquentiel. `hashEntreeCourante` est calculé
  // comme SHA-256(tous les autres champs concaténés, y compris
  // `hashEntreePrecedente`). Voir `convex/audit.ts` pour la mutation.
  // ─────────────────────────────────────────────────────────────────────
  journal_audit: defineTable({
    sequence: v.number(), // numéro d'ordre incrémental (1-based)
    utilisateurMatricule: v.string(),
    serviceUtilisateur: serviceCodeValidator,
    action: v.string(), // ex. "DOSSIER_CREE", "DOSSIER_TRANSMIS", "PIECE_AJOUTEE"
    classificationDossier: v.optional(classificationValidator),
    dossierId: v.optional(v.id("dossiers_renseignement")),
    cibleEntiteType: v.optional(v.string()), // type d'entité ciblée
    cibleEntiteId: v.optional(v.string()),
    detail: v.optional(v.string()), // peut être chiffré si sensible
    horodatage: v.number(),
    adresseIP: v.string(),
    poste: v.string(),
    hashEntreePrecedente: v.string(), // hex SHA-256 (ou "GENESIS" pour la 1re)
    hashEntreeCourante: v.string(), // hex SHA-256 — clé de chaînage
  })
    .index("by_sequence", ["sequence"])
    .index("by_horodatage", ["horodatage"])
    .index("by_utilisateur", ["utilisateurMatricule"])
    .index("by_action", ["action"])
    .index("by_dossier", ["dossierId"])
    .index("by_hash_courant", ["hashEntreeCourante"]),

  // ─────────────────────────────────────────────────────────────────────
  // Sessions iCNS — JWT signés HSM, durée 15 min (ET-02.6 — Prompt 2.1).
  //
  // Une session est créée à chaque authentification réussie. Le JWT
  // contient (sub: matricule, sid: sessionId, exp: expiresAt) et est
  // signé par le HSM (RSA-PSS en prod, HMAC-SHA256 en dev). Le serveur
  // peut révoquer une session à tout moment via le flag `revoked`.
  // ─────────────────────────────────────────────────────────────────────
  sessions: defineTable({
    sessionToken: v.string(), // identifiant opaque utilisé comme `sid` dans le JWT
    utilisateurMatricule: v.string(),
    issuedAt: v.number(),
    expiresAt: v.number(), // issuedAt + 15 min (ET-02.6)
    lastActivityAt: v.number(), // mise à jour à chaque utilisation
    revoked: v.boolean(),
    revokedReason: v.optional(v.string()),
    revokedAt: v.optional(v.number()),
    adresseIPOuverture: v.string(),
    posteOuverture: v.string(),
    // Identité du certificat utilisé pour ouvrir la session (audit trail)
    certificatSerialNumber: v.string(),
    certificatIssuer: v.string(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_utilisateur", ["utilisateurMatricule"])
    .index("by_utilisateur_actif", ["utilisateurMatricule", "revoked"])
    .index("by_expiresAt", ["expiresAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // Tentatives d'authentification — succès et échecs (Prompt 2.1).
  //
  // Trace toute tentative d'authentification. Permet la détection de
  // brute-force et le verrouillage d'un compte après 5 échecs consécutifs.
  // Le déclenchement effectif du verrouillage est porté par la mutation
  // `authenticate` qui consulte cette table.
  // ─────────────────────────────────────────────────────────────────────
  auth_attempts: defineTable({
    utilisateurMatricule: v.optional(v.string()), // null si certificat inconnu
    certificatSerialNumber: v.string(),
    success: v.boolean(),
    failureReason: v.optional(
      v.union(
        v.literal("certificat_inconnu"),
        v.literal("certificat_revoque"),
        v.literal("certificat_expire"),
        v.literal("signature_invalide"),
        v.literal("compte_verrouille"),
        v.literal("compte_inactif"),
        v.literal("autre"),
      ),
    ),
    horodatage: v.number(),
    adresseIP: v.string(),
    poste: v.string(),
  })
    .index("by_horodatage", ["horodatage"])
    .index("by_utilisateur", ["utilisateurMatricule"])
    .index("by_utilisateur_horodatage", ["utilisateurMatricule", "horodatage"])
    .index("by_certificat", ["certificatSerialNumber"])
    .index("by_success", ["success"]),

  // ─────────────────────────────────────────────────────────────────────
  // iArchive — dossiers archivés post-clôture (Prompt 5.1)
  // Append-only par contrat applicatif : aucune mutation ne patche cette
  // table après insertion.
  // ─────────────────────────────────────────────────────────────────────
  iarchive_dossiers: defineTable({
    dossierOriginalId: v.id("dossiers_renseignement"),
    reference: v.string(),
    classification: v.union(
      v.literal("DR"),
      v.literal("CD"),
      v.literal("SD"),
      v.literal("TSD"),
    ),
    serviceProducteurCode: v.string(),
    encryptedSnapshot: v.string(), // copie complète chiffrée
    hashIntegrite: v.string(),
    /** Politique de rétention : millis epoch de fin de rétention. */
    retentionEndAt: v.number(),
    archivedAt: v.number(),
    /** Métadonnées d'archivage. */
    dossiersAuditEntries: v.optional(v.number()), // # entrées d'audit du dossier au moment du versement
    piecesCount: v.optional(v.number()),
    /** Déclassification éventuelle. */
    declassifiedAt: v.optional(v.number()),
    declassifiedByMatricule: v.optional(v.string()),
    versementArchivesNationalesAt: v.optional(v.number()),
  })
    .index("by_reference", ["reference"])
    .index("by_classification", ["classification"])
    .index("by_retentionEndAt", ["retentionEndAt"])
    .index("by_archivedAt", ["archivedAt"]),

  iarchive_declassification_requests: defineTable({
    archiveId: v.id("iarchive_dossiers"),
    requestedByMatricule: v.string(),
    motif: v.string(),
    statut: v.union(
      v.literal("en_attente_commission"),
      v.literal("approuvee_sg"),
      v.literal("rejetee"),
      v.literal("executee"),
    ),
    sgDecisionAt: v.optional(v.number()),
    commissionDecisionAt: v.optional(v.number()),
    executeeAt: v.optional(v.number()),
    versementArchivesNationalesRef: v.optional(v.string()),
  })
    .index("by_archive", ["archiveId"])
    .index("by_statut", ["statut"]),

  /**
   * Exports out-of-band de la chaîne d'audit (sauvegarde quotidienne).
   */
  iarchive_audit_exports: defineTable({
    exportedAt: v.number(),
    lastSequence: v.number(),
    lastHash: v.string(),
    nbEntries: v.number(),
    storageId: v.optional(v.id("_storage")),
  }).index("by_exportedAt", ["exportedAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // Cellule CNS — Indexation des dossiers pour croisement (Prompt 4.2).
  //
  // Tags extraits des dossiers transmis : mots-clés, individus (matricule
  // d'identité interne — jamais le nom en clair), organisations, lieux,
  // périodes. Permet la recherche multi-critères et la détection automatique
  // de convergences entre services.
  // ─────────────────────────────────────────────────────────────────────
  cns_dossier_tags: defineTable({
    dossierId: v.id("dossiers_renseignement"),
    tagType: v.union(
      v.literal("mot_cle"),
      v.literal("individu"),
      v.literal("organisation"),
      v.literal("lieu"),
      v.literal("periode"),
    ),
    tagValue: v.string(), // normalisé (lowercase, NFKD)
    /** Pour les individus, le tagValue est un matricule d'identité interne
     *  (chiffré côté application avant insertion ici). On stocke un hash
     *  HMAC pour permettre l'égalité sans révéler le matricule en index. */
    tagHash: v.string(), // HMAC-SHA256(tagValue, server_key) hex
    classification: v.union(
      v.literal("DR"),
      v.literal("CD"),
      v.literal("SD"),
      v.literal("TSD"),
    ),
    serviceProducteurCode: v.string(),
    indexedAt: v.number(),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_tag_hash", ["tagHash"])
    .index("by_type_value", ["tagType", "tagHash"])
    .index("by_service", ["serviceProducteurCode"]),

  cns_convergences: defineTable({
    /** Liste de 2+ dossierIds qui partagent des tags. */
    dossierIds: v.array(v.id("dossiers_renseignement")),
    tagHashesCommuns: v.array(v.string()),
    services: v.array(v.string()), // services distincts impliqués
    score: v.number(), // nombre de tags partagés
    detecteeAt: v.number(),
    /** Statut côté analyste CNS. */
    statut: v.union(
      v.literal("nouvelle"),
      v.literal("etudiee"),
      v.literal("ignoree"),
      v.literal("synthese_emise"),
    ),
    analysteMatricule: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_detection", ["detecteeAt"])
    .index("by_statut", ["statut"])
    .index("by_score", ["score"]),

  cns_syntheses: defineTable({
    reference: v.string(),
    classification: v.union(
      v.literal("DR"),
      v.literal("CD"),
      v.literal("SD"),
      v.literal("TSD"),
    ),
    encryptedTitre: v.string(),
    encryptedCorps: v.string(),
    /** Dossiers cités (avec extraits chiffrés). */
    dossiersSources: v.array(
      v.object({
        dossierId: v.id("dossiers_renseignement"),
        extraitChiffre: v.optional(v.string()),
      }),
    ),
    convergenceId: v.optional(v.id("cns_convergences")),
    statut: v.union(
      v.literal("brouillon"),
      v.literal("propose_au_sg"),
      v.literal("signee_par_sg"),
      v.literal("classee_sans_suite"),
      v.literal("transmise_presidence"),
    ),
    redacteurMatricule: v.string(),
    creeeAt: v.number(),
    proposeeAt: v.optional(v.number()),
    signeParSgAt: v.optional(v.number()),
    signatureSgBlob: v.optional(v.string()),
    classeeAt: v.optional(v.number()),
    classeeMotif: v.optional(v.string()),
    transmisePresidenceAt: v.optional(v.number()),
  })
    .index("by_reference", ["reference"])
    .index("by_statut", ["statut"])
    .index("by_redacteur", ["redacteurMatricule"])
    .index("by_creeeAt", ["creeeAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // Module Crise — activation (Prompt 5.3)
  // ─────────────────────────────────────────────────────────────────────
  crises: defineTable({
    nom: v.string(),
    perimetre: v.string(), // description courte
    niveau: v.union(
      v.literal("alerte"),
      v.literal("crise"),
      v.literal("crise_majeure"),
    ),
    statut: v.union(v.literal("active"), v.literal("desactivee")),
    declaredByMatricule: v.string(),
    declaredAt: v.number(),
    desactiveeByMatricule: v.optional(v.string()),
    desactiveeAt: v.optional(v.number()),
    rapportFinal: v.optional(v.string()), // chiffré
  })
    .index("by_statut", ["statut"])
    .index("by_declaredAt", ["declaredAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // API présidentielle — accès nominatif autorisé par SG-CNS (Prompt 5.2)
  // ─────────────────────────────────────────────────────────────────────
  api_presidentielle_autorisations: defineTable({
    matriculeAutorise: v.string(),
    certificatSerialNumber: v.string(),
    accordeParMatricule: v.string(), // SG-CNS
    accordeeAt: v.number(),
    revoqueeAt: v.optional(v.number()),
    revoqueeMotif: v.optional(v.string()),
  })
    .index("by_matricule", ["matriculeAutorise"])
    .index("by_certif", ["certificatSerialNumber"]),

  api_presidentielle_logs: defineTable({
    matriculeAppelant: v.string(),
    certificatSerialNumber: v.string(),
    endpoint: v.string(),
    syntheseId: v.optional(v.id("cns_syntheses")),
    statusCode: v.number(),
    horodatage: v.number(),
    adresseIP: v.string(),
  })
    .index("by_horodatage", ["horodatage"])
    .index("by_matricule", ["matriculeAppelant"]),

  // ─────────────────────────────────────────────────────────────────────
  // iCom — Communications officielles inter-services (Prompt 4.1, EF-07).
  //
  // 5 types : requisition, note_coordination, directive, compte_rendu,
  // demande_eclaircissement. Signature qualifiée obligatoire (EF-07.3).
  // Escalade Flash automatique au SG-CNS après 1h non-lue (EF-07.6).
  // ─────────────────────────────────────────────────────────────────────
  icom_communications: defineTable({
    reference: v.string(), // ex. "REQ/2026/DGSS/0042"
    type: v.union(
      v.literal("requisition"),
      v.literal("note_coordination"),
      v.literal("directive"),
      v.literal("compte_rendu"),
      v.literal("demande_eclaircissement"),
    ),
    urgence: v.union(
      v.literal("routine"),
      v.literal("urgent"),
      v.literal("flash"),
    ),
    classification: v.union(
      v.literal("DR"),
      v.literal("CD"),
      v.literal("SD"),
      v.literal("TSD"),
    ),
    emetteurMatricule: v.string(),
    emetteurService: v.string(),
    destinataireService: v.string(), // code service ou "CNS_SECRETARIAT" ou "SG_CNS"
    destinatairesIndividuels: v.optional(v.array(v.string())), // matricules optionnels
    encryptedObjet: v.string(),
    encryptedCorps: v.string(),
    hashIntegrite: v.string(),
    signatureQualifieeBlob: v.string(),
    signedAt: v.number(),
    sentAt: v.number(),
    delaiReponseAttendueHeures: v.optional(v.number()),
    /** Lien optionnel à un dossier (rattachement EF-07.7) */
    dossierId: v.optional(v.id("dossiers_renseignement")),
    /** Statut de l'escalade Flash. */
    flashEscaladeStatut: v.optional(
      v.union(v.literal("non_applicable"), v.literal("en_attente"), v.literal("escaladee")),
    ),
    flashEscaladeAt: v.optional(v.number()),
  })
    .index("by_reference", ["reference"])
    .index("by_emetteur", ["emetteurMatricule"])
    .index("by_destinataire", ["destinataireService"])
    .index("by_urgence", ["urgence"])
    .index("by_sentAt", ["sentAt"])
    .index("by_flash_pending", ["urgence", "flashEscaladeStatut"]),

  /**
   * Accusés de réception par destinataire individuel (matricule).
   * Une com peut avoir N destinataires, donc N accusés possibles.
   */
  icom_accuses: defineTable({
    communicationId: v.id("icom_communications"),
    destinataireMatricule: v.string(),
    luAt: v.number(),
    adresseIP: v.string(),
    poste: v.string(),
  })
    .index("by_communication", ["communicationId"])
    .index("by_destinataire", ["destinataireMatricule"]),

  /**
   * Réponses à une communication (chaînage parentId).
   */
  icom_reponses: defineTable({
    communicationId: v.id("icom_communications"),
    parentReponseId: v.optional(v.id("icom_reponses")),
    emetteurMatricule: v.string(),
    emetteurService: v.string(),
    encryptedCorps: v.string(),
    sentAt: v.number(),
    signatureQualifieeBlob: v.optional(v.string()),
  })
    .index("by_communication", ["communicationId"])
    .index("by_parent", ["parentReponseId"]),

  // ─────────────────────────────────────────────────────────────────────
  // Verrouillages de compte — pour appliquer la règle 5 échecs → verrou
  // (Prompt 2.1).
  //
  // Un compte verrouillé ne peut plus se ré-authentifier tant que le
  // verrou n'est pas levé par le RSSI ou par l'expiration naturelle (24h).
  // ─────────────────────────────────────────────────────────────────────
  account_locks: defineTable({
    utilisateurMatricule: v.string(),
    lockedAt: v.number(),
    expiresAt: v.number(), // déverrouillage automatique
    reason: v.string(), // ex. "5_echecs_consecutifs"
    unlockedAt: v.optional(v.number()),
    unlockedByMatricule: v.optional(v.string()), // RSSI ayant levé le verrou
  })
    .index("by_utilisateur", ["utilisateurMatricule"])
    .index("by_utilisateur_actif", ["utilisateurMatricule", "expiresAt"]),

  // ════════════════════════════════════════════════════════════════════
  // ─── LEGACY — héritées d'executif.ga ─────────────────────────────────
  // ════════════════════════════════════════════════════════════════════
  // Ces tables sont conservées pour permettre à l'UI héritée de continuer
  // à fonctionner pendant la transition vers les modules iCNS. Elles
  // seront progressivement retirées au fur et à mesure de la mise en
  // service des modules cibles. NE PAS ajouter de nouvelles données ici —
  // toute fonctionnalité nouvelle doit utiliser les tables iCNS.

  // ─── User Management (LEGACY) ──────────────────────────────────────
  users: defineTable({
    firebaseUid: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    gender: v.optional(v.string()),
    preferredTitle: v.optional(v.string()),
    tonePreference: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_firebase_uid", ["firebaseUid"])
    .index("by_email", ["email"]),

  userRoles: defineTable({
    userId: v.id("users"),
    role: v.string(),
  }).index("by_user_id", ["userId"]),

  // ─── Audit & System (LEGACY — remplacé par `journal_audit`) ──────────
  auditLogs: defineTable({
    userId: v.string(),
    action: v.string(),
    resource: v.string(),
    details: v.optional(v.any()),
    severity: v.string(),
    success: v.boolean(),
    durationMs: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }),

  systemSettings: defineTable({
    settingKey: v.string(),
    settingValue: v.any(),
    settingType: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["settingKey"]),

  // ─── Dashboard Présidence (LEGACY — à supprimer en pivot UI) ─────────
  nationalKpis: defineTable({
    date: v.string(),
    pibGrowth: v.optional(v.number()),
    inflation: v.optional(v.number()),
    unemployment: v.optional(v.number()),
    budgetExecution: v.optional(v.number()),
    debtRatio: v.optional(v.number()),
    tradeBalance: v.optional(v.number()),
    foreignReserves: v.optional(v.number()),
    data: v.optional(v.any()),
  }),

  signalements: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    severity: v.string(),
    status: v.string(),
    source: v.optional(v.string()),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  }),

  opinionPublique: defineTable({
    date: v.string(),
    approvalRate: v.optional(v.number()),
    disapprovalRate: v.optional(v.number()),
    topConcerns: v.optional(v.any()),
    data: v.optional(v.any()),
  }),

  presidentialDecisions: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    decidedAt: v.optional(v.string()),
    deadline: v.optional(v.string()),
    assignedMinistry: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  roleFeedback: defineTable({
    userId: v.optional(v.string()),
    role: v.optional(v.string()),
    feedback: v.string(),
    rating: v.optional(v.number()),
    category: v.optional(v.string()),
  }),

  // ─── Conversations (LEGACY — iAsted chat, à migrer ChatGPT) ──────────
  conversationSessions: defineTable({
    userId: v.string(),
    sessionName: v.optional(v.string()),
    focusMode: v.optional(v.string()),
    memorySummary: v.optional(v.string()),
    messageCount: v.optional(v.number()),
    startedAt: v.string(),
    endedAt: v.optional(v.string()),
    lastMessageAt: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    settings: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  conversationMessages: defineTable({
    sessionId: v.id("conversationSessions"),
    role: v.string(),
    content: v.string(),
    audioUrl: v.optional(v.string()),
    tokens: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
  }).index("by_session", ["sessionId"]),

  iastedConfig: defineTable({
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    defaultVoiceId: v.optional(v.string()),
    presidentVoiceId: v.optional(v.string()),
    ministerVoiceId: v.optional(v.string()),
  }),

  // ─── DGSS (LEGACY — à fusionner dans dossiers_renseignement) ─────────
  intelligenceReports: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    classification: v.string(),
    status: v.string(),
    source: v.optional(v.string()),
    priority: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  surveillanceTargets: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    category: v.optional(v.string()),
    lastUpdate: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  threatIndicators: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    level: v.string(),
    source: v.optional(v.string()),
    category: v.optional(v.string()),
    timestamp: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  encryptedMessages: defineTable({
    senderId: v.string(),
    senderName: v.optional(v.string()),
    recipientId: v.string(),
    subject: v.string(),
    content: v.string(),
    priority: v.string(),
    securityLevel: v.string(),
    encryptionKey: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
  }),

  // ─── Secrétariat Général (LEGACY — à refondre en Cockpit SG-CNS) ────
  officialDecrees: defineTable({
    title: v.string(),
    referenceNumber: v.string(),
    content: v.optional(v.string()),
    status: v.string(),
    type: v.optional(v.string()),
    ministry: v.optional(v.string()),
    signatureDate: v.optional(v.string()),
    publicationDate: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  }),

  legalReviews: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  }),

  administrativeArchives: defineTable({
    title: v.string(),
    referenceCode: v.string(),
    category: v.string(),
    accessLevel: v.string(),
    archivingDate: v.string(),
  }),

  // ─── Courrier / Reception (LEGACY — à fusionner dans iCom) ──────────
  incomingMails: defineTable({
    senderName: v.optional(v.string()),
    senderOrganization: v.optional(v.string()),
    subject: v.optional(v.string()),
    urgency: v.string(),
    status: v.string(),
    receivedDate: v.string(),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  // ─── Documents legacy (LEGACY — remplacé par pieces + iDocument) ────
  documents: defineTable({
    documentNumber: v.string(),
    title: v.optional(v.string()),
    documentType: v.optional(v.string()),
    status: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderOrganization: v.optional(v.string()),
    filePath: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    isConfidential: v.optional(v.boolean()),
    currentHolderService: v.optional(v.string()),
    depositedAt: v.optional(v.string()),
    userId: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  documentFolders: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    folderType: v.optional(v.string()),
    serviceRole: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  }),

  documentFolderItems: defineTable({
    folderId: v.id("documentFolders"),
    documentId: v.id("documents"),
  }).index("by_folder", ["folderId"]),

  documentHistory: defineTable({
    documentId: v.id("documents"),
    action: v.string(),
    notes: v.optional(v.string()),
    performedBy: v.optional(v.string()),
  }).index("by_document", ["documentId"]),

  documentTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    structure: v.optional(v.any()),
  }),

  generatedDocuments: defineTable({
    userId: v.string(),
    documentName: v.string(),
    documentType: v.string(),
    filePath: v.string(),
    fileSize: v.optional(v.number()),
    storageUrl: v.optional(v.string()),
    templateUsed: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }),

  // ─── Budget & Chantiers (LEGACY — hors scope iCNS, à supprimer) ─────
  budgetNational: defineTable({
    year: v.number(),
    totalBudget: v.number(),
    executedAmount: v.optional(v.number()),
    ministryAllocations: v.optional(v.any()),
    lastUpdated: v.optional(v.string()),
  }),

  chantiers: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ministry: v.optional(v.string()),
    location: v.optional(v.string()),
    budget: v.optional(v.number()),
    progress: v.optional(v.number()),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  }),

  // ─── Conseil des Ministres (LEGACY — hors scope iCNS) ───────────────
  conseilMinistresSessions: defineTable({
    date: v.string(),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    agendaSummary: v.optional(v.string()),
    status: v.optional(v.string()),
  }),

  // ─── Décrets & Ordonnances (LEGACY — hors scope iCNS) ───────────────
  decretsOrdonnances: defineTable({
    title: v.string(),
    referenceNumber: v.string(),
    type: v.optional(v.string()),
    content: v.optional(v.string()),
    ministry: v.optional(v.string()),
    status: v.optional(v.string()),
    signatureDate: v.optional(v.string()),
    publicationDate: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  }),

  decretComments: defineTable({
    decretId: v.id("decretsOrdonnances"),
    userId: v.string(),
    userName: v.optional(v.string()),
    comment: v.string(),
  }).index("by_decret", ["decretId"]),

  decretSignatures: defineTable({
    decretId: v.id("decretsOrdonnances"),
    signedBy: v.string(),
    signedByName: v.optional(v.string()),
    signatureType: v.optional(v.string()),
    signedAt: v.optional(v.string()),
  }).index("by_decret", ["decretId"]),

  // ─── Analytics (LEGACY) ─────────────────────────────────────────────
  analyticsVoiceEvents: defineTable({
    userId: v.string(),
    sessionId: v.optional(v.string()),
    eventType: v.string(),
    data: v.optional(v.any()),
  }),

  // ─── iDocument Module (LEGACY — à durcir par iDocument iCNS) ────────
  idocDocuments: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    typeId: v.optional(v.string()),
    folderId: v.optional(v.string()),
    status: v.string(),
    createdBy: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    version: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    tags: v.optional(v.any()),
    metadata: v.optional(v.any()),
  })
    .index("by_folder", ["folderId"])
    .index("by_creator", ["createdBy"]),

  idocFolders: defineTable({
    name: v.string(),
    parentId: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    createdBy: v.string(),
    isSystem: v.optional(v.boolean()),
  }).index("by_parent", ["parentId"]),

  idocDocumentTypes: defineTable({
    name: v.string(),
    label: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  }),

  idocVersions: defineTable({
    documentId: v.string(),
    versionNumber: v.number(),
    content: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
    createdBy: v.string(),
    changeNote: v.optional(v.string()),
  }).index("by_document", ["documentId"]),

  // ─── iArchive Module (LEGACY — à durcir par iArchive iCNS) ──────────
  iarchArchives: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    status: v.string(),
    accessLevel: v.string(),
    retentionYears: v.optional(v.number()),
    createdBy: v.string(),
    archivedAt: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_category", ["categoryId"]),

  iarchCategories: defineTable({
    name: v.string(),
    label: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    parentId: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  }),

  iarchCertificates: defineTable({
    archiveId: v.string(),
    certificateNumber: v.string(),
    issuedBy: v.string(),
    issuedAt: v.string(),
    validUntil: v.optional(v.string()),
    status: v.string(),
  }).index("by_archive", ["archiveId"]),

  // ─── iCorrespondance (LEGACY — à étendre en iCom) ───────────────────
  icorrDocuments: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    type: v.string(),
    folderId: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    sender: v.optional(v.string()),
    recipient: v.optional(v.string()),
    createdBy: v.string(),
    dueDate: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_folder", ["folderId"]),

  icorrFolders: defineTable({
    name: v.string(),
    parentId: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    folderType: v.optional(v.string()),
    createdBy: v.string(),
  }).index("by_parent", ["parentId"]),

  icorrWorkflows: defineTable({
    documentId: v.string(),
    step: v.number(),
    action: v.string(),
    performedBy: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  }).index("by_document", ["documentId"]),

  // ─── Knowledge Base (LEGACY — utile pour la cellule CNS) ────────────
  knowledgeBaseDocuments: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    author: v.optional(v.string()),
    summary: v.optional(v.string()),
    embedding: v.optional(v.any()),
    metadata: v.optional(v.any()),
  }),

  // ─── Reception (LEGACY) ─────────────────────────────────────────────
  receptionVisitors: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    organization: v.optional(v.string()),
    purpose: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    status: v.string(),
    hostName: v.optional(v.string()),
    hostService: v.optional(v.string()),
    badgeNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    data: v.optional(v.any()),
  }),

  // NOTE : tables tied to deleted modules retirées du schéma : cabinetMeetings,
  // councilPreparations, officialEvents, guestLists, diplomaticVisits.
});

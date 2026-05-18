import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Initialize demo accounts in Convex.
 * Creates default users with roles for testing/demo purposes.
 */
export const initializeDemoAccounts = mutation({
  handler: async (ctx) => {
    const demoAccounts = [
      { email: "president@presidence.ga", fullName: "Président de la République", role: "president", gender: "male" },
      { email: "admin@presidence.ga", fullName: "Administrateur Système", role: "admin", gender: "male" },
      { email: "dgss@presidence.ga", fullName: "Directeur DGSS", role: "dgss", gender: "male" },
      { email: "dgr@presidence.ga", fullName: "Directeur de Cabinet", role: "dgr", gender: "male" },
      { email: "cabinet@presidence.ga", fullName: "Directeur Cabinet Privé", role: "cabinet_private", gender: "male" },
      { email: "secgen@presidence.ga", fullName: "Secrétaire Général", role: "sec_gen", gender: "male" },
      { email: "protocol@presidence.ga", fullName: "Chef du Protocole", role: "protocol", gender: "female" },
      { email: "courrier@presidence.ga", fullName: "Chef du Service Courrier", role: "courrier", gender: "female" },
      { email: "reception@presidence.ga", fullName: "Chef de la Réception", role: "reception", gender: "female" },
    ];

    const created: string[] = [];
    const existing: string[] = [];

    for (const account of demoAccounts) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", account.email))
        .first();

      if (existingUser) {
        existing.push(account.email);
        continue;
      }

      // Create user
      const userId = await ctx.db.insert("users", {
        firebaseUid: `demo-${account.role}`,
        email: account.email,
        fullName: account.fullName,
        gender: account.gender,
        createdAt: Date.now(),
      });

      // Assign role
      await ctx.db.insert("userRoles", {
        userId,
        role: account.role,
      });

      created.push(account.email);
    }

    return { created, existing };
  },
});

/**
 * Seed iCNS demo : services + utilisateurs + habilitations correspondant
 * au catalogue complet des 38 personas (cf. src/data/icns-personas.ts).
 *
 * Idempotent : ne crée que ce qui n'existe pas (clé matricule).
 *
 * En production, ce seed ne doit JAMAIS tourner — les agents sont
 * provisionnés depuis l'AC souveraine via le pipeline PKI.
 */
export const seedICNSDemo = mutation({
  handler: async (ctx) => {
    type SvcCode =
      | "B2"
      | "DGDI"
      | "DGR"
      | "DGSS"
      | "GR"
      | "GN"
      | "FAG_TERRE"
      | "FAG_AIR"
      | "FAG_MARINE"
      | "POLICE"
      | "SILAM"
      | "DGSP"
      | "DOUANE";
    type SvcOrg = "renseignement" | "force_defense" | "administration_securite";
    type SeedSvc = { code: SvcCode; nomComplet: string; typeOrganisme: SvcOrg };
    type RoleICNS =
      | "officier_traitant"
      | "chef_section"
      | "directeur_service"
      | "analyste_cns"
      | "sg_cns"
      | "rssi"
      | "auditeur"
      | "admin_technique";
    type SeedUser = {
      matricule: string;
      serviceCode: SvcCode;
      role: RoleICNS;
      prenom: string;
      nom: string;
      classificationMax: "DR" | "CD" | "SD" | "TSD";
    };

    const services: SeedSvc[] = [
      // CNS central — utilise B2 comme rattachement administratif des
      // analystes, RSSI, auditeur et admin technique du Secrétariat permanent.
      { code: "B2", nomComplet: "B2 — Sécurité d'État (rattachement Secrétariat CNS)", typeOrganisme: "renseignement" },
      // Services de renseignement
      { code: "DGDI", nomComplet: "DGDI — Documentation et Immigration", typeOrganisme: "renseignement" },
      { code: "DGR", nomComplet: "DGR — Renseignement extérieur", typeOrganisme: "renseignement" },
      { code: "DGSS", nomComplet: "DGSS — Services Spéciaux", typeOrganisme: "renseignement" },
      // Forces de défense
      { code: "GR", nomComplet: "Garde Républicaine", typeOrganisme: "force_defense" },
      { code: "GN", nomComplet: "Gendarmerie Nationale", typeOrganisme: "force_defense" },
      { code: "FAG_TERRE", nomComplet: "Forces Armées Gabonaises — Terre", typeOrganisme: "force_defense" },
      { code: "FAG_AIR", nomComplet: "Forces Armées Gabonaises — Air", typeOrganisme: "force_defense" },
      { code: "FAG_MARINE", nomComplet: "Forces Armées Gabonaises — Marine", typeOrganisme: "force_defense" },
      // Administrations de sécurité
      { code: "POLICE", nomComplet: "Police Nationale — Renseignements Généraux", typeOrganisme: "administration_securite" },
      { code: "SILAM", nomComplet: "SILAM — Service d'Investigation Anti-Trafic", typeOrganisme: "administration_securite" },
      { code: "DGSP", nomComplet: "DGSP — Sécurité Présidentielle", typeOrganisme: "administration_securite" },
      { code: "DOUANE", nomComplet: "Direction Générale des Douanes — Renseignement", typeOrganisme: "administration_securite" },
    ];

    const users: SeedUser[] = [
      // ─── CNS Central (rattaché B2) — 8 personas ─────────────────────
      { matricule: "CNS-SG-001", serviceCode: "B2", role: "sg_cns", prenom: "Charles", nom: "ESSONO", classificationMax: "TSD" },
      { matricule: "CNS-SGA-001", serviceCode: "B2", role: "sg_cns", prenom: "Marie-Claire", nom: "ANGUE", classificationMax: "TSD" },
      { matricule: "CNS-ANA-001", serviceCode: "B2", role: "analyste_cns", prenom: "Alain", nom: "NDONG", classificationMax: "TSD" },
      { matricule: "CNS-ANA-002", serviceCode: "B2", role: "analyste_cns", prenom: "Carole", nom: "MBOUMBA", classificationMax: "SD" },
      { matricule: "CNS-ANA-003", serviceCode: "B2", role: "analyste_cns", prenom: "Pascal", nom: "BOUCKAT", classificationMax: "SD" },
      { matricule: "RSSI-001", serviceCode: "B2", role: "rssi", prenom: "Sandrine", nom: "MENGUE", classificationMax: "TSD" },
      { matricule: "AUDIT-001", serviceCode: "B2", role: "auditeur", prenom: "Bernard", nom: "NZE", classificationMax: "SD" },
      { matricule: "ADM-001", serviceCode: "B2", role: "admin_technique", prenom: "Jean", nom: "MBOUMBA", classificationMax: "CD" },

      // ─── B2 (renseignement intérieur) — 3 personas ──────────────────
      { matricule: "B2-DIR-001", serviceCode: "B2", role: "directeur_service", prenom: "Étienne", nom: "IBINGA", classificationMax: "TSD" },
      { matricule: "B2-CHF-001", serviceCode: "B2", role: "chef_section", prenom: "Joseph", nom: "BAKALA", classificationMax: "SD" },
      { matricule: "B2-001", serviceCode: "B2", role: "officier_traitant", prenom: "Marc", nom: "OBIANG", classificationMax: "SD" },

      // ─── DGDI — 3 personas ───────────────────────────────────────────
      { matricule: "DGDI-DIR-001", serviceCode: "DGDI", role: "directeur_service", prenom: "Patricia", nom: "NGUEMA", classificationMax: "TSD" },
      { matricule: "DGDI-CHF-001", serviceCode: "DGDI", role: "chef_section", prenom: "Robert", nom: "MOUNGUENGUI", classificationMax: "SD" },
      { matricule: "DGDI-001", serviceCode: "DGDI", role: "officier_traitant", prenom: "Sylvie", nom: "ELLA", classificationMax: "SD" },

      // ─── DGR — 3 personas ────────────────────────────────────────────
      { matricule: "DGR-DIR-001", serviceCode: "DGR", role: "directeur_service", prenom: "Pierre", nom: "OBAME", classificationMax: "TSD" },
      { matricule: "DGR-CHF-001", serviceCode: "DGR", role: "chef_section", prenom: "Henri", nom: "AGOSSOU", classificationMax: "SD" },
      { matricule: "DGR-001", serviceCode: "DGR", role: "officier_traitant", prenom: "Alain", nom: "BIYOGHE", classificationMax: "SD" },

      // ─── DGSS — 3 personas ───────────────────────────────────────────
      { matricule: "DGSS-DIR-001", serviceCode: "DGSS", role: "directeur_service", prenom: "Christian", nom: "MOUSSAVOU", classificationMax: "TSD" },
      { matricule: "DGSS-CHF-001", serviceCode: "DGSS", role: "chef_section", prenom: "Pierre", nom: "OBONGO", classificationMax: "SD" },
      { matricule: "DGSS-001", serviceCode: "DGSS", role: "officier_traitant", prenom: "Jean", nom: "KOUMBA", classificationMax: "SD" },

      // ─── Garde Républicaine — 3 personas ─────────────────────────────
      { matricule: "GR-DIR-001", serviceCode: "GR", role: "directeur_service", prenom: "André", nom: "MEZUI", classificationMax: "TSD" },
      { matricule: "GR-CHF-001", serviceCode: "GR", role: "chef_section", prenom: "Jean-Marie", nom: "ABESSOLO", classificationMax: "SD" },
      { matricule: "GR-001", serviceCode: "GR", role: "officier_traitant", prenom: "Pascal", nom: "MBADINGA", classificationMax: "SD" },

      // ─── Gendarmerie Nationale — 3 personas ──────────────────────────
      { matricule: "GN-DIR-001", serviceCode: "GN", role: "directeur_service", prenom: "François", nom: "NDONG", classificationMax: "TSD" },
      { matricule: "GN-CHF-001", serviceCode: "GN", role: "chef_section", prenom: "Patrick", nom: "MABIKA", classificationMax: "SD" },
      { matricule: "GN-001", serviceCode: "GN", role: "officier_traitant", prenom: "Léa", nom: "TCHIBINDA", classificationMax: "SD" },

      // ─── FAG Terre — 3 personas ──────────────────────────────────────
      { matricule: "FAGT-DIR-001", serviceCode: "FAG_TERRE", role: "directeur_service", prenom: "Brice", nom: "MOUKAGNI", classificationMax: "TSD" },
      { matricule: "FAGT-CHF-001", serviceCode: "FAG_TERRE", role: "chef_section", prenom: "Daniel", nom: "MIHINDOU", classificationMax: "SD" },
      { matricule: "FAGT-001", serviceCode: "FAG_TERRE", role: "officier_traitant", prenom: "Yannick", nom: "BOUNDA", classificationMax: "SD" },

      // ─── FAG Air — 3 personas ────────────────────────────────────────
      { matricule: "FAGA-DIR-001", serviceCode: "FAG_AIR", role: "directeur_service", prenom: "Pierre-Claver", nom: "MOUSSOUNDA", classificationMax: "TSD" },
      { matricule: "FAGA-CHF-001", serviceCode: "FAG_AIR", role: "chef_section", prenom: "Hugues", nom: "NZUE", classificationMax: "SD" },
      { matricule: "FAGA-001", serviceCode: "FAG_AIR", role: "officier_traitant", prenom: "Cédric", nom: "NDOUTOUMOU", classificationMax: "SD" },

      // ─── FAG Marine — 3 personas ─────────────────────────────────────
      { matricule: "FAGM-DIR-001", serviceCode: "FAG_MARINE", role: "directeur_service", prenom: "Olivier", nom: "KOUMBA-MOUYABI", classificationMax: "TSD" },
      { matricule: "FAGM-CHF-001", serviceCode: "FAG_MARINE", role: "chef_section", prenom: "Stéphane", nom: "MAVOUNGOU", classificationMax: "SD" },
      { matricule: "FAGM-001", serviceCode: "FAG_MARINE", role: "officier_traitant", prenom: "Bénédicte", nom: "ESSOMBA", classificationMax: "SD" },

      // ─── Police RG — 3 personas ──────────────────────────────────────
      { matricule: "POL-DIR-001", serviceCode: "POLICE", role: "directeur_service", prenom: "Roger", nom: "NGAMA", classificationMax: "TSD" },
      { matricule: "POL-CHF-001", serviceCode: "POLICE", role: "chef_section", prenom: "Charles", nom: "ESSONO", classificationMax: "SD" },
      { matricule: "POL-001", serviceCode: "POLICE", role: "officier_traitant", prenom: "Aimée", nom: "OYANE", classificationMax: "CD" },

      // ─── SILAM — 3 personas ──────────────────────────────────────────
      { matricule: "SILAM-DIR-001", serviceCode: "SILAM", role: "directeur_service", prenom: "Jean-Paul", nom: "EYEGHE", classificationMax: "TSD" },
      { matricule: "SILAM-CHF-001", serviceCode: "SILAM", role: "chef_section", prenom: "Vincent", nom: "NDEMEZO'O", classificationMax: "SD" },
      { matricule: "SILAM-001", serviceCode: "SILAM", role: "officier_traitant", prenom: "Sophie", nom: "MOULOUNGUI", classificationMax: "SD" },

      // ─── DGSP — 3 personas ───────────────────────────────────────────
      { matricule: "DGSP-DIR-001", serviceCode: "DGSP", role: "directeur_service", prenom: "Jean-Pierre", nom: "EYEGHE", classificationMax: "TSD" },
      { matricule: "DGSP-CHF-001", serviceCode: "DGSP", role: "chef_section", prenom: "Bernard", nom: "OWONO", classificationMax: "SD" },
      { matricule: "DGSP-001", serviceCode: "DGSP", role: "officier_traitant", prenom: "Évelyne", nom: "BIKORO", classificationMax: "SD" },

      // ─── Douane — 3 personas ─────────────────────────────────────────
      { matricule: "DOUANE-DIR-001", serviceCode: "DOUANE", role: "directeur_service", prenom: "Christian", nom: "MOUKETOU", classificationMax: "SD" },
      { matricule: "DOUANE-CHF-001", serviceCode: "DOUANE", role: "chef_section", prenom: "Stéphane", nom: "ENGONGA", classificationMax: "CD" },
      { matricule: "DOUANE-001", serviceCode: "DOUANE", role: "officier_traitant", prenom: "Nicole", nom: "BENGA", classificationMax: "CD" },
    ];

    const now = Date.now();
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    const createdServices: string[] = [];
    const createdUsers: string[] = [];
    const createdHabilitations: string[] = [];

    // Services
    const serviceIds = new Map<string, Id<"services">>();
    for (const s of services) {
      const existing = await ctx.db
        .query("services")
        .withIndex("by_code", (q) => q.eq("code", s.code))
        .first();
      if (existing) {
        serviceIds.set(s.code, existing._id);
        continue;
      }
      const id = await ctx.db.insert("services", {
        code: s.code,
        nomComplet: s.nomComplet,
        typeOrganisme: s.typeOrganisme,
        actif: true,
        createdAt: now,
      });
      serviceIds.set(s.code, id);
      createdServices.push(s.code);
    }

    // Utilisateurs + habilitations
    for (const u of users) {
      const existing = await ctx.db
        .query("utilisateurs")
        .withIndex("by_matricule", (q) => q.eq("matricule", u.matricule))
        .first();
      const serviceId = serviceIds.get(u.serviceCode);
      if (!serviceId) continue;
      if (!existing) {
        // En mode dev sans HSM, on stocke les noms en base64 simple
        // (pas un vrai chiffrement — juste un placeholder pour respecter
        // le schéma qui attend `encryptedPrenom`/`encryptedNom`).
        const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
        await ctx.db.insert("utilisateurs", {
          matricule: u.matricule,
          serviceId,
          role: u.role,
          encryptedPrenom: b64(u.prenom),
          encryptedNom: b64(u.nom),
          encryptedEmail: b64(`${u.matricule.toLowerCase()}@icns.ga`),
          hashIntegrite: "demo-seed-not-cryptographic",
          actif: true,
          createdAt: now,
          updatedAt: now,
        });
        createdUsers.push(u.matricule);
      }

      // Habilitation
      const existingHab = await ctx.db
        .query("habilitations")
        .withIndex("by_utilisateur_actif", (q) =>
          q.eq("utilisateurMatricule", u.matricule).eq("revoque", false),
        )
        .first();
      if (!existingHab) {
        await ctx.db.insert("habilitations", {
          utilisateurMatricule: u.matricule,
          classificationMax: u.classificationMax,
          perimetreMotsCles: [],
          perimetreZonesGeo: ["GA"],
          perimetreFonctionnel: ["renseignement_general"],
          perimetreDateDebut: now - ONE_YEAR,
          perimetreDateFin: now + ONE_YEAR,
          valideAPartirDe: now - ONE_YEAR,
          valideJusquA: now + ONE_YEAR,
          revoque: false,
          delivreParMatricule: "DEMO-SEED",
          horodatageDelivrance: now,
        });
        createdHabilitations.push(u.matricule);
      }
    }

    return {
      createdServices,
      createdUsers,
      createdHabilitations,
      totalServices: services.length,
      totalUsers: users.length,
    };
  },
});

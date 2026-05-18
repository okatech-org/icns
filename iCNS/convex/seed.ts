import { mutation } from "./_generated/server";

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

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Official Decrees ─────────────────────────────────────
export const getOfficialDecrees = query({
  handler: async (ctx) => {
    return await ctx.db.query("officialDecrees").order("desc").collect();
  },
});

export const createOfficialDecree = mutation({
  args: {
    title: v.string(),
    referenceNumber: v.string(),
    content: v.optional(v.string()),
    status: v.string(),
    type: v.optional(v.string()),
    ministry: v.optional(v.string()),
    signatureDate: v.optional(v.string()),
    publicationDate: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("officialDecrees", args);
  },
});

export const updateOfficialDecreeStatus = mutation({
  args: { id: v.id("officialDecrees"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─── Legal Reviews ────────────────────────────────────────
export const getLegalReviews = query({
  handler: async (ctx) => {
    return await ctx.db.query("legalReviews").order("desc").collect();
  },
});

export const createLegalReview = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("legalReviews", args);
  },
});

export const updateLegalReviewStatus = mutation({
  args: { id: v.id("legalReviews"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─── Administrative Archives ──────────────────────────────
export const getAdministrativeArchives = query({
  handler: async (ctx) => {
    return await ctx.db.query("administrativeArchives").order("desc").collect();
  },
});

export const createAdministrativeArchive = mutation({
  args: {
    title: v.string(),
    referenceCode: v.string(),
    category: v.string(),
    accessLevel: v.string(),
    archivingDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("administrativeArchives", args);
  },
});

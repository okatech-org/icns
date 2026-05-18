import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Users ────────────────────────────────────────────────
export const getByFirebaseUid = query({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const createUser = mutation({
  args: {
    firebaseUid: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    gender: v.optional(v.string()),
    preferredTitle: v.optional(v.string()),
    tonePreference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    firebaseUid: v.string(),
    fullName: v.optional(v.string()),
    gender: v.optional(v.string()),
    preferredTitle: v.optional(v.string()),
    tonePreference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (!user) throw new Error("User not found");

    const { firebaseUid, ...updates } = args;
    await ctx.db.patch(user._id, updates);
  },
});

// ─── User Roles ────────────────────────────────────────────
export const getUserRoles = query({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("userRoles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const assignRole = mutation({
  args: {
    firebaseUid: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (!user) throw new Error("User not found");

    // Check if role already exists
    const existingRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    if (existingRoles.some((r) => r.role === args.role)) return;

    await ctx.db.insert("userRoles", {
      userId: user._id,
      role: args.role,
    });
  },
});

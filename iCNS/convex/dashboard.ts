import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Feedbacks ────────────────────────────────────────────
export const getFeedbacks = query({
  handler: async (ctx) => {
    return await ctx.db.query("roleFeedback").order("desc").collect();
  },
});

// ─── National KPIs ────────────────────────────────────────
export const getNationalKpis = query({
  handler: async (ctx) => {
    return await ctx.db.query("nationalKpis").order("desc").first();
  },
});

export const getMonthlyTrends = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.months || 12;
    const data = await ctx.db.query("nationalKpis").order("desc").take(limit);
    return data.reverse();
  },
});

// ─── Signalements ─────────────────────────────────────────
export const getSignalements = query({
  handler: async (ctx) => {
    return await ctx.db.query("signalements").order("desc").collect();
  },
});

// ─── Opinion Publique ─────────────────────────────────────
export const getOpinionPublique = query({
  handler: async (ctx) => {
    return await ctx.db.query("opinionPublique").order("desc").first();
  },
});

// ─── Presidential Decisions ───────────────────────────────
export const getPresidentialDecisions = query({
  handler: async (ctx) => {
    return await ctx.db.query("presidentialDecisions").order("desc").collect();
  },
});

export const createPresidentialDecision = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    decidedAt: v.optional(v.string()),
    deadline: v.optional(v.string()),
    assignedMinistry: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("presidentialDecisions", args);
  },
});

// ─── iAsted Config ────────────────────────────────────────
export const getIastedConfig = query({
  handler: async (ctx) => {
    return await ctx.db.query("iastedConfig").first();
  },
});

export const updateIastedConfig = mutation({
  args: {
    id: v.id("iastedConfig"),
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    defaultVoiceId: v.optional(v.string()),
    presidentVoiceId: v.optional(v.string()),
    ministerVoiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// ─── Conversation Messages ────────────────────────────────
export const getConversationMessages = query({
  args: { sessionId: v.id("conversationSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversationMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// ─── User Roles (for query hook) ─────────────────────────
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

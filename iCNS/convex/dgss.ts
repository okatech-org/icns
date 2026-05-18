import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Intelligence Reports ─────────────────────────────────
export const getIntelligenceReports = query({
  handler: async (ctx) => {
    return await ctx.db.query("intelligenceReports").order("desc").collect();
  },
});

export const createIntelligenceReport = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    classification: v.string(),
    status: v.string(),
    source: v.optional(v.string()),
    priority: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("intelligenceReports", args);
  },
});

export const updateIntelligenceReport = mutation({
  args: {
    id: v.id("intelligenceReports"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    classification: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    priority: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteIntelligenceReport = mutation({
  args: { id: v.id("intelligenceReports") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Surveillance Targets ─────────────────────────────────
export const getSurveillanceTargets = query({
  handler: async (ctx) => {
    return await ctx.db.query("surveillanceTargets").order("desc").collect();
  },
});

export const createSurveillanceTarget = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    category: v.optional(v.string()),
    lastUpdate: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("surveillanceTargets", args);
  },
});

export const updateSurveillanceTarget = mutation({
  args: {
    id: v.id("surveillanceTargets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    category: v.optional(v.string()),
    lastUpdate: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteSurveillanceTarget = mutation({
  args: { id: v.id("surveillanceTargets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Threat Indicators ────────────────────────────────────
export const getThreatIndicators = query({
  handler: async (ctx) => {
    return await ctx.db.query("threatIndicators").order("desc").collect();
  },
});

export const createThreatIndicator = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    level: v.string(),
    source: v.optional(v.string()),
    category: v.optional(v.string()),
    timestamp: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("threatIndicators", args);
  },
});

export const updateThreatIndicator = mutation({
  args: {
    id: v.id("threatIndicators"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    level: v.optional(v.string()),
    source: v.optional(v.string()),
    category: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteThreatIndicator = mutation({
  args: { id: v.id("threatIndicators") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

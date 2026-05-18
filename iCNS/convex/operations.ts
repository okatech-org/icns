import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getIncomingMails = query({
  handler: async (ctx) => {
    return await ctx.db.query("incomingMails").order("desc").collect();
  },
});

export const createIncomingMail = mutation({
  args: {
    senderName: v.optional(v.string()),
    senderOrganization: v.optional(v.string()),
    subject: v.optional(v.string()),
    urgency: v.string(),
    status: v.string(),
    receivedDate: v.string(),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incomingMails", args);
  },
});

export const updateMailStatus = mutation({
  args: { id: v.id("incomingMails"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getAuditLogs = query({
  args: {
    severity: v.optional(v.string()),
    resource: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query("auditLogs").order("desc").collect();
    if (args.severity) results = results.filter((r) => r.severity === args.severity);
    if (args.resource) results = results.filter((r) => r.resource === args.resource);
    if (args.limit) results = results.slice(0, args.limit);
    return results;
  },
});

export const logAuditEvent = mutation({
  args: {
    userId: v.string(),
    action: v.string(),
    resource: v.string(),
    details: v.optional(v.any()),
    severity: v.string(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", args);
  },
});

export const getAllSettings = query({
  handler: async (ctx) => {
    return await ctx.db.query("systemSettings").collect();
  },
});

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("systemSettings").withIndex("by_key", (q) => q.eq("settingKey", args.key)).first();
  },
});

export const updateSetting = mutation({
  args: { key: v.string(), value: v.any(), updatedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("systemSettings").withIndex("by_key", (q) => q.eq("settingKey", args.key)).first();
    if (existing) await ctx.db.patch(existing._id, { settingValue: args.value, updatedBy: args.updatedBy });
  },
});

export const createSetting = mutation({
  args: { settingKey: v.string(), settingValue: v.any(), settingType: v.string(), description: v.optional(v.string()), isPublic: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("systemSettings", args);
  },
});

export const deleteSetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("systemSettings").withIndex("by_key", (q) => q.eq("settingKey", args.key)).first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getReceptionVisitors = query({
  handler: async (ctx) => {
    return await ctx.db.query("receptionVisitors").order("desc").collect();
  },
});

// NOTE : queries `getOfficialEvents`, `getDiplomaticVisits`, `getCabinetMeetings`
// retirées avec les pages Protocole / Cabinet Directeur (cf. commit de bootstrap iCNS).

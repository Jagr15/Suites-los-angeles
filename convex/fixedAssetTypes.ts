import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fixedAssetTypes").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    requiresModel: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fixedAssetTypes", args);
  },
});

export const remove = mutation({
  args: { id: v.id("fixedAssetTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

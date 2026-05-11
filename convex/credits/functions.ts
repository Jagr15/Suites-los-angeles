import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { creditFields } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("credits").collect();
  },
});

export const create = mutation({
  args: {
    ...creditFields,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("credits", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("credits"),
    ...creditFields,
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

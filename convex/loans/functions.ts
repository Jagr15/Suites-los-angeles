import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { loanFields } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("loans").collect();
  },
});

export const create = mutation({
  args: {
    ...loanFields,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("loans", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("loans"),
    ...loanFields,
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("loans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

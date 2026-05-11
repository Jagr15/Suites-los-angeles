import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { financeAccountFields } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("finance_accounts").collect();
  },
});

export const create = mutation({
  args: {
    ...financeAccountFields,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("finance_accounts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("finance_accounts"),
    ...financeAccountFields,
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("finance_accounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

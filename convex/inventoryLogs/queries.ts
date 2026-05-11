import { query } from "../_generated/server";
import { v } from "convex/values";

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryLogs")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();
  },
});

export const listByBodega = query({
  args: { bodegaId: v.id("bodegas") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryLogs")
      .withIndex("by_bodega", (q) => q.eq("bodegaId", args.bodegaId))
      .order("desc")
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inventoryLogs").order("desc").collect();
  },
});

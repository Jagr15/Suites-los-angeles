import { query } from "../_generated/server";
import { v } from "convex/values";

export const getStock = query({
  args: { productId: v.id("products"), bodegaId: v.id("bodegas") },
  handler: async (ctx, args) => {
    const inv = await ctx.db
      .query("inventory")
      .withIndex("by_product_bodega", (q) =>
        q.eq("productId", args.productId).eq("bodegaId", args.bodegaId)
      )
      .first();
    return inv?.quantity || 0;
  },
});

export const listByBodega = query({
  args: { bodegaId: v.id("bodegas") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventory")
      .withIndex("by_bodega", (q) => q.eq("bodegaId", args.bodegaId))
      .collect();
  },
});

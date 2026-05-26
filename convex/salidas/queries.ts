import { query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { bodegaId: v.optional(v.id("bodegas")) },
  handler: async (ctx, args) => {
    if (args.bodegaId) {
      return await ctx.db
        .query("salidas")
        .withIndex("by_bodegaId", (q) => q.eq("bodegaId", args.bodegaId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("salidas").order("desc").collect();
  },
});

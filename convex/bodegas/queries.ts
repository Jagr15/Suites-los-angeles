import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Lista todas las bodegas.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bodegas").collect();
  },
});

/**
 * Obtiene una bodega por su ID.
 */
export const getById = query({
  args: { id: v.id("bodegas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

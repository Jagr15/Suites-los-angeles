import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Obtiene todos los activos fijos.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assets").collect();
  },
});

/**
 * Obtiene un activo por su ID.
 */
export const getById = query({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

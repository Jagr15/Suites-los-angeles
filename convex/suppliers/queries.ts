import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Lista todos los proveedores.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("suppliers").collect();
  },
});

/**
 * Obtiene un proveedor por su ID.
 */
export const getById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

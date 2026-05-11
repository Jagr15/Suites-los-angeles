import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Obtiene todos los vehículos.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
  },
});

/**
 * Obtiene un vehículo por su ID.
 */
export const getById = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

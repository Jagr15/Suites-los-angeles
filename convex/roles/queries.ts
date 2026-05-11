import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

/**
 * Lista todos los roles disponibles.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    // Puedes permitir que todos vean los nombres de los roles 
    // o restringirlo a admins.
    return await ctx.db.query("roles").collect();
  },
});

/**
 * Obtiene un rol por su ID.
 */
export const getById = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

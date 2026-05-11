import { query } from "../_generated/server";
import { v } from "convex/values";

const ALLOWED_ROLE_NAMES = new Set(["Administrador", "Vendedor", "Bodeguero"]);

/**
 * Lista todos los roles disponibles.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles.filter((role) => ALLOWED_ROLE_NAMES.has(role.name));
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

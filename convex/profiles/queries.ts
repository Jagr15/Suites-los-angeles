import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

/**
 * Lista todos los perfiles de recursos humanos.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    // await requireAdmin(ctx); // Opcional: restringir a admin
    return await ctx.db.query("profiles").collect();
  },
});

/**
 * Obtiene un perfil por ID.
 */
export const getById = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});


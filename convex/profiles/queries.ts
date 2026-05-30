import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireIdentity } from "../common/utils";

/**
 * Lista todos los perfiles de recursos humanos.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("profiles").collect();
  },
});

/**
 * Obtiene un perfil por ID.
 */
export const getById = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

/**
 * Lista perfiles disponibles para selects en formularios operativos.
 */
export const listForSelection = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    return profiles
      .filter((p) => p.status === "Activo")
      .map((p) => ({
        _id: p._id,
        fullName: p.fullName,
        userId: p.userId,
        group: p.group,
      }));
  },
});

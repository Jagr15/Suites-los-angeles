import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

/**
 * Crea un nuevo rol en el sistema.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("roles", args);
  },
});

/**
 * Actualiza un rol existente.
 */
export const update = mutation({
  args: {
    id: v.id("roles"),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

/**
 * Elimina un rol.
 */
export const remove = mutation({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Nota: Deberías verificar que no haya usuarios usándolo antes de borrar
    await ctx.db.delete(args.id);
  },
});

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { routeFields } from "./schema";
import { requireAdmin } from "../common/utils";

/**
 * Crea una nueva ruta.
 */
export const create = mutation({
  args: routeFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("routes", args);
  },
});

/**
 * Actualiza la información de una ruta.
 */
export const update = mutation({
  args: {
    id: v.id("routes"),
    ...routeFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

/**
 * Elimina una ruta.
 */
export const remove = mutation({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { bodegaFields } from "./schema";
import { requireAdmin } from "../common/utils";

/**
 * Crea una nueva bodega.
 */
export const create = mutation({
  args: bodegaFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("bodegas", args);
  },
});

/**
 * Actualiza la información de una bodega.
 */
export const update = mutation({
  args: {
    id: v.id("bodegas"),
    ...bodegaFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

/**
 * Elimina una bodega.
 */
export const remove = mutation({
  args: { id: v.id("bodegas") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

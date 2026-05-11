import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { assetFields } from "./schema";
import { requireAdmin } from "../common/utils";

/**
 * Crea un nuevo activo fijo.
 */
export const create = mutation({
  args: assetFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("assets", args);
  },
});

/**
 * Actualiza la información de un activo fijo.
 */
export const update = mutation({
  args: {
    id: v.id("assets"),
    ...assetFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

/**
 * Elimina un activo fijo.
 */
export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Si el activo está vinculado a un vehículo, lo desvinculamos
    const asset = await ctx.db.get(args.id);
    if (asset?.vehicleId) {
      await ctx.db.patch(asset.vehicleId, { assetId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});

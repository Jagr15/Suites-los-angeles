import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAccessibleWarehouseIds, requireAdmin, requireIdentity } from "../common/utils";

/**
 * Lista todas las bodegas.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bodegas = await ctx.db.query("bodegas").collect();
    return await Promise.all(
      bodegas.map(async (bodega) => {
        const managerProfile = bodega.managerProfileId
          ? await ctx.db.get(bodega.managerProfileId)
          : null;
        return {
          ...bodega,
          managerProfileName: managerProfile?.fullName || bodega.manager || "Sin encargado",
        };
      })
    );
  },
});

/**
 * Obtiene una bodega por su ID.
 */
export const getById = query({
  args: { id: v.id("bodegas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listAccessible = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireIdentity(ctx);
      const allowedIds = await getAccessibleWarehouseIds(ctx);
      if (allowedIds.length === 0) return [];
      const all = await ctx.db.query("bodegas").collect();
      const allowedSet = new Set(allowedIds.map((id) => String(id)));
      return all.filter((b) => allowedSet.has(String(b._id)));
    } catch (error) {
      console.error("bodegas.listAccessible failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

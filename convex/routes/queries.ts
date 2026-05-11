import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Obtiene todas las rutas.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    
    // Podemos enriquecer los datos con el nombre del perfil asignado y el vehículo
    return Promise.all(
      routes.map(async (route) => {
        const profile = route.assignedProfileId ? await ctx.db.get(route.assignedProfileId) : null;
        const asset = route.assetId ? await ctx.db.get(route.assetId) : null;
        return {
          ...route,
          assignedProfileName: profile?.fullName ?? "Desconocido",
          vehicleInfo: asset ? `${asset.name} (${asset.serialNumber || "S/N"})` : "Sin transporte",
        };
      })
    );
  },
});

/**
 * Obtiene una ruta por su ID.
 */
export const getById = query({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
/**
 * Lista las rutas asignadas a un perfil específico.
 */
export const listByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", args.profileId))
      .collect();

    return Promise.all(
      routes.map(async (route) => {
        const asset = route.assetId ? await ctx.db.get(route.assetId) : null;
        return {
          ...route,
          vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
        };
      })
    );
  },
});

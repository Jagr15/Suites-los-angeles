import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { vehicleFields } from "./schema";

/**
 * Crea un nuevo vehículo.
 */
export const create = mutation({
  args: vehicleFields,
  handler: async (ctx, args) => {
    const vehicleId = await ctx.db.insert("vehicles", args);
    
    // Crear automáticamente el activo fijo asociado
    const assetId = await ctx.db.insert("assets", {
      name: `Vehículo: ${args.name}`,
      category: "Equipo de Transporte",
      acquisitionValue: args.acquisitionValue ?? 0,
      acquisitionDate: args.acquisitionDate ?? new Date().toISOString().split("T")[0],
      usefulLifeYears: args.usefulLifeYears ?? 5,
      status: "Activo",
      vehicleId: vehicleId,
    });

    // Vincular el activo al vehículo
    await ctx.db.patch(vehicleId, { assetId });
    
    return vehicleId;
  },
});

/**
 * Actualiza la información de un vehículo.
 */
export const update = mutation({
  args: {
    id: v.id("vehicles"),
    ...vehicleFields,
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

/**
 * Elimina un vehículo.
 */
export const remove = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

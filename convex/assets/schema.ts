import { defineTable } from "convex/server";
import { v } from "convex/values";

// Categorías ahora son dinámicas desde la tabla fixedAssetTypes

export const assetFields = {
  name: v.string(),
  description: v.optional(v.string()),
  category: v.string(),
  model: v.optional(v.string()), // Agregado: Modelo del activo
  brand: v.optional(v.string()), // Agregado: Marca (para vehículos)
  plate: v.optional(v.string()), // Agregado: Placas (para vehículos)
  year: v.optional(v.string()), // Agregado: Año (para vehículos)
  acquisitionValue: v.number(),
  acquisitionDate: v.string(), // ISO date
  usefulLifeYears: v.number(),
  serialNumber: v.optional(v.string()),
  status: v.union(v.literal("Activo"), v.literal("Inactivo"), v.literal("Mantenimiento")),
  vehicleId: v.optional(v.id("vehicles")), // Link to vehicles if it's "Equipo de Transporte"
  image: v.optional(v.string()),
};

export const assetsTable = defineTable(assetFields).index("by_category", ["category"]);

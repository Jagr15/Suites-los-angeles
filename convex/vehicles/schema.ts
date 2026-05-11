import { defineTable } from "convex/server";
import { v } from "convex/values";

export const vehicleFields = {
  name: v.string(), // Ej: "Camión 01"
  brand: v.optional(v.string()), // Ej: "Isuzu"
  model: v.optional(v.string()), // Ej: "Elf 300"
  plate: v.string(), // Placas
  year: v.optional(v.string()),
  isActive: v.boolean(),
  assetId: v.optional(v.id("assets")),
  // Campos de Activo Fijo integrados
  acquisitionValue: v.optional(v.number()),
  acquisitionDate: v.optional(v.string()),
  usefulLifeYears: v.optional(v.number()),
};

export const vehiclesTable = defineTable(vehicleFields).index("by_plate", ["plate"]);

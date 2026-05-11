import { defineTable } from "convex/server";
import { v } from "convex/values";

export const inventoryLogFields = {
  productId: v.id("products"),
  bodegaId: v.id("bodegas"),
  type: v.union(v.literal("entrada"), v.literal("salida"), v.literal("ajuste")),
  previousStock: v.number(),
  quantity: v.number(),
  newStock: v.number(),
  reason: v.string(), // Ej: "Compra CG-100", "Venta", "Ajuste manual"
  referenceId: v.optional(v.string()), // ID de la compra o salida
  date: v.string(), // ISO String
};

export const inventoryLogsTable = defineTable(inventoryLogFields)
  .index("by_product", ["productId"])
  .index("by_bodega", ["bodegaId"])
  .index("by_date", ["date"]);

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const inventoryFields = {
  productId: v.id("products"),
  bodegaId: v.id("bodegas"),
  quantity: v.number(),
};

export const inventoryTable = defineTable(inventoryFields)
  .index("by_product", ["productId"])
  .index("by_bodega", ["bodegaId"])
  .index("by_product_bodega", ["productId", "bodegaId"]);

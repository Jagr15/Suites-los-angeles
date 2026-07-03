import { defineTable } from "convex/server";
import { v } from "convex/values";

export const saleItemFields = {
  saleId: v.id("salidas"),
  productId: v.id("products"),
  quantity: v.number(),
  price: v.number(),
  subtotal: v.number(),
};

export const salesTable = defineTable({
  clientId: v.optional(v.id("clients")),
  profileId: v.id("profiles"),
  routeId: v.optional(v.id("routes")),
  total: v.number(),
  paymentMethod: v.union(v.literal("cash"), v.literal("credit"), v.literal("transfer")),
  status: v.string(),
  date: v.string(),
  timestamp: v.number(),
  notes: v.optional(v.string()),
});

export const saleItemsTable = defineTable(saleItemFields)
  .index("by_saleId", ["saleId"])
  .index("by_productId", ["productId"]);

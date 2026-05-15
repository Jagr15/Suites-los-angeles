import { defineTable } from "convex/server";
import { v } from "convex/values";

export const purchaseFields = {
  supplierId: v.id("suppliers"),
  bodegaId: v.id("bodegas"),
  folio: v.string(),
  folioNumber: v.optional(v.number()),
  date: v.string(), 
  dueDate: v.optional(v.string()), 
  totalAmount: v.number(),
  remainingAmount: v.optional(v.number()), 
  stockApplied: v.optional(v.boolean()),
  status: v.union(
    v.literal("Pendiente"),
    v.literal("Pagado"),
    v.literal("Cancelado"),
    v.literal("Vencido")
  ),
  receptionStatus: v.union(
    v.literal("Completa"),
    v.literal("Faltante"),
    v.literal("Pendiente")
  ),
  notes: v.optional(v.string()),
};

export const purchaseItemFields = {
  purchaseId: v.id("purchases"),
  productId: v.id("products"),
  quantity: v.number(),
  unitCost: v.number(),
  totalCost: v.number(),
};

export const purchasesTable = defineTable(purchaseFields)
  .index("by_supplierId", ["supplierId"])
  .index("by_folio", ["folio"])
  .index("by_status", ["status"])
  .index("by_dueDate", ["dueDate"]);

export const purchaseItemsTable = defineTable(purchaseItemFields)
  .index("by_purchaseId", ["purchaseId"])
  .index("by_productId", ["productId"]);

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const supplierTransactionFields = {
  supplierId: v.id("suppliers"),
  date: v.string(),
  type: v.union(v.literal("Cargo"), v.literal("Abono")), 
  amount: v.number(),
  balanceAfter: v.number(), 
  status: v.string(), 
  category: v.optional(v.string()), 
  description: v.string(), 
  referenceId: v.optional(v.string()), 
  paymentMethod: v.optional(v.union(
    v.literal("Efectivo"),
    v.literal("Transferencia"),
    v.literal("Cheque"),
    v.literal("Nota de Crédito")
  )),
};

export const supplierTransactionsTable = defineTable(supplierTransactionFields)
  .index("by_supplierId", ["supplierId"])
  .index("by_date", ["date"])
  .index("by_reference", ["referenceId"]);

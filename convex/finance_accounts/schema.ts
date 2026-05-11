import { defineTable } from "convex/server";
import { v } from "convex/values";

export const financeAccountFields = {
  alias: v.string(),
  type: v.union(v.literal("Débito"), v.literal("Crédito"), v.literal("Caja Chica"), v.literal("Caja Fuerte")),
  initialBalance: v.number(),
  currentBalance: v.number(),
  currency: v.string(), // Ej: "MXN"
  isActive: v.boolean(),
};

export const financeAccountsTable = defineTable(financeAccountFields).index("by_type", ["type"]);

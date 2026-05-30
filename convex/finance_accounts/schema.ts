import { defineTable } from "convex/server";
import { v } from "convex/values";

export const financeAccountFields = {
  alias: v.string(),
  type: v.union(v.literal("Débito"), v.literal("Crédito"), v.literal("Caja Chica"), v.literal("Caja Fuerte")),
  initialBalance: v.number(),
  currentBalance: v.number(),
  currency: v.string(), // Ej: "MXN"
  isActive: v.boolean(),
  responsibleProfileId: v.optional(v.id("profiles")),
  responsibleUserId: v.optional(v.id("users")),
  responsibleName: v.optional(v.string()),
  linkedEntityType: v.optional(v.union(v.literal("bodega"), v.literal("route"), v.literal("manual"))),
  linkedEntityId: v.optional(v.string()),
  isSystemLinked: v.optional(v.boolean()),
};

export const financeAccountsTable = defineTable(financeAccountFields)
  .index("by_type", ["type"])
  .index("by_linked_entity", ["linkedEntityType", "linkedEntityId"]);

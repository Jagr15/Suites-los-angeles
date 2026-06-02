import { defineTable } from "convex/server";
import { v } from "convex/values";

export const pricingProductTiersTable = defineTable({
  productId: v.id("products"),
  minQty: v.number(),
  maxQty: v.optional(v.number()),
  basePrice: v.number(),
  active: v.boolean(),
  ruleVersion: v.number(),
  effectiveFrom: v.optional(v.string()),
  effectiveTo: v.optional(v.string()),
  notes: v.optional(v.string()),
})
  .index("by_productId", ["productId"])
  .index("by_productId_minQty", ["productId", "minQty"])
  .index("by_active", ["active"]);

export const pricingZoneMarginsTable = defineTable({
  scopeType: v.union(v.literal("municipality"), v.literal("state"), v.literal("client")),
  scopeKey: v.string(),
  scopeLabel: v.optional(v.string()),
  stateId: v.optional(v.string()),
  stateName: v.optional(v.string()),
  municipalityId: v.optional(v.string()),
  municipalityName: v.optional(v.string()),
  zoneKey: v.optional(v.union(v.literal("Zona 1"), v.literal("Zona 2"), v.literal("Zona 3"))),
  zoneName: v.optional(v.string()),
  marginType: v.optional(v.union(v.literal("fijo"))),
  marginAmount: v.number(),
  active: v.boolean(),
  ruleVersion: v.number(),
  effectiveFrom: v.optional(v.string()),
  effectiveTo: v.optional(v.string()),
  notes: v.optional(v.string()),
})
  .index("by_scopeType_scopeKey", ["scopeType", "scopeKey"])
  .index("by_municipalityId", ["municipalityId"])
  .index("by_active", ["active"]);

export const pricingCustomerLevelsTable = defineTable({
  code: v.string(),
  name: v.string(),
  discountPct: v.number(),
  active: v.boolean(),
  ruleVersion: v.number(),
  minMonthlyAmount: v.optional(v.number()),
  description: v.optional(v.string()),
})
  .index("by_code", ["code"])
  .index("by_active", ["active"]);

export const pricingSettingsTable = defineTable({
  key: v.string(),
  value: v.string(),
  updatedAt: v.string(),
}).index("by_key", ["key"]);

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const bodegaFields = {
  name: v.string(),
  description: v.optional(v.string()),
  address: v.optional(v.string()),
  manager: v.optional(v.string()),
  phone: v.optional(v.string()),
  isActive: v.boolean(),
};

export const bodegasTable = defineTable(bodegaFields).index("by_name", ["name"]);

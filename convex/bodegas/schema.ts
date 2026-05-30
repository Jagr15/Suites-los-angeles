import { defineTable } from "convex/server";
import { v } from "convex/values";

export const bodegaFields = {
  name: v.string(),
  description: v.optional(v.string()),
  address: v.optional(v.string()),
  manager: v.optional(v.string()),
  managerProfileId: v.optional(v.id("profiles")),
  managerUserId: v.optional(v.id("users")),
  phone: v.optional(v.string()),
  isActive: v.boolean(),
  allowedUserIds: v.optional(v.array(v.id("users"))),
};

export const bodegasTable = defineTable(bodegaFields).index("by_name", ["name"]);

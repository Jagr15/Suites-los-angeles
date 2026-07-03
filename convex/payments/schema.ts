import { defineTable } from "convex/server";
import { v } from "convex/values";

export const paymentFields = {
  salidaId: v.optional(v.id("salidas")),
  clientId: v.id("clients"),
  profileId: v.id("profiles"),
  routeId: v.optional(v.id("routes")),
  amount: v.number(),
  date: v.string(),
  timestamp: v.number(),
  method: v.union(v.literal("cash"), v.literal("transfer")),
  notes: v.optional(v.string()),
};

export const paymentsTable = defineTable(paymentFields)
  .index("by_clientId", ["clientId"])
  .index("by_profileId", ["profileId"])
  .index("by_routeId", ["routeId"])
  .index("by_date", ["date"]);

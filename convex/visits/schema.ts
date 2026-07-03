import { defineTable } from "convex/server";
import { v } from "convex/values";

export const visitFields = {
  salidaId: v.optional(v.id("salidas")),
  clientId: v.id("clients"),
  routeId: v.id("routes"),
  profileId: v.id("profiles"),
  date: v.string(),
  timestamp: v.number(),
  type: v.union(v.literal("sale"), v.literal("check-in"), v.literal("no-sale")),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  notes: v.optional(v.string()),
  reason: v.optional(v.string()),
};

export const visitsTable = defineTable(visitFields)
  .index("by_profile_date", ["profileId", "date"])
  .index("by_route_date", ["routeId", "date"])
  .index("by_client_date", ["clientId", "date"]);

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const clientsTable = defineTable({
  commercialName: v.string(),
  buyerName: v.string(),
  requiresInvoice: v.boolean(),
  businessName: v.optional(v.string()),
  rfc: v.optional(v.string()),
  taxRegime: v.optional(v.string()),
  mapsUrl: v.string(),
  townId: v.string(),
  townName: v.string(),
  municipalityId: v.string(),
  municipalityName: v.string(),
  stateId: v.optional(v.string()),
  stateName: v.optional(v.string()),
  visitFrequency: v.union(v.literal("Semanal"), v.literal("Quincenal"), v.literal("Mensual")),
  assignedRouteId: v.optional(v.id("routes")),
  assignedRouteName: v.optional(v.string()),
  creditLimit: v.number(),
  creditDays: v.number(),
  availableScheduleStart: v.optional(v.string()),
  availableScheduleEnd: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  image: v.optional(v.string()),
  visitOrder: v.optional(v.number()), // Orden de visita en la ruta
}).index("by_commercialName", ["commercialName"]);

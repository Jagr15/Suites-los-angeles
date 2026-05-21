import { defineTable } from "convex/server";
import { v } from "convex/values";

export const routeFields = {
  name: v.string(),
  destination: v.optional(v.string()),
  deliveryType: v.optional(v.union(v.literal("sucursal"), v.literal("envio"))),
  routeType: v.optional(v.union(v.literal("Interna"), v.literal("Externa"))),
  assignedUserId: v.optional(v.id("users")),
  assignedProfileId: v.optional(v.id("profiles")),
  assetId: v.optional(v.id("assets")),
  vehicleId: v.optional(v.string()), // Agregado para compatibilidad con datos existentes
  operationDays: v.array(v.string()),
  loadDay: v.string(),
  isActive: v.boolean(),
  requireGpsValidation: v.optional(v.boolean()),
  gpsRadiusLimit: v.optional(v.number()), // Distancia máxima en metros
  allowLocationUpdate: v.optional(v.boolean()), // Permiso para actualizar GPS del cliente
  requireKmTracking: v.optional(v.boolean()), // Obligatoriedad de registrar kilometraje
  allowOffHoursSales: v.optional(v.boolean()), // Permiso para vender fuera del horario establecido
  requireVisitOrder: v.optional(v.boolean()), // Obligatoriedad de seguir el orden de visita
  allowNoSaleCheckIn: v.optional(v.boolean()), // Permiso para hacer check-in sin registrar venta
  requireMinVisitTime: v.optional(v.boolean()), // Obligatoriedad de cumplir un tiempo mínimo
  minVisitTimeMinutes: v.optional(v.number()), // Tiempo mínimo en minutos
  startLat: v.optional(v.number()), // Latitud del punto de inicio (Bodega/Salida)
  startLng: v.optional(v.number()), // Longitud del punto de inicio
  stops: v.optional(v.array(v.object({
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
  }))),
};

export const routesTable = defineTable(routeFields)
  .index("by_name", ["name"])
  .index("by_assignedProfileId", ["assignedProfileId"])
  .index("by_assignedUserId", ["assignedUserId"]);

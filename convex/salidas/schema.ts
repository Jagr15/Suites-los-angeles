import { defineTable } from "convex/server";
import { v } from "convex/values";

export const salidaFields = {
  numeroSalida: v.string(),
  folioNumber: v.optional(v.number()),
  bodegaId: v.optional(v.id("bodegas")),
  clientId: v.optional(v.id("clients")),
  fecha: v.string(),
  status: v.string(),
  responsable: v.string(),
  tipoEntrega: v.string(),
  almacen: v.optional(v.string()),
  agente: v.optional(v.string()),
  clienteDireccion: v.optional(v.string()),
  totalAmount: v.number(),
  tipo: v.string(),
  
  // Campos adicionales encontrados en el formulario
  serie: v.optional(v.string()),
  clienteCodigo: v.optional(v.string()),
  clienteNombre: v.optional(v.string()),
  numeroDocumento: v.optional(v.string()),
  ruta: v.optional(v.string()),
  destino: v.optional(v.string()),
  
  items: v.array(
    v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
      subtotal: v.number(),
      basePrice: v.optional(v.number()),
      zoneMargin: v.optional(v.number()),
      discountPct: v.optional(v.number()),
      finalPrice: v.optional(v.number()),
      pricingSource: v.optional(v.string()),
      pricingRuleVersion: v.optional(v.number()),
      // Campos adicionales por item si los hay
      sku: v.optional(v.string()),
      descripcion: v.optional(v.string()),
    })
  ),
};

export const salidasTable = defineTable(salidaFields)
  .index("by_numeroSalida", ["numeroSalida"])
  .index("by_bodegaId", ["bodegaId"])
  .index("by_clientId", ["clientId"])
  .index("by_clientId_fecha", ["clientId", "fecha"])
  .index("by_status", ["status"])
  .index("by_tipo", ["tipo"]);

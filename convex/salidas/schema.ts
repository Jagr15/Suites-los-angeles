import { defineTable } from "convex/server";
import { v } from "convex/values";

export const salidaFields = {
  numeroSalida: v.string(),
  bodegaId: v.optional(v.id("bodegas")),
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
      // Campos adicionales por item si los hay
      sku: v.optional(v.string()),
      descripcion: v.optional(v.string()),
    })
  ),
};

export const salidasTable = defineTable(salidaFields)
  .index("by_numeroSalida", ["numeroSalida"])
  .index("by_bodegaId", ["bodegaId"])
  .index("by_status", ["status"])
  .index("by_tipo", ["tipo"]);

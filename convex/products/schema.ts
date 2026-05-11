import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productFields = {
  sku: v.string(),
  codigo: v.string(),
  producto: v.string(),
  cantidadEmpaque: v.string(),
  categoria: v.string(), // ID de product_categories (guardado como string para compatibilidad)
  subcategoria: v.string(), // ID de product_subcategories (guardado como string para compatibilidad)
  status: v.union(v.literal("Activo"), v.literal("Inactivo")),
  // Precios/Costos (15 listas)
  lista1: v.optional(v.string()),
  lista2: v.optional(v.string()),
  lista3: v.optional(v.string()),
  lista4: v.optional(v.string()),
  lista5: v.optional(v.string()),
  lista6: v.optional(v.string()),
  lista7: v.optional(v.string()),
  lista8: v.optional(v.string()),
  lista9: v.optional(v.string()),
  lista10: v.optional(v.string()),
  lista11: v.optional(v.string()),
  lista12: v.optional(v.string()),
  lista13: v.optional(v.string()),
  lista14: v.optional(v.string()),
  lista15: v.optional(v.string()),
  stock: v.optional(v.number()), // Inventario actual
  image: v.optional(v.string()),
};

export const productsTable = defineTable(productFields)
  .index("by_sku", ["sku"])
  .index("by_codigo", ["codigo"])
  .index("by_producto", ["producto"]);

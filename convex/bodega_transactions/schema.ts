import { v } from "convex/values";

export const bodegaIngresosFields = {
  bodegaId: v.optional(v.id("bodegas")),
  folio: v.optional(v.string()),
  folioNumber: v.optional(v.number()),
  amount: v.number(),
  categoryId: v.id("bodega_categorias"),
  subcategoryId: v.optional(v.id("bodega_categorias")),
  date: v.string(),
  responsibleId: v.optional(v.id("profiles")),
  responsibleName: v.string(),
  responsibleGroup: v.optional(v.string()),
  clientName: v.optional(v.string()),
  evidenceStorageId: v.optional(v.string()),
  notes: v.optional(v.string()),
};

export const bodegaEgresosFields = {
  bodegaId: v.optional(v.id("bodegas")),
  folio: v.optional(v.string()),
  folioNumber: v.optional(v.number()),
  amount: v.number(),
  categoryId: v.id("bodega_categorias"),
  subcategoryId: v.optional(v.id("bodega_categorias")),
  date: v.string(),
  responsibleId: v.optional(v.id("profiles")),
  responsibleName: v.string(),
  responsibleGroup: v.optional(v.string()),
  provider: v.optional(v.string()),
  evidenceStorageId: v.optional(v.string()),
  notes: v.optional(v.string()),
};

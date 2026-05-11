import { z } from "zod";

const COMPRA_STATUS = ["Pendiente", "Revisado", "Completado", "Revisar"] as const;
const COMPRA_RECEPCION = ["Completa", "Faltante"] as const;
const COMPRA_REVISION = ["Confirmada", "Revisar"] as const;

const compraProductoSchema = z.object({
  id: z.string(),
  sku: z.string(),
  descripcion: z.string(),
  categoria: z.string(),
  subcategoria: z.string(),
  cantidad: z.number(),
  costo: z.number(),
  total: z.number(),
  stockAnterior: z.number(),
  stockNuevo: z.number(),
});

/** Schema Zod para crear/editar compra (registro de compra a proveedor). */
export const compraSchema = z.object({
  folio: z.string().min(1, "El folio es obligatorio"),
  proveedor: z.string().min(1, "El nombre del proveedor es obligatorio"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  recepcion: z.enum(COMPRA_RECEPCION).default("Completa"),
  revision: z.enum(COMPRA_REVISION).default("Revisar"),
  status: z.enum(COMPRA_STATUS).default("Pendiente"),
  monto: z.string().min(1, "El monto es obligatorio"),
  almacen: z.string().default("Almacén Central"),
  nota: z.string().optional(),
  productos: z.array(compraProductoSchema).default([]),
});

export type CompraFormValues = z.infer<typeof compraSchema>;

export { COMPRA_STATUS, COMPRA_RECEPCION, COMPRA_REVISION };

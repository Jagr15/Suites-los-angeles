import { z } from "zod";

/** Schema Zod para crear/editar producto. Solo los datos principales son obligatorios; los precios son opcionales. */
export const productoSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),
  codigo: z.string().min(1, "El código es obligatorio"),
  producto: z.string().min(1, "El nombre del producto es obligatorio"),
  cantidadEmpaque: z.string().min(1, "La cantidad por empaque es obligatoria"),
  categoria: z.string().min(1, "La categoría es obligatoria"),
  subcategoria: z.string().min(1, "La subcategoría es obligatoria"),
  status: z.enum(["Activo", "Inactivo"]),
  lista1: z.string().optional(),
  lista2: z.string().optional(),
  lista3: z.string().optional(),
  lista4: z.string().optional(),
  lista5: z.string().optional(),
  lista6: z.string().optional(),
  lista7: z.string().optional(),
  lista8: z.string().optional(),
  lista9: z.string().optional(),
  lista10: z.string().optional(),
  lista11: z.string().optional(),
  lista12: z.string().optional(),
  lista13: z.string().optional(),
  lista14: z.string().optional(),
  lista15: z.string().optional(),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;

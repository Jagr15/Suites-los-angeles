import { z } from "zod";

const PROVEEDOR_STATUS = ["Pendiente", "Pagado", "Cancelado"] as const;

/** Schema Zod para crear/editar proveedor. */
export const proveedorSchema = z.object({
  proveedor: z.string().min(1, "El nombre del proveedor es obligatorio"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  status: z.enum(PROVEEDOR_STATUS),
  monto: z.string().min(1, "El monto es obligatorio"),
});

export type ProveedorFormValues = z.infer<typeof proveedorSchema>;

export { PROVEEDOR_STATUS };

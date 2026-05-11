import { z } from "zod";

/** Tipo de entrega: define qué estados están disponibles. */
export const TIPO_ENTREGA_OPTIONS = ["sucursal", "envio"] as const;
export type TipoEntrega = (typeof TIPO_ENTREGA_OPTIONS)[number];

/** Estados cuando la ruta es entrega a sucursal. */
export const RUTA_STATUS_SUCURSAL = [
  "Listo para surtir",
  "Listo para checar",
  "Listo para empacar",
  "Listo para entregar",
  "Entregado",
] as const;

/** Estados cuando la ruta es envío (lejano). */
export const RUTA_STATUS_ENVIO = [
  "Listo para surtir",
  "Listo para checar",
  "Listo para empacar",
  "Listo para enviar",
  "En Camino",
  "Entregado",
] as const;

export type RutaStatusSucursal = (typeof RUTA_STATUS_SUCURSAL)[number];
export type RutaStatusEnvio = (typeof RUTA_STATUS_ENVIO)[number];

/** Schema Zod para crear/editar ruta. */
export const rutaSchema = z.object({
  ruta: z.string().min(1, "La ruta es obligatoria"),
  destino: z.string().min(1, "El destino es obligatorio"),
  responsable: z.string().min(1, "El responsable es obligatorio"),
  tipoEntrega: z.enum(TIPO_ENTREGA_OPTIONS),
  status: z.string().min(1, "El estado es obligatorio"),
});

export type RutaFormValues = z.infer<typeof rutaSchema>;

/** Opciones de estado según tipo de entrega (para UI). */
export function getStatusOptionsByTipo(tipo: TipoEntrega): readonly string[] {
  return tipo === "sucursal" ? RUTA_STATUS_SUCURSAL : RUTA_STATUS_ENVIO;
}

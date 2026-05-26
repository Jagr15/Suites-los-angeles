import { z } from "zod";

/** Tipo de entrega: define qué estados están disponibles (Status de pedido de bodega). */
export const BODEGA_TIPO_ENTREGA_OPTIONS = ["sucursal", "pedido"] as const;
export type BodegaTipoEntrega = (typeof BODEGA_TIPO_ENTREGA_OPTIONS)[number];

/** Estados cuando es entrega en sucursal. */
export const BODEGA_STATUS_SUCURSAL = [
  "Listo para surtir",
  "Listo para checar",
  "Listo para empacar",
  "Listo para entregar",
  "Entregado",
] as const;

/** Estados cuando es pedido (envío lejano). */
export const BODEGA_STATUS_PEDIDO = [
  "Listo para surtir",
  "Listo para checar",
  "Listo para empacar",
  "Listo para enviar",
  "En Camino",
  "Entregado",
] as const;

/** Schema Zod para los productos dentro de la carga */
export const bodegaProductoSchema = z.object({
  id: z.string(),
  sku: z.string(),
  descripcion: z.string(),
  stock: z.number().default(0),
  sinStock: z.boolean().default(false), // Indica si el artículo debe ir a la lista de "Sin Stock"
  cantidad: z.number().min(1, "La cantidad debe ser al menos 1"),
  precio: z.number().default(0),
  nombre: z.string().optional(),
  categoria: z.string().default("General"),
  subcategoria: z.string().default("Sin Categoría"),
  critico: z.number().default(10),
  bajo: z.number().default(30),
  optimo: z.number().default(50),
  etiqueta: z.string().default("Transparente"),
});

export type BodegaProducto = z.infer<typeof bodegaProductoSchema>;

/** Schema Zod para crear/editar registro de bodega (Carga). */
export const cargaBodegaSchema = z.object({
  numeroCarga: z.string().min(1, "El Nº de carga es obligatorio"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  status: z.string().min(1, "El estado es obligatorio"),
  responsable: z.string().min(1, "El vendedor es obligatorio"),
  clienteDireccion: z.string().optional(),
  agente: z.string().optional(),
  almacen: z.string().optional(),
  bodegaId: z.string().optional(),

  // Compatibilidad / productos
  tipoEntrega: z.enum(BODEGA_TIPO_ENTREGA_OPTIONS).default("sucursal"),
  productos: z.array(bodegaProductoSchema).default([]),

  // Opcionales que se mantienen si se necesitan pero no se muestran
  ruta: z.string().optional(),
  destino: z.string().optional(),
  serie: z.string().optional(),
  clienteCodigo: z.string().optional(),
  clienteNombre: z.string().optional(),
  numeroDocumento: z.string().optional(),
});

export type CargaBodegaFormValues = z.infer<typeof cargaBodegaSchema>;


/** Opciones de estado según tipo de entrega (para UI). */
export function getBodegaStatusOptionsByTipo(tipo: BodegaTipoEntrega): readonly string[] {
  return tipo === "sucursal" ? BODEGA_STATUS_SUCURSAL : BODEGA_STATUS_PEDIDO;
}

/**
 * Tipo de producto para el dominio y formularios.
 */

export type Producto = {
  id: string;
  sku: string;
  codigo: string;
  producto: string;
  cantidadEmpaque: string;
  categoria: string;
  subcategoria: string;
  status: "Activo" | "Inactivo";
  lista1: string;
  lista2: string;
  lista3: string;
  lista4: string;
  lista5: string;
  lista6: string;
  lista7: string;
  lista8: string;
  lista9: string;
  lista10: string;
  lista11: string;
  lista12: string;
  lista13: string;
  lista14: string;
  lista15: string;
};

/** Datos para crear un producto (sin id). */
export type ProductoCreate = Omit<Producto, "id">;

/** Opciones de status. */
export const PRODUCTO_STATUS = ["Activo", "Inactivo"] as const;

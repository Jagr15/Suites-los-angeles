/**
 * Mock de compras (compras a proveedores) para desarrollo y pruebas.
 * Columnas: Proveedor, Fecha, Estado, Monto.
 */
import { ALMACENES_MOCK } from "./bodega";

export type CompraProducto = {
  id: string;
  sku: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  cantidad: number;
  costo: number;
  total: number;
  stockAnterior: number;
  stockNuevo: number;
};

export type CompraRow = {
  id: string;
  folio: string;
  proveedorId: string;
  proveedor: string;
  fecha: string;
  recepcion: "Completa" | "Faltante";
  revision: "Confirmada" | "Revisar";
  status: string;
  monto: string;
  almacen?: string;
  nota?: string;
  productos: CompraProducto[];
};

const nombres = [
  "Dimuflo",
  "MDMX",
  "Huggos",
  "Pamego",
  "Papelería Hugo",
  "MDMX",
  "Mercería",
  "Dimuflo",
];

const fechas = [
  "26 Febrero 2026",
  "25 Febrero 2026",
  "10 Febrero 2026",
  "29 Enero 2026",
  "15 Enero 2026",
  "10 Enero 2026",
  "5 Enero 2026",
  "2 Enero 2026",
];

export const mockCompras: CompraRow[] = nombres.map((nombre, idx) => {
  const recepciones: ("Completa" | "Faltante")[] = ["Completa", "Faltante", "Completa", "Completa"];
  const revisiones: ("Confirmada" | "Revisar")[] = ["Revisar", "Revisar", "Confirmada", "Confirmada"];

  return {
    id: String(idx + 1),
    folio: String(1835 - idx),
    proveedorId: String(idx + 1),
    proveedor: nombre,
    fecha: fechas[idx % fechas.length],
    recepcion: recepciones[idx % recepciones.length] || "Completa",
    revision: revisiones[idx % revisiones.length] || "Revisar",
    status: (["Pendiente", "Revisado", "Completado", "Revisar"] as const)[idx % 4],
    monto: (35837.56 - idx * 5000).toLocaleString("en-US", { minimumFractionDigits: 2 }),
    almacen: ALMACENES_MOCK[idx % ALMACENES_MOCK.length],
    nota: idx === 1 ? "Faltaron 50 advil, solo llegaron 100" : "",
    productos: [
      {
        id: "1535",
        sku: "AMSOOM",
        descripcion: "Advil Mayo 500 Mg",
        categoria: "Farmacia",
        subcategoria: "Analgésico",
        cantidad: 100,
        costo: 41.36,
        total: 4136.00,
        stockAnterior: 125,
        stockNuevo: 225,
      }
    ],
  };
});

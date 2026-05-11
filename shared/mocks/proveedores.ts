/**
 * Mock de proveedores para desarrollo y pruebas.
 * Columnas: Proveedor, Fecha, Estado, Monto.
 */

export type ProveedorRow = {
  id: string;
  proveedor: string;
  fecha: string;
  status: string;
  monto: string;
};

const nombres = [
  "Pomeco",
  "Distribuidora Central",
  "Alimentos del Norte",
  "Suministros del Bajío",
  "Logística Express",
  "Comercializadora del Sur",
];

const fechas = ["21 Junio 2023", "15 Julio 2023", "3 Agosto 2023", "12 Sep 2023", "20 Oct 2023", "5 Nov 2023"];

const estados = ["Pendiente", "Pagado", "Pendiente", "Pagado", "Pendiente", "Cancelado"];

export const mockProveedores: ProveedorRow[] = nombres.map((nombre, idx) => ({
  id: String(idx + 1),
  proveedor: nombre,
  fecha: fechas[idx % fechas.length],
  status: estados[idx % estados.length],
  monto: idx % 2 === 0 ? "-12519.93" : "8450.00",
}));

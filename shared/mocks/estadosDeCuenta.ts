/**
 * Mock de estados de cuenta por proveedor (distribuidora México).
 * Cada estado muestra: proveedor, total, fecha a pagar y monto a pagar.
 */

export type EstadoCuentaRow = {
  id: string;
  proveedor: string;
  total: string;
  /** Texto de la fecha, ej. "16 de feb" */
  fechaPago: string;
  /** Monto a pagar en esa fecha */
  montoAPagar: string;
};

export const mockEstadosDeCuenta: EstadoCuentaRow[] = [
  {
    id: "1",
    proveedor: "Pamego",
    total: "$65,815.85",
    fechaPago: "16 de feb",
    montoAPagar: "$53,853.15",
  },
  {
    id: "2",
    proveedor: "MDMX",
    total: "$99,850.54",
    fechaPago: "17 de feb",
    montoAPagar: "$83,500.50",
  },
  {
    id: "3",
    proveedor: "Huggos",
    total: "$15,816.00",
    fechaPago: "18 feb",
    montoAPagar: "$5,816.00",
  },
];

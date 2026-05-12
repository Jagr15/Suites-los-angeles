import { query } from "../_generated/server";

/**
 * Compatibilidad temporal para frontend legacy que consulta
 * api.purchase_budgets.queries.list.
 *
 * Retorna arreglo vacío de forma segura para evitar crashes
 * cuando no existe módulo/tablas de presupuestos en este entorno.
 */
export const list = query({
  args: {},
  handler: async () => {
    return [];
  },
});


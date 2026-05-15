export type PermissionRoleName = "SuperAdmin" | "Admin" | "Bodeguero" | "Vendedor";

export interface PermissionDefinition {
  key: string;
  label: string;
  section:
    | "Ruta/GPS"
    | "Dinero/Cobranza"
    | "Ventas/Inventario"
    | "Clientes/Crédito"
    | "Sistema/App"
    | "Inventario/Bodega"
    | "Entradas"
    | "Salidas"
    | "Nóminas"
    | "Control general"
    | "Compatibilidad actual";
  sensitive?: boolean;
  implemented?: boolean;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: "sales:allow_outside_customer_coordinates", label: "Permitir venta fuera de coordenadas del cliente", section: "Ruta/GPS", sensitive: true },
  { key: "customers:allow_update_gps", label: "Permitir actualizar GPS de cliente", section: "Ruta/GPS", sensitive: true },
  { key: "routes:require_start_end_mileage", label: "Requerir kilometraje inicio/fin", section: "Ruta/GPS" },
  { key: "sales:allow_outside_work_schedule", label: "Permitir venta fuera de horario laboral", section: "Ruta/GPS", sensitive: true },
  { key: "routes:require_route_order", label: "Requerir orden de ruta", section: "Ruta/GPS" },
  { key: "visits:allow_checkin_without_sale", label: "Permitir check-in sin venta", section: "Ruta/GPS" },
  { key: "visits:require_minimum_visit_time", label: "Requerir tiempo mínimo de visita", section: "Ruta/GPS" },

  { key: "sales:allow_price_edit", label: "Permitir edición de precio", section: "Dinero/Cobranza", sensitive: true },
  { key: "sales:allow_manual_discount", label: "Permitir descuento manual", section: "Dinero/Cobranza", sensitive: true },
  { key: "cash:blind_cash_count", label: "Conteo ciego de caja", section: "Dinero/Cobranza" },
  { key: "products:hide_cost_and_margin", label: "Ocultar costo y margen de productos", section: "Dinero/Cobranza" },
  { key: "expenses:allow_salesman_operational_expenses", label: "Permitir gastos operativos de vendedor", section: "Dinero/Cobranza", sensitive: true },
  { key: "collections:allow_pending_invoice_payment", label: "Permitir pago de factura pendiente", section: "Dinero/Cobranza" },
  { key: "collections:allow_check_transfer_payment", label: "Permitir pago con cheque/transferencia", section: "Dinero/Cobranza", sensitive: true },
  { key: "collections:restrict_payment_date_edit", label: "Restringir edición de fecha de pago", section: "Dinero/Cobranza" },

  { key: "sales:allow_without_stock", label: "Permitir vender sin stock", section: "Ventas/Inventario", sensitive: true },
  { key: "sales:restrict_cancel_finalized", label: "Restringir cancelación de ventas finalizadas", section: "Ventas/Inventario" },
  { key: "sales:allow_returns_exchanges", label: "Permitir devoluciones/cambios", section: "Ventas/Inventario", sensitive: true },
  { key: "inventory:allow_transfer_between_salesmen", label: "Permitir transferencias entre vendedores", section: "Ventas/Inventario", sensitive: true },
  { key: "inventory:allow_view_central_stock", label: "Permitir ver stock central", section: "Ventas/Inventario" },
  { key: "inventory:allow_report_damaged_products", label: "Permitir reportar productos dañados", section: "Ventas/Inventario" },

  { key: "customers:allow_create", label: "Permitir crear clientes", section: "Clientes/Crédito" },
  { key: "customers:allow_credit_limit_assignment", label: "Permitir asignar límite de crédito", section: "Clientes/Crédito", sensitive: true },
  { key: "customers:restrict_view_other_salesmen", label: "Restringir ver clientes de otros vendedores", section: "Clientes/Crédito" },
  { key: "customers:allow_credit_terms_edit", label: "Permitir editar términos de crédito", section: "Clientes/Crédito", sensitive: true },
  { key: "customers:require_business_photos", label: "Requerir fotos de negocio", section: "Clientes/Crédito" },

  { key: "app:allow_offline_mode", label: "Permitir modo offline", section: "Sistema/App" },
  { key: "reports:allow_historical_reports", label: "Permitir reportes históricos", section: "Sistema/App" },
  { key: "app:allow_bluetooth_printer_config", label: "Permitir configurar impresora Bluetooth", section: "Sistema/App" },

  { key: "warehouse:allow_inventory_tab", label: "Permitir pestaña de inventario en bodega", section: "Inventario/Bodega" },
  { key: "inventory:allow_manual_adjustments", label: "Permitir ajustes manuales de inventario", section: "Inventario/Bodega", sensitive: true, implemented: true },

  { key: "purchases:allow_create_entries", label: "Permitir crear entradas", section: "Entradas", implemented: true },
  { key: "purchases:edit_reception_status", label: "Permitir editar estado de recepción", section: "Entradas", sensitive: true, implemented: true },
  { key: "purchases:restrict_edit_registered_entries", label: "Restringir edición de entradas registradas", section: "Entradas" },

  { key: "warehouse_outputs:allow_create", label: "Permitir crear salidas", section: "Salidas" },
  { key: "warehouse_outputs:edit_status", label: "Permitir editar estado de salida", section: "Salidas" },
  { key: "warehouse_outputs:assign_route_responsible", label: "Permitir asignar responsable de ruta", section: "Salidas" },

  { key: "warehouse_money:allow_income", label: "Permitir ingresos de bodega", section: "Nóminas" },
  { key: "warehouse_money:allow_expense", label: "Permitir egresos de bodega", section: "Nóminas" },
  { key: "warehouse_money:restrict_date_edit", label: "Restringir edición de fecha (movimientos bodega)", section: "Nóminas" },
  { key: "warehouse_money:show_daily_totals", label: "Mostrar totales diarios", section: "Nóminas" },
  { key: "payroll:allow_view", label: "Permitir ver nóminas", section: "Nóminas" },
  { key: "payroll:allow_employee_debt_payment", label: "Permitir pago de deuda a empleado", section: "Nóminas" },
  { key: "payroll:allow_mark_as_delivered", label: "Permitir marcar nómina como entregada", section: "Nóminas" },

  { key: "records:restrict_delete", label: "Restringir eliminación de registros", section: "Control general" },
  { key: "suppliers:restrict_edit", label: "Restringir edición de proveedores", section: "Control general" },
  { key: "evidence:require_photos_for_entries_expenses", label: "Requerir evidencia fotográfica en entradas/gastos", section: "Control general" },

  { key: "sales:view", label: "Ver ventas", section: "Compatibilidad actual", implemented: true },
  { key: "sales:create", label: "Crear ventas", section: "Compatibilidad actual", implemented: true },
  { key: "clients:view", label: "Ver clientes", section: "Compatibilidad actual", implemented: true },
  { key: "clients:edit", label: "Editar clientes", section: "Compatibilidad actual", implemented: true },
  { key: "inventory:view", label: "Ver inventario", section: "Compatibilidad actual", implemented: true },
  { key: "inventory:edit", label: "Editar inventario", section: "Compatibilidad actual", implemented: true },
  { key: "warehouse:view", label: "Ver bodega", section: "Compatibilidad actual", implemented: true },
  { key: "warehouse:edit", label: "Editar bodega", section: "Compatibilidad actual", implemented: true },
  { key: "routes:view", label: "Ver rutas", section: "Compatibilidad actual", implemented: true },
  { key: "routes:edit", label: "Editar rutas", section: "Compatibilidad actual", implemented: true },
  { key: "finance:view", label: "Ver finanzas", section: "Compatibilidad actual", implemented: true },
  { key: "finance:edit", label: "Editar finanzas", section: "Compatibilidad actual", implemented: true },
  { key: "suppliers:view", label: "Ver proveedores", section: "Compatibilidad actual", implemented: true },
  { key: "suppliers:edit", label: "Editar proveedores", section: "Compatibilidad actual", implemented: true },
  { key: "purchases:edit_payment_status", label: "Editar estado de pago", section: "Compatibilidad actual", implemented: true },
  { key: "purchases:edit_date", label: "Editar fecha de compra", section: "Compatibilidad actual", implemented: true },
  { key: "settings:manage", label: "Gestionar configuración", section: "Compatibilidad actual", implemented: true },
  { key: "users:manage", label: "Gestionar usuarios", section: "Compatibilidad actual", implemented: true },
];

const ALL_KEYS = PERMISSION_CATALOG.map((p) => p.key);
const UNIQUE_ALL_KEYS = Array.from(new Set(ALL_KEYS));
const vendorDefaults = new Set<string>([
  "sales:view",
  "sales:create",
  "clients:view",
  "clients:edit",
  "routes:view",
  "customers:allow_create",
  "customers:restrict_view_other_salesmen",
  "customers:require_business_photos",
  "app:allow_offline_mode",
  "app:allow_bluetooth_printer_config",
  "products:hide_cost_and_margin",
  "routes:require_start_end_mileage",
  "routes:require_route_order",
  "visits:allow_checkin_without_sale",
  "visits:require_minimum_visit_time",
  "sales:restrict_cancel_finalized",
  "inventory:allow_report_damaged_products",
]);

const warehouseDefaults = new Set<string>([
  "inventory:view",
  "inventory:edit",
  "warehouse:view",
  "warehouse:edit",
  "routes:view",
  "warehouse:allow_inventory_tab",
  "inventory:allow_manual_adjustments",
  "purchases:allow_create_entries",
  "warehouse_money:allow_income",
  "warehouse_money:allow_expense",
  "warehouse_money:show_daily_totals",
  "payroll:allow_view",
]);

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<PermissionRoleName, string[]> = {
  SuperAdmin: ["all", ...UNIQUE_ALL_KEYS],
  Admin: ["all", ...UNIQUE_ALL_KEYS],
  Bodeguero: UNIQUE_ALL_KEYS.filter((key) => warehouseDefaults.has(key)),
  Vendedor: UNIQUE_ALL_KEYS.filter((key) => vendorDefaults.has(key)),
};

export const PERMISSION_KEYS = new Set(UNIQUE_ALL_KEYS);

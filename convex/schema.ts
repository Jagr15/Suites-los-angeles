import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
// Importaciones de tablas de la aplicación
import { v } from "convex/values";
import { bodegasTable } from "./bodegas/schema";
import { suppliersTable } from "./suppliers/schema";
import { purchasesTable, purchaseItemsTable } from "./purchases/schema";
import { routesTable } from "./routes/schema";
import { productsTable } from "./products/schema";
import { vehiclesTable } from "./vehicles/schema";
import { assetsTable } from "./assets/schema";
import { supplierTransactionsTable } from "./supplierTransactions/schema";
import { inventoryLogsTable } from "./inventoryLogs/schema";
import { inventoryTable } from "./inventory/schema";
import { clientsTable } from "./clients/schema";
import { bodegaIngresosFields, bodegaEgresosFields } from "./bodega_transactions/schema";
import { loansTable } from "./loans/schema";
import { creditsTable } from "./credits/schema";
import { financeAccountsTable } from "./finance_accounts/schema";
import { productCategoriesTable, productSubcategoriesTable } from "./product_categories/schema";
import { salidasTable } from "./salidas/schema";


export default defineSchema({
  ...authTables,

  // Extendemos la tabla de usuarios de auth
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    profileId: v.optional(v.id("profiles")),
    role: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  // Nueva tabla de Roles Dinámicos
  roles: defineTable({
    name: v.string(), // Ejemplo: "Mesero", "Cajero", "Admin"
    description: v.optional(v.string()),
    permissions: v.array(v.string()), // Lista de llaves: ["pos:view", "staff:edit"]
  }).index("by_name", ["name"]),

  // Tabla para información detallada de perfiles/empleados (RRHH)
  profiles: defineTable({
    userId: v.optional(v.id("users")),
    fullName: v.string(),
    rfc: v.optional(v.string()),
    curp: v.optional(v.string()),
    nss: v.optional(v.string()),
    personalPhone: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    hireDate: v.optional(v.string()),
    position: v.optional(v.string()),
    baseSalary: v.optional(v.number()),
    status: v.union(v.literal("Activo"), v.literal("Inactivo")),
    isEmployee: v.optional(v.boolean()),
    group: v.optional(v.union(
      v.literal("Administración"),
      v.literal("Ventas"),
      v.literal("Bodega"),
      v.literal("Sistemas")
    )),
    workplaceType: v.optional(v.union(
      v.literal("Casa"), 
      v.literal("Bodega"), 
      v.literal("Ruta"), 
      v.literal("Ventas")
    )),
    assignedBodegaId: v.optional(v.id("bodegas")),
    workStart: v.optional(v.string()), // Formato "HH:mm"
    workEnd: v.optional(v.string()),   // Formato "HH:mm"
    workDays: v.optional(v.array(v.string())), // ["L", "M", "X", "J", "V", "S", "D"]
    workSchedule: v.optional(v.array(v.object({
      day: v.string(),
      start: v.string(),
      end: v.string(),
      enabled: v.boolean(),
    }))),
    image: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
  // Tabla de Clientes
  clients: clientsTable,

  // Tabla de Rutas
  routes: routesTable,

  // Tabla de Vehículos
  vehicles: vehiclesTable,

  // Tabla de Activos Fijos
  assets: assetsTable,

  // Tabla de Proveedores
  suppliers: suppliersTable,

  // Tabla de Bodegas/Almacenes
  bodegas: bodegasTable,
  
  // Tabla de Compras
  purchases: purchasesTable,
  // Tabla de Productos
  // Tabla de Productos
  products: productsTable,
  purchase_items: purchaseItemsTable,
  supplierTransactions: supplierTransactionsTable,
  inventoryLogs: inventoryLogsTable,
  inventory: inventoryTable,
  
  // Tipos de Activos Fijos (Configurables)
  fixedAssetTypes: defineTable({
    name: v.string(), // Ej. "Camioneta", "Computadora"
    description: v.optional(v.string()),
    requiresModel: v.optional(v.boolean()), // Para habilitar campos dinámicos
  }).index("by_name", ["name"]),

  // Movimientos Financieros de Bodega
  bodega_ingresos: defineTable(bodegaIngresosFields)
    .index("by_bodegaId", ["bodegaId"])
    .index("by_date", ["date"]),
    
  bodega_egresos: defineTable(bodegaEgresosFields)
    .index("by_bodegaId", ["bodegaId"])
    .index("by_date", ["date"]),

  // Categorías de Movimientos (Ingresos/Egresos)
  bodega_categorias: defineTable({
    name: v.string(),
    type: v.union(v.literal("ingreso"), v.literal("egreso")),
    parentCategoryId: v.optional(v.id("bodega_categorias")), // Para subcategorías
    isActive: v.boolean(),
  })
    .index("by_type", ["type"])
    .index("by_parent", ["parentCategoryId"]),

  // Gestión Financiera
  loans: loansTable,
  credits: creditsTable,
  finance_accounts: financeAccountsTable,

  // Categorías de Productos
  product_categories: productCategoriesTable,
  product_subcategories: productSubcategoriesTable,

  // Tabla de Salidas (Cargas/Ventas)
  salidas: salidasTable,

  // Secuencias consecutivas de folios y contadores del sistema
  sequences: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),
});

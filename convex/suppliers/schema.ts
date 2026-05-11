import { defineTable } from "convex/server";
import { v } from "convex/values";

export const supplierFields = {
  businessName: v.string(),
  name: v.optional(v.string()), // Nombre corto/comercial - Opcional para compatibilidad
  rfc: v.string(),
  creditDays: v.number(),
  creditLimit: v.optional(v.number()),
  currentBalance: v.optional(v.number()), // Saldo actual (deuda) - Opcional para compatibilidad
  contacts: v.array(
    v.object({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
    })
  ),
  bankAccounts: v.array(
    v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      clabe: v.string(),
    })
  ),
};

export const suppliersTable = defineTable(supplierFields).index("by_businessName", ["businessName"]);

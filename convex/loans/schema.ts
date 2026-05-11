import { defineTable } from "convex/server";
import { v } from "convex/values";

export const loanFields = {
  type: v.union(v.literal("Otorgado"), v.literal("Recibido")),
  subject: v.string(), // Nombre del deudor o acreedor
  amount: v.number(),
  interestRate: v.number(),
  termMonths: v.number(),
  frequency: v.union(v.literal("Semanal"), v.literal("Quincenal"), v.literal("Mensual")),
  startDate: v.string(),
  status: v.union(v.literal("Activo"), v.literal("Liquidado"), v.literal("Vencido")),
  notes: v.optional(v.string()),
};

export const loansTable = defineTable(loanFields).index("by_type", ["type"]);

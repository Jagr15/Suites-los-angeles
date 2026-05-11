import { defineTable } from "convex/server";
import { v } from "convex/values";

export const creditFields = {
  institution: v.string(),
  totalAmount: v.number(),
  downPayment: v.number(),
  remainingCapital: v.number(),
  interestRate: v.number(),
  termMonths: v.number(),
  closingDay: v.number(),
  startDate: v.string(),
  type: v.union(v.literal("Hipotecario"), v.literal("Automotriz"), v.literal("Personal"), v.literal("Arrendamiento")),
};

export const creditsTable = defineTable(creditFields).index("by_institution", ["institution"]);

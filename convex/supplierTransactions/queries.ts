import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Lista los movimientos de estado de cuenta de un proveedor específico.
 */
export const listBySupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("supplierTransactions")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .order("desc")
      .collect();
  },
});

/**
 * Lista todos los movimientos de estado de cuenta.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("supplierTransactions")
      .order("desc")
      .collect();
  },
});

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Lista todos los proveedores.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("suppliers").collect();
  },
});

/**
 * Lista proveedores con métricas financieras consolidadas.
 */
export const listWithMetrics = query({
  args: {},
  handler: async (ctx) => {
    const suppliers = await ctx.db.query("suppliers").collect();

    return await Promise.all(
      suppliers.map(async (supplier) => {
        const purchases = await ctx.db
          .query("purchases")
          .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
          .collect();

        const transactions = await ctx.db
          .query("supplierTransactions")
          .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
          .collect();

        const totalPurchases = purchases.reduce((acc, purchase) => acc + purchase.totalAmount, 0);
        const totalPayments = transactions
          .filter((trx) => trx.type === "Abono")
          .reduce((acc, trx) => acc + trx.amount, 0);
        const outstandingBalance = purchases.reduce((acc, purchase) => {
          if (purchase.status === "Pagado" || purchase.status === "Cancelado") {
            return acc;
          }
          const remaining =
            purchase.remainingAmount !== undefined
              ? purchase.remainingAmount
              : purchase.totalAmount;
          return acc + remaining;
        }, 0);

        return {
          ...supplier,
          metrics: {
            totalPurchases,
            totalPayments,
            outstandingBalance,
          },
        };
      })
    );
  },
});

/**
 * Obtiene un proveedor por su ID.
 */
export const getById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

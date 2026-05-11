import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { supplierTransactionFields } from "./schema";

/**
 * Registra un pago o abono a un proveedor.
 */
export const registerPayment = mutation({
  args: {
    supplierId: v.id("suppliers"),
    date: v.string(),
    amount: v.number(),
    description: v.string(),
    paymentMethod: v.union(
      v.literal("Efectivo"),
      v.literal("Transferencia"),
      v.literal("Cheque"),
      v.literal("Nota de Crédito")
    ),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado");

    const previousBalance = supplier.currentBalance || 0;
    const newBalance = previousBalance - args.amount;

    // 1. Insertar la transacción de tipo "Abono"
    const transactionId = await ctx.db.insert("supplierTransactions", {
      supplierId: args.supplierId,
      date: args.date,
      type: "Abono",
      amount: args.amount,
      balanceAfter: newBalance,
      status: "Confirmado",
      category: "Pago",
      description: args.description,
      paymentMethod: args.paymentMethod,
    });

    // 2. Actualizar el saldo del proveedor
    await ctx.db.patch(args.supplierId, {
      currentBalance: newBalance,
    });

    return transactionId;
  },
});

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission, isAdmin, requireIdentity, requirePermission } from "../common/utils";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

async function recomputeSupplierBalance(ctx: MutationCtx, supplierId: Id<"suppliers">) {
  const transactions = await ctx.db
    .query("supplierTransactions")
    .withIndex("by_supplierId", (q) => q.eq("supplierId", supplierId))
    .collect();

  const sorted = [...transactions].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a._creationTime - b._creationTime;
  });

  let running = 0;
  for (const tx of sorted) {
    running += tx.type === "Cargo" ? tx.amount : -tx.amount;
    if (tx.balanceAfter !== running) {
      await ctx.db.patch(tx._id, { balanceAfter: running });
    }
  }

  await ctx.db.patch(supplierId, { currentBalance: running });
  return running;
}

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
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "collections:allow_pending_invoice_payment",
      "Acceso denegado: no puedes registrar pagos de facturas/deudas pendientes."
    );

    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const allowCheckTransfer = await hasPermission(ctx, "collections:allow_check_transfer_payment");
      if (!allowCheckTransfer && (args.paymentMethod === "Transferencia" || args.paymentMethod === "Cheque")) {
        throw new Error("Acceso denegado: no puedes registrar pagos con cheque/transferencia.");
      }

      const restrictPaymentDateEdit = await hasPermission(ctx, "collections:restrict_payment_date_edit");
      const today = new Date().toISOString().split("T")[0];
      if (restrictPaymentDateEdit && args.date !== today) {
        throw new Error("Acceso denegado: no puedes editar la fecha de pago.");
      }
    }

    if (args.amount <= 0) {
      throw new Error("El monto del abono debe ser mayor a cero");
    }

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado");

    const previousBalance = supplier.currentBalance || 0;
    if (args.amount > previousBalance) {
      throw new Error("El abono no puede exceder el saldo actual del proveedor");
    }
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

    // 2. Recalcular saldo consolidado del proveedor
    await recomputeSupplierBalance(ctx, args.supplierId);

    return transactionId;
  },
});

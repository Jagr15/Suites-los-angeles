import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { purchaseFields } from "./schema";

/**
 * Registra una nueva compra.
 */
export const create = mutation({
  args: {
    ...purchaseFields,
    items: v.optional(v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitCost: v.number(),
      totalCost: v.number(),
    })))
  },
  handler: async (ctx, { items, ...args }) => {
    // 1. Obtener información del proveedor para calcular el vencimiento
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado");

    // Calcular fecha de vencimiento (dueDate) basado en creditDays
    const purchaseDate = new Date(args.date);
    const dueDate = new Date(purchaseDate);
    dueDate.setDate(dueDate.getDate() + (supplier.creditDays || 0));

    const isPaid = args.status === "Pagado";
    const isCancelled = args.status === "Cancelado";

    // 2. Insertar la compra con los nuevos campos
    const purchaseId = await ctx.db.insert("purchases", {
      ...args,
      dueDate: dueDate.toISOString(),
      remainingAmount: isPaid ? 0 : (isCancelled ? 0 : args.totalAmount),
    });
    
    // Si la compra está cancelada, no afectamos saldos ni inventarios de esta forma
    if (isCancelled) return purchaseId;

    // 3. Registrar el "Cargo" en el Estado de Cuenta (supplierTransactions)
    const previousBalance = supplier.currentBalance || 0;
    const balanceAfterCargo = previousBalance + args.totalAmount;

    await ctx.db.insert("supplierTransactions", {
      supplierId: args.supplierId,
      date: args.date,
      type: "Cargo",
      amount: args.totalAmount,
      balanceAfter: balanceAfterCargo,
      status: args.status, // Usar el estado de la compra (Pendiente, Pagado, etc)
      category: "Compra",
      description: `Compra Folio: ${args.folio}`,
      referenceId: purchaseId,
    });

    // 4. Si ya está pagada, registrar el "Abono" inmediatamente
    let finalBalance = balanceAfterCargo;
    if (isPaid) {
      finalBalance = balanceAfterCargo - args.totalAmount;
      await ctx.db.insert("supplierTransactions", {
        supplierId: args.supplierId,
        date: args.date,
        type: "Abono",
        amount: args.totalAmount,
        balanceAfter: finalBalance,
        status: "Pagado",
        category: "Pago",
        description: `Pago automático (Compra de contado) Folio: ${args.folio}`,
        referenceId: purchaseId,
        paymentMethod: "Efectivo", 
      });
    }

    // 5. Actualizar el saldo actual del proveedor
    await ctx.db.patch(args.supplierId, {
      currentBalance: finalBalance,
    });

    if (items) {
      for (const item of items) {
        // Asegurarnos de que el item tenga solo lo que el schema espera
        const { productId, quantity, unitCost, totalCost } = item;
        
        await ctx.db.insert("purchase_items", {
          productId,
          quantity,
          unitCost,
          totalCost,
          purchaseId,
        });

        // 5. Actualizar stock del producto EN LA BODEGA ESPECÍFICA y crear log de auditoría
        const existingInventory = await ctx.db
          .query("inventory")
          .withIndex("by_product_bodega", (q) => 
            q.eq("productId", productId).eq("bodegaId", args.bodegaId)
          )
          .first();

        const previousStock = existingInventory?.quantity || 0;
        const newStock = previousStock + quantity;

        if (existingInventory) {
          await ctx.db.patch(existingInventory._id, {
            quantity: newStock,
          });
        } else {
          await ctx.db.insert("inventory", {
            productId,
            bodegaId: args.bodegaId,
            quantity: newStock,
          });
        }

        // Actualizar stock global en la tabla de productos
        const product = await ctx.db.get(productId);
        if (product) {
          const globalPreviousStock = product.stock || 0;
          await ctx.db.patch(productId, {
            stock: globalPreviousStock + quantity,
          });
        }

        // 6. Crear log de inventario
        await ctx.db.insert("inventoryLogs", {
          productId: item.productId,
          bodegaId: args.bodegaId,
          type: "entrada",
          previousStock,
          quantity: item.quantity,
          newStock,
          reason: `Compra Folio: ${args.folio}`,
          referenceId: purchaseId,
          date: new Date().toISOString(),
        });
      }
    }
    return purchaseId;
  },
});

/**
 * Actualiza una compra existente.
 */
export const update = mutation({
  args: {
    id: v.id("purchases"),
    ...purchaseFields,
    items: v.optional(v.array(v.any())),
  },
  handler: async (ctx, { id, items, ...fields }) => {
    // 1. Actualizar campos principales de la compra
    await ctx.db.patch(id, fields);

    // 2. Si se enviaron items, actualizarlos (reemplazo simple)
    if (items) {
      // Obtener items viejos
      const oldItems = await ctx.db
        .query("purchase_items")
        .withIndex("by_purchaseId", (q) => q.eq("purchaseId", id))
        .collect();

      // Eliminar items viejos
      for (const item of oldItems) {
        await ctx.db.delete(item._id);
      }

      // Insertar items nuevos
      for (const item of items) {
        // Asegurarnos de que el item tenga solo lo que el schema espera
        const { productId, quantity, unitCost, totalCost } = item;
        await ctx.db.insert("purchase_items", {
          productId,
          quantity,
          unitCost,
          totalCost,
          purchaseId: id,
        });
      }
    }
    
    return id;
  },
});

/**
 * Elimina una compra.
 */
export const remove = mutation({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
export const updateReceptionStatus = mutation({
  args: {
    id: v.id("purchases"),
    receptionStatus: v.union(v.literal("Completa"), v.literal("Faltante"), v.literal("Pendiente")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { receptionStatus: args.receptionStatus });
    return args.id;
  },
});

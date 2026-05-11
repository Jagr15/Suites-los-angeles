import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { purchaseFields } from "./schema";
import { requireIdentity } from "../common/utils";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type PurchaseItemInput = {
  productId: Id<"products">;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

function toDueDate(date: string, creditDays: number) {
  const purchaseDate = new Date(date);
  const dueDate = new Date(purchaseDate);
  dueDate.setDate(dueDate.getDate() + (creditDays || 0));
  return dueDate.toISOString();
}

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

async function deletePurchaseTransactions(ctx: MutationCtx, purchaseId: Id<"purchases">) {
  const txs = await ctx.db
    .query("supplierTransactions")
    .withIndex("by_reference", (q) => q.eq("referenceId", purchaseId as unknown as string))
    .collect();

  for (const tx of txs) {
    await ctx.db.delete(tx._id);
  }
}

async function upsertPurchaseTransactions(
  ctx: MutationCtx,
  args: {
    supplierId: Id<"suppliers">;
    date: string;
    folio: string;
    totalAmount: number;
    status: "Pendiente" | "Pagado" | "Cancelado" | "Vencido";
    purchaseId: Id<"purchases">;
  }
) {
  if (args.status === "Cancelado") return;

  await ctx.db.insert("supplierTransactions", {
    supplierId: args.supplierId,
    date: args.date,
    type: "Cargo",
    amount: args.totalAmount,
    balanceAfter: 0,
    status: args.status,
    category: "Compra",
    description: `Compra Folio: ${args.folio}`,
    referenceId: args.purchaseId,
  });

  if (args.status === "Pagado") {
    await ctx.db.insert("supplierTransactions", {
      supplierId: args.supplierId,
      date: args.date,
      type: "Abono",
      amount: args.totalAmount,
      balanceAfter: 0,
      status: "Pagado",
      category: "Pago",
      description: `Pago automático (Compra de contado) Folio: ${args.folio}`,
      referenceId: args.purchaseId,
      paymentMethod: "Efectivo",
    });
  }
}

async function applyInventoryDelta(
  ctx: MutationCtx,
  args: {
    bodegaId: Id<"bodegas">;
    items: PurchaseItemInput[];
    multiplier: 1 | -1;
    folio: string;
    purchaseId: Id<"purchases">;
  }
) {
  const type = args.multiplier === 1 ? "entrada" : "ajuste";
  const directionLabel = args.multiplier === 1 ? "Entrada por compra" : "Reversa por compra";

  for (const item of args.items) {
    const delta = item.quantity * args.multiplier;
    const existingInventory = await ctx.db
      .query("inventory")
      .withIndex("by_product_bodega", (q) =>
        q.eq("productId", item.productId).eq("bodegaId", args.bodegaId)
      )
      .unique();

    const previousStock = existingInventory?.quantity || 0;
    const newStock = previousStock + delta;
    if (newStock < 0) {
      throw new Error(
        `Stock negativo detectado al reconciliar compra ${args.folio} para producto ${item.productId}`
      );
    }

    if (existingInventory) {
      await ctx.db.patch(existingInventory._id, { quantity: newStock });
    } else {
      await ctx.db.insert("inventory", {
        productId: item.productId,
        bodegaId: args.bodegaId,
        quantity: newStock,
      });
    }

    const product = await ctx.db.get(item.productId);
    if (product) {
      const prevGlobal = product.stock || 0;
      const newGlobal = prevGlobal + delta;
      if (newGlobal < 0) {
        throw new Error(`Stock global negativo detectado para producto ${item.productId}`);
      }
      await ctx.db.patch(item.productId, { stock: newGlobal });
    }

    await ctx.db.insert("inventoryLogs", {
      productId: item.productId,
      bodegaId: args.bodegaId,
      type,
      previousStock,
      quantity: delta,
      newStock,
      reason: `${directionLabel} Folio: ${args.folio}`,
      referenceId: args.purchaseId,
      date: new Date().toISOString(),
    });
  }
}

async function replacePurchaseItems(
  ctx: MutationCtx,
  purchaseId: Id<"purchases">,
  items: PurchaseItemInput[]
) {
  const oldItems = await ctx.db
    .query("purchase_items")
    .withIndex("by_purchaseId", (q) => q.eq("purchaseId", purchaseId))
    .collect();

  for (const oldItem of oldItems) {
    await ctx.db.delete(oldItem._id);
  }

  for (const item of items) {
    await ctx.db.insert("purchase_items", {
      purchaseId,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
    });
  }
}

/**
 * Registra una nueva compra.
 */
export const create = mutation({
  args: {
    ...purchaseFields,
    items: v.optional(
      v.array(
        v.object({
          productId: v.id("products"),
          quantity: v.number(),
          unitCost: v.number(),
          totalCost: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, { items = [], ...args }) => {
    await requireIdentity(ctx);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado");

    const dueDate = toDueDate(args.date, supplier.creditDays || 0);
    const isPaid = args.status === "Pagado";
    const isCancelled = args.status === "Cancelado";

    const purchaseId = await ctx.db.insert("purchases", {
      ...args,
      dueDate,
      remainingAmount: isPaid || isCancelled ? 0 : args.totalAmount,
    });

    await replacePurchaseItems(ctx, purchaseId, items);

    if (items.length > 0 && !isCancelled) {
      await applyInventoryDelta(ctx, {
        bodegaId: args.bodegaId,
        items,
        multiplier: 1,
        folio: args.folio,
        purchaseId,
      });
    }

    await upsertPurchaseTransactions(ctx, {
      supplierId: args.supplierId,
      date: args.date,
      folio: args.folio,
      totalAmount: args.totalAmount,
      status: args.status,
      purchaseId,
    });
    await recomputeSupplierBalance(ctx, args.supplierId);

    return purchaseId;
  },
});

/**
 * Actualiza una compra existente reconciliando inventario y estado de cuenta.
 */
export const update = mutation({
  args: {
    id: v.id("purchases"),
    ...purchaseFields,
    items: v.optional(
      v.array(
        v.object({
          productId: v.id("products"),
          quantity: v.number(),
          unitCost: v.number(),
          totalCost: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, { id, items, ...fields }) => {
    await requireIdentity(ctx);

    const existingPurchase = await ctx.db.get(id);
    if (!existingPurchase) {
      throw new Error("Compra no encontrada");
    }

    const existingItems = await ctx.db
      .query("purchase_items")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", id))
      .collect();
    const oldItems: PurchaseItemInput[] = existingItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
    }));

    const supplier = await ctx.db.get(fields.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado");
    const dueDate = toDueDate(fields.date, supplier.creditDays || 0);

    const nextItems = items ?? oldItems;

    // Revertir impacto anterior
    if (oldItems.length > 0 && existingPurchase.status !== "Cancelado") {
      await applyInventoryDelta(ctx, {
        bodegaId: existingPurchase.bodegaId,
        items: oldItems,
        multiplier: -1,
        folio: existingPurchase.folio,
        purchaseId: id,
      });
    }

    // Aplicar nuevo impacto
    if (nextItems.length > 0 && fields.status !== "Cancelado") {
      await applyInventoryDelta(ctx, {
        bodegaId: fields.bodegaId,
        items: nextItems,
        multiplier: 1,
        folio: fields.folio,
        purchaseId: id,
      });
    }

    await replacePurchaseItems(ctx, id, nextItems);

    await ctx.db.patch(id, {
      ...fields,
      dueDate,
      remainingAmount: fields.status === "Pagado" || fields.status === "Cancelado" ? 0 : fields.totalAmount,
    });

    await deletePurchaseTransactions(ctx, id);
    await upsertPurchaseTransactions(ctx, {
      supplierId: fields.supplierId,
      date: fields.date,
      folio: fields.folio,
      totalAmount: fields.totalAmount,
      status: fields.status,
      purchaseId: id,
    });

    await recomputeSupplierBalance(ctx, existingPurchase.supplierId);
    if (fields.supplierId !== existingPurchase.supplierId) {
      await recomputeSupplierBalance(ctx, fields.supplierId);
    }

    return id;
  },
});

/**
 * Elimina una compra revirtiendo inventario, items y estado de cuenta.
 */
export const remove = mutation({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const purchase = await ctx.db.get(args.id);
    if (!purchase) return;

    const items = await ctx.db
      .query("purchase_items")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", args.id))
      .collect();

    const normalizedItems: PurchaseItemInput[] = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
    }));

    if (normalizedItems.length > 0 && purchase.status !== "Cancelado") {
      await applyInventoryDelta(ctx, {
        bodegaId: purchase.bodegaId,
        items: normalizedItems,
        multiplier: -1,
        folio: purchase.folio,
        purchaseId: purchase._id,
      });
    }

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await deletePurchaseTransactions(ctx, args.id);
    await ctx.db.delete(args.id);
    await recomputeSupplierBalance(ctx, purchase.supplierId);
  },
});

export const updateReceptionStatus = mutation({
  args: {
    id: v.id("purchases"),
    receptionStatus: v.union(v.literal("Completa"), v.literal("Faltante"), v.literal("Pendiente")),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await ctx.db.patch(args.id, { receptionStatus: args.receptionStatus });
    return args.id;
  },
});

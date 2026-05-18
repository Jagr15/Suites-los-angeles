import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { purchaseFields } from "./schema";
import { hasPermission, isAdmin, requireIdentity, requirePermission } from "../common/utils";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type PurchaseItemInput = {
  productId: Id<"products">;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

type PurchaseStatus = "Pendiente" | "Pagado" | "Cancelado" | "Vencido";
type ReceptionStatus = "Completa" | "Faltante" | "Pendiente";

function shouldApplyStock(status: PurchaseStatus, receptionStatus: ReceptionStatus) {
  return status !== "Cancelado" && receptionStatus === "Completa";
}

async function getNextPurchaseFolio(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("sequences")
    .withIndex("by_key", (q) => q.eq("key", "purchase_folio"))
    .unique();

  if (existing) {
    const next = existing.value + 1;
    await ctx.db.patch(existing._id, { value: next });
    return {
      folioNumber: next,
      folio: `C-${String(next).padStart(5, "0")}`,
    };
  }

  const purchases = await ctx.db.query("purchases").collect();
  let maxLegacy = 0;
  for (const purchase of purchases) {
    const candidates = [
      purchase.folioNumber,
      Number((purchase.folio || "").match(/^C-(\d+)$/i)?.[1] || 0),
      Number((purchase.folio || "").match(/(\d+)$/)?.[1] || 0),
    ];
    for (const n of candidates) {
      if (Number.isFinite(n) && (n || 0) > maxLegacy) {
        maxLegacy = n || 0;
      }
    }
  }
  const next = maxLegacy + 1;
  await ctx.db.insert("sequences", { key: "purchase_folio", value: next });
  return {
    folioNumber: next,
    folio: `C-${String(next).padStart(5, "0")}`,
  };
}

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
    supplierId: purchaseFields.supplierId,
    bodegaId: purchaseFields.bodegaId,
    date: purchaseFields.date,
    totalAmount: purchaseFields.totalAmount,
    status: purchaseFields.status,
    receptionStatus: purchaseFields.receptionStatus,
    notes: purchaseFields.notes,
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
    await requirePermission(
      ctx,
      "purchases:allow_create_entries",
      "Acceso denegado: no puedes registrar entradas de compra."
    );

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado");

    const generatedFolio = await getNextPurchaseFolio(ctx);
    const dueDate = toDueDate(args.date, supplier.creditDays || 0);
    const isPaid = args.status === "Pagado";
    const isCancelled = args.status === "Cancelado";
    const stockApplied = shouldApplyStock(args.status, args.receptionStatus);

    const purchaseId = await ctx.db.insert("purchases", {
      ...args,
      folio: generatedFolio.folio,
      folioNumber: generatedFolio.folioNumber,
      dueDate,
      remainingAmount: isPaid || isCancelled ? 0 : args.totalAmount,
      stockApplied,
    });

    await replacePurchaseItems(ctx, purchaseId, items);

    if (items.length > 0 && stockApplied) {
      await applyInventoryDelta(ctx, {
        bodegaId: args.bodegaId,
        items,
        multiplier: 1,
        folio: generatedFolio.folio,
        purchaseId,
      });
    }

    await upsertPurchaseTransactions(ctx, {
      supplierId: args.supplierId,
      date: args.date,
      folio: generatedFolio.folio,
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
    supplierId: purchaseFields.supplierId,
    bodegaId: purchaseFields.bodegaId,
    date: purchaseFields.date,
    totalAmount: purchaseFields.totalAmount,
    status: purchaseFields.status,
    receptionStatus: purchaseFields.receptionStatus,
    notes: purchaseFields.notes,
    folio: v.optional(v.string()),
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
  handler: async (ctx, { id, items, folio: _ignoredFolio, ...fields }) => {
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
    const oldApplied = existingPurchase.stockApplied ?? shouldApplyStock(existingPurchase.status, existingPurchase.receptionStatus);
    const nextApplied = shouldApplyStock(fields.status, fields.receptionStatus);
    const paymentStatusChanged = existingPurchase.status !== fields.status;
    const receptionStatusChanged = existingPurchase.receptionStatus !== fields.receptionStatus;
    const dateChanged = existingPurchase.date !== fields.date;
    const supplierChanged = existingPurchase.supplierId !== fields.supplierId;
    const bodegaChanged = existingPurchase.bodegaId !== fields.bodegaId;
    const notesChanged = (existingPurchase.notes || "") !== (fields.notes || "");
    const totalChanged = existingPurchase.totalAmount !== fields.totalAmount;
    const itemsChanged = JSON.stringify(oldItems) !== JSON.stringify(nextItems);

    if (existingPurchase.receptionStatus === "Completa") {
      const hasEditRestriction = await hasPermission(ctx, "purchases:restrict_edit_registered_entries");
      if (
        hasEditRestriction &&
        (paymentStatusChanged ||
          receptionStatusChanged ||
          dateChanged ||
          supplierChanged ||
          bodegaChanged ||
          notesChanged ||
          totalChanged ||
          itemsChanged)
      ) {
        throw new Error("Acceso denegado: esta entrada registrada no permite edición.");
      }
    }

    if (paymentStatusChanged) {
      await requirePermission(
        ctx,
        "purchases:edit_payment_status",
        "Acceso denegado: no puedes editar el estado de pago."
      );
    }
    if (receptionStatusChanged) {
      await requirePermission(
        ctx,
        "purchases:edit_reception_status",
        "Acceso denegado: no puedes editar el estado de entrega."
      );
    }
    if (dateChanged) {
      await requirePermission(
        ctx,
        "purchases:edit_date",
        "Acceso denegado: no puedes editar la fecha de compra/entrada."
      );
    }

    // Reconciliación idempotente de stock: solo tocamos inventario cuando corresponde
    if (oldApplied && nextApplied) {
      if (oldItems.length > 0) {
        await applyInventoryDelta(ctx, {
          bodegaId: existingPurchase.bodegaId,
          items: oldItems,
          multiplier: -1,
          folio: existingPurchase.folio,
          purchaseId: id,
        });
      }
      if (nextItems.length > 0) {
        await applyInventoryDelta(ctx, {
          bodegaId: fields.bodegaId,
          items: nextItems,
          multiplier: 1,
          folio: existingPurchase.folio,
          purchaseId: id,
        });
      }
    } else if (oldApplied && !nextApplied) {
      if (oldItems.length > 0) {
        await applyInventoryDelta(ctx, {
          bodegaId: existingPurchase.bodegaId,
          items: oldItems,
          multiplier: -1,
          folio: existingPurchase.folio,
          purchaseId: id,
        });
      }
    } else if (!oldApplied && nextApplied) {
      if (nextItems.length > 0) {
        await applyInventoryDelta(ctx, {
          bodegaId: fields.bodegaId,
          items: nextItems,
          multiplier: 1,
          folio: existingPurchase.folio,
          purchaseId: id,
        });
      }
    }

    await replacePurchaseItems(ctx, id, nextItems);

    await ctx.db.patch(id, {
      ...fields,
      folio: existingPurchase.folio,
      folioNumber: existingPurchase.folioNumber,
      dueDate,
      remainingAmount: fields.status === "Pagado" || fields.status === "Cancelado" ? 0 : fields.totalAmount,
      stockApplied: nextApplied,
    });

    await deletePurchaseTransactions(ctx, id);
    await upsertPurchaseTransactions(ctx, {
      supplierId: fields.supplierId,
      date: fields.date,
      folio: existingPurchase.folio,
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
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const hasDeleteRestriction = await hasPermission(ctx, "records:restrict_delete");
      if (hasDeleteRestriction) {
        throw new Error("Acceso denegado: tu rol no permite eliminar registros.");
      }
    }

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

    const stockApplied = purchase.stockApplied ?? shouldApplyStock(purchase.status, purchase.receptionStatus);
    if (normalizedItems.length > 0 && stockApplied) {
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
    const purchase = await ctx.db.get(args.id);
    if (!purchase) throw new Error("Compra no encontrada");

    if (purchase.receptionStatus !== args.receptionStatus) {
      await requirePermission(
        ctx,
        "purchases:edit_reception_status",
        "Acceso denegado: no puedes editar el estado de entrega."
      );
    }

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

    const oldApplied = purchase.stockApplied ?? shouldApplyStock(purchase.status, purchase.receptionStatus);
    const nextApplied = shouldApplyStock(purchase.status, args.receptionStatus);

    if (oldApplied && !nextApplied && normalizedItems.length > 0) {
      await applyInventoryDelta(ctx, {
        bodegaId: purchase.bodegaId,
        items: normalizedItems,
        multiplier: -1,
        folio: purchase.folio,
        purchaseId: purchase._id,
      });
    } else if (!oldApplied && nextApplied && normalizedItems.length > 0) {
      await applyInventoryDelta(ctx, {
        bodegaId: purchase.bodegaId,
        items: normalizedItems,
        multiplier: 1,
        folio: purchase.folio,
        purchaseId: purchase._id,
      });
    }

    await ctx.db.patch(args.id, {
      receptionStatus: args.receptionStatus,
      stockApplied: nextApplied,
    });
    return args.id;
  },
});

import { query } from "../_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

async function buildProductosForPurchase(ctx: QueryCtx, purchaseId: string, bodegaId: string) {
  try {
    const items = await ctx.db
      .query("purchase_items")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", purchaseId as Doc<"purchase_items">["purchaseId"]))
      .collect();

    const inventoryRows = await ctx.db
      .query("inventory")
      .withIndex("by_bodega", (q) => q.eq("bodegaId", bodegaId as Doc<"inventory">["bodegaId"]))
      .collect();
    const inventoryByProduct = new Map<string, number>(inventoryRows.map((row) => [String(row.productId), row.quantity]));

    return await Promise.all(
      items.map(async (item) => {
        const product = item.productId ? await ctx.db.get(item.productId) : null;
        const stock = inventoryByProduct.get(String(item.productId)) ?? 0;
        const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;
        const etiqueta = stock <= 0 ? "Rojo" : stock <= 30 ? "Amarillo" : "Verde";
        return {
          ...item,
          rowId: String(item._id),
          id: String(item.productId || ""),
          name: product?.producto || "Producto desconocido",
          sku: product?.sku || "",
          descripcion: product?.producto || "Producto desconocido",
          category: product?.categoria || "",
          subcategory: product?.subcategoria || "",
          stock,
          quantity,
          critico: 10,
          bajo: 30,
          optimo: 50,
          etiqueta,
        };
      })
    );
  } catch (error) {
    console.error("purchases.buildProductosForPurchase failed", {
      purchaseId,
      bodegaId,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

async function loadSupplierLookup(ctx: QueryCtx, purchases: Array<Doc<"purchases">>) {
  const supplierIds = Array.from(
    new Set(
      purchases
        .map((purchase) => purchase.supplierId)
        .filter(Boolean)
        .map((id) => String(id))
    )
  );
  const suppliers = await Promise.all(
    supplierIds.map(async (id) => {
      try {
        return await ctx.db.get(id as Id<"suppliers">);
      } catch {
        return null;
      }
    })
  );

  const supplierById = new Map<string, NonNullable<Doc<"suppliers">>>();
  for (const supplier of suppliers) {
    if (supplier) {
      supplierById.set(String(supplier._id), supplier);
    }
  }
  return supplierById;
}

/**
 * Lista todas las compras con información del proveedor.
 */
export const list = query({
  args: { bodegaId: v.optional(v.id("bodegas")) },
  handler: async (ctx, args) => {
    try {
      const purchases = args.bodegaId
        ? await ctx.db
            .query("purchases")
            .withIndex("by_bodegaId", (q) => q.eq("bodegaId", args.bodegaId!))
            .order("desc")
            .collect()
        : await ctx.db.query("purchases").order("desc").collect();
      return Promise.all(
        purchases.map(async (purchase) => {
          const [supplier, bodega] = await Promise.all([
            ctx.db.get(purchase.supplierId),
            ctx.db.get(purchase.bodegaId),
          ]);

          const items = await ctx.db
            .query("purchase_items")
            .withIndex("by_purchaseId", (q) => q.eq("purchaseId", purchase._id))
            .collect();

          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const product = item.productId ? await ctx.db.get(item.productId) : null;
              return {
                ...item,
                rowId: String(item._id),
                name: product?.producto || "Producto desconocido",
                sku: product?.sku || "",
                category: product?.categoria || "",
              };
            })
          );
          const productos = await buildProductosForPurchase(ctx, String(purchase._id), String(purchase.bodegaId));

          return {
            ...purchase,
            supplierName: supplier?.businessName || "Proveedor desconocido",
            bodegaName: bodega?.name || "Bodega desconocida",
            items: itemsWithDetails || [],
            productos,
          };
        })
      );
    } catch (error) {
      console.error("purchases.list failed", {
        bodegaId: args.bodegaId ? String(args.bodegaId) : null,
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

export const listRecent = query({
  args: {
    bodegaId: v.optional(v.id("bodegas")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = Math.max(1, Math.min(args.limit ?? 6, 25));
      const purchases = args.bodegaId
        ? await ctx.db
            .query("purchases")
            .withIndex("by_bodegaId_date", (q) => q.eq("bodegaId", args.bodegaId!))
            .order("desc")
            .take(limit)
        : await ctx.db.query("purchases").withIndex("by_date", (q) => q.gte("date", "")).order("desc").take(limit);

      const supplierById = await loadSupplierLookup(ctx, purchases);

      return purchases.map((purchase) => {
        const supplier = purchase.supplierId ? supplierById.get(String(purchase.supplierId)) : null;
        return {
          ...purchase,
          totalAmount: Number.isFinite(Number(purchase.totalAmount)) ? Number(purchase.totalAmount) : 0,
          date: String(purchase.date || ""),
          supplierName: supplier?.businessName || "Proveedor desconocido",
        };
      });
    } catch (error) {
      console.error("purchases.listRecent failed", {
        bodegaId: args.bodegaId ? String(args.bodegaId) : null,
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

/**
 * Obtiene una compra por ID.
 */
export const getById = query({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.id);
    if (!purchase) return null;
    
    const [supplier, bodega] = await Promise.all([
      ctx.db.get(purchase.supplierId),
      ctx.db.get(purchase.bodegaId),
    ]);

    const items = await ctx.db
      .query("purchase_items")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", purchase._id))
      .collect();

    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const product = item.productId ? await ctx.db.get(item.productId) : null;
        return {
          ...item,
          rowId: String(item._id),
          name: product?.producto || "Producto desconocido",
          sku: product?.sku || "",
          category: product?.categoria || "",
        };
      })
    );
    const productos = await buildProductosForPurchase(ctx, String(purchase._id), String(purchase.bodegaId));

    return {
      ...purchase,
      supplierName: supplier?.businessName || "Proveedor desconocido",
      bodegaName: bodega?.name || "Bodega desconocida",
      items: itemsWithDetails,
      productos,
    };
  },
});

/**
 * Lista las compras de un proveedor específico.
 */
export const listBySupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    try {
      const purchases = await ctx.db
        .query("purchases")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
        .order("desc")
        .collect();

      return Promise.all(
        purchases.map(async (purchase) => {
          const bodega = await ctx.db.get(purchase.bodegaId);
          return {
            ...purchase,
            bodegaName: bodega?.name || "Bodega desconocida",
          };
        })
      );
    } catch (error) {
      console.error("purchases.listBySupplier failed", {
        supplierId: String(args.supplierId),
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

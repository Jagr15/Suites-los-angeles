import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Lista todas las compras con información del proveedor.
 */
export const list = query({
  args: { bodegaId: v.optional(v.id("bodegas")) },
  handler: async (ctx, args) => {
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

        // Fetch items for this purchase
        const items = await ctx.db
          .query("purchase_items")
          .withIndex("by_purchaseId", (q) => q.eq("purchaseId", purchase._id))
          .collect();

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const product = item.productId ? await ctx.db.get(item.productId) : null;
            return {
              ...item,
              rowId: String(item._id), // Stable string ID
              name: product?.producto || "Producto desconocido",
              sku: product?.sku || "",
              category: product?.categoria || "",
            };
          })
        );

        return {
          ...purchase,
          supplierName: supplier?.businessName || "Proveedor desconocido",
          bodegaName: bodega?.name || "Bodega desconocida",
          items: itemsWithDetails || [],
        };
      })
    );
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

    return {
      ...purchase,
      supplierName: supplier?.businessName || "Proveedor desconocido",
      bodegaName: bodega?.name || "Bodega desconocida",
      items: itemsWithDetails,
    };
  },
});

/**
 * Lista las compras de un proveedor específico.
 */
export const listBySupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
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
  },
});

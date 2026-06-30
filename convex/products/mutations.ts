import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { productFields } from "./schema";
import { requireIdentity, requirePermission } from "../common/utils";

const PRICE_FIELDS = [
  "lista1","lista2","lista3","lista4","lista5","lista6","lista7","lista8","lista9","lista10","lista11","lista12","lista13","lista14","lista15",
] as const;

export const create = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    sku: v.optional(v.string()),
    codigo: v.optional(v.string()),
    producto: v.optional(v.string()),
    cantidadEmpaque: v.optional(v.string()),
    categoria: v.optional(v.string()),
    subcategoria: v.optional(v.string()),
    status: v.optional(v.union(v.literal("Activo"), v.literal("Inactivo"))),
    lista1: v.optional(v.string()),
    lista2: v.optional(v.string()),
    lista3: v.optional(v.string()),
    lista4: v.optional(v.string()),
    lista5: v.optional(v.string()),
    lista6: v.optional(v.string()),
    lista7: v.optional(v.string()),
    lista8: v.optional(v.string()),
    lista9: v.optional(v.string()),
    lista10: v.optional(v.string()),
    lista11: v.optional(v.string()),
    lista12: v.optional(v.string()),
    lista13: v.optional(v.string()),
    lista14: v.optional(v.string()),
    lista15: v.optional(v.string()),
    stock: v.optional(v.number()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Producto no encontrado");

    const existingPriceMap = existing as Record<string, unknown>;
    const priceChanged = PRICE_FIELDS.some((field) => {
      if (fields[field] === undefined) return false;
      return existingPriceMap[field] !== fields[field];
    });
    if (priceChanged) {
      await requirePermission(
        ctx,
        "sales:allow_price_edit",
        "Acceso denegado: no puedes editar precios."
      );
    }

    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    // 1. Check if referenced in historical sales (salidas)
    const allSalidas = await ctx.db.query("salidas").collect();
    const hasSalidaRef = allSalidas.some((s) => 
      (s.items || []).some((item) => String(item.productId) === String(args.id))
    );
    if (hasSalidaRef) {
      throw new Error("No se puede eliminar el producto porque tiene ventas históricas asociadas.");
    }

    // 2. Check if has active inventory stock > 0 in any bodega
    const inventoryEntries = await ctx.db
      .query("inventory")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();
    const hasInventory = inventoryEntries.some((inv) => inv.quantity > 0);
    if (hasInventory) {
      throw new Error("No se puede eliminar el producto porque tiene existencias activas en el inventario.");
    }

    // 3. Check if has historical movement logs
    const logs = await ctx.db
      .query("inventoryLogs")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();
    if (logs.length > 0) {
      throw new Error("No se puede eliminar el producto porque tiene historial de movimientos registrado.");
    }

    // Cleanup associated pricing tiers and zero-stock inventory records
    const pricingTiers = await ctx.db
      .query("pricingProductTiers")
      .withIndex("by_productId", (q) => q.eq("productId", args.id))
      .collect();
    for (const tier of pricingTiers) {
      await ctx.db.delete(tier._id);
    }
    
    for (const inv of inventoryEntries) {
      await ctx.db.delete(inv._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const bulkUpsert = mutation({
  args: {
    items: v.array(v.object(productFields)),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    let created = 0;
    let updated = 0;

    for (const item of args.items) {
      // Usamos el SKU como llave única para identificar productos existentes
      const existing = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", item.sku))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, item);
        updated++;
      } else {
        await ctx.db.insert("products", item);
        created++;
      }
    }
    return { created, updated };
  },
});

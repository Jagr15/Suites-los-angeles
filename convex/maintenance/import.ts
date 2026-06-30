import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const importProducts = mutation({
  args: {
    items: v.array(
      v.object({
        codigo: v.string(),
        descripcion: v.string(),
        costo: v.number(),
        venta: v.number(),
        stock: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let created = 0;
    let updated = 0;

    // 1. Get specific active bodegas dynamically (Principal code 'A' and any QA warehouse)
    const activeBodegas = (await ctx.db.query("bodegas").collect()).filter(
      b => b.isActive && (b.code === "A" || b.name.toUpperCase().includes("QA"))
    );
    
    // Resolve rule version for pricing tiers
    const tiers = await ctx.db.query("pricingProductTiers").collect();
    const maxVersion = tiers.reduce((acc, row) => Math.max(acc, row.ruleVersion || 0), 0);
    const ruleVersion = maxVersion + 1;

    for (const item of args.items) {
      // Find existing product by codigo or sku
      const existing = await ctx.db
        .query("products")
        .withIndex("by_codigo", (q) => q.eq("codigo", item.codigo))
        .first() || await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", item.codigo))
        .first();

      let productId: Id<"products">;
      const productPayload = {
        sku: item.codigo,
        codigo: item.codigo,
        producto: item.descripcion,
        cantidadEmpaque: "1",
        categoria: "",
        subcategoria: "",
        status: "Activo" as const,
        lista1: String(item.costo),
        lista2: String(item.costo),
        lista3: String(item.costo),
        lista4: String(item.costo),
        lista5: String(item.costo),
        lista11: String(item.venta),
        lista12: String(item.venta),
        lista13: String(item.venta),
        lista14: String(item.venta),
        lista15: String(item.venta),
        stock: item.stock,
      };

      if (existing) {
        await ctx.db.patch(existing._id, productPayload);
        productId = existing._id;
        updated++;
      } else {
        productId = await ctx.db.insert("products", productPayload);
        created++;
      }

      // 2. Pricing Tier
      // Find existing pricing product tiers for this product
      const existingTiers = await ctx.db
        .query("pricingProductTiers")
        .withIndex("by_productId", (q) => q.eq("productId", productId))
        .collect();

      const tierPayload = {
        productId,
        minQty: 1, // minQty must be greater than 0
        basePrice: item.venta,
        active: true,
        ruleVersion,
        notes: "Importado desde Excel",
      };

      if (existingTiers.length > 0) {
        // Update first, delete rest
        await ctx.db.patch(existingTiers[0]._id, tierPayload);
        for (let i = 1; i < existingTiers.length; i++) {
          await ctx.db.delete(existingTiers[i]._id);
        }
      } else {
        await ctx.db.insert("pricingProductTiers", tierPayload);
      }

      // 3. Inventory Stock for Active Bodegas
      for (const bodega of activeBodegas) {
        const existingInventory = await ctx.db
          .query("inventory")
          .withIndex("by_product_bodega", (q) =>
            q.eq("productId", productId).eq("bodegaId", bodega._id)
          )
          .unique();

        const previousStock = existingInventory?.quantity || 0;
        const diff = item.stock - previousStock;

        if (existingInventory) {
          await ctx.db.patch(existingInventory._id, {
            quantity: item.stock,
          });
        } else {
          await ctx.db.insert("inventory", {
            bodegaId: bodega._id,
            productId,
            quantity: item.stock,
          });
        }

        // Insert log entry only if there is a difference or it's new
        if (diff !== 0 || !existingInventory) {
          await ctx.db.insert("inventoryLogs", {
            productId,
            bodegaId: bodega._id,
            type: "ajuste",
            previousStock,
            quantity: diff,
            newStock: item.stock,
            reason: "Importación Excel",
            date: new Date().toISOString(),
          });
        }
      }
    }

    return { created, updated };
  },
});

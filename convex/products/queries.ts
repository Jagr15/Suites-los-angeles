import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission, isAdmin } from "../common/utils";
import type { Id } from "../_generated/dataModel";

const COST_FIELDS = ["lista1", "lista2", "lista3", "lista4", "lista5"] as const;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const isAdministrator = await isAdmin(ctx);
    const hideCostAndMargin = !isAdministrator && (await hasPermission(ctx, "products:hide_cost_and_margin"));
    const hideCentralStock = !isAdministrator && !(await hasPermission(ctx, "inventory:allow_view_central_stock"));

    const getNameFromDoc = (doc: unknown): string | null => {
      if (!doc || typeof doc !== "object") return null;
      const maybeName = (doc as { name?: unknown }).name;
      return typeof maybeName === "string" ? maybeName : null;
    };
    
    return await Promise.all(
      products.map(async (p) => {
        let categoriaLabel = p.categoria;
        let subcategoriaLabel = p.subcategoria;

        // Intentar obtener el nombre de la categoría si es un ID válido
        try {
          if (p.categoria && p.categoria.length > 10) {
            const cat = await ctx.db.get(p.categoria as Id<"product_categories">);
            const categoryName = getNameFromDoc(cat);
            if (categoryName) categoriaLabel = categoryName;
          }
        } catch (e) {}

        // Intentar obtener el nombre de la subcategoría si es un ID válido
        try {
          if (p.subcategoria && p.subcategoria.length > 10) {
            const sub = await ctx.db.get(p.subcategoria as Id<"product_subcategories">);
            const subcategoryName = getNameFromDoc(sub);
            if (subcategoryName) subcategoriaLabel = subcategoryName;
          }
        } catch (e) {}

        const normalizedProduct: Record<string, unknown> = {
          ...p,
          categoria: categoriaLabel,
          subcategoria: subcategoriaLabel,
          categoriaId: p.categoria,
          subcategoriaId: p.subcategoria,
        };

        if (hideCostAndMargin) {
          for (const field of COST_FIELDS) delete normalizedProduct[field];
        }
        if (hideCentralStock) {
          delete normalizedProduct.stock;
        }

        return normalizedProduct;
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("products").withIndex("by_sku", q => q.eq("sku", args.sku)).first();
  },
});

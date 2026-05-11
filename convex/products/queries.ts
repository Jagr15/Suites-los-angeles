import { query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();

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
            const cat = await ctx.db.get(p.categoria as any);
            const categoryName = getNameFromDoc(cat);
            if (categoryName) categoriaLabel = categoryName;
          }
        } catch (e) {}

        // Intentar obtener el nombre de la subcategoría si es un ID válido
        try {
          if (p.subcategoria && p.subcategoria.length > 10) {
            const sub = await ctx.db.get(p.subcategoria as any);
            const subcategoryName = getNameFromDoc(sub);
            if (subcategoryName) subcategoriaLabel = subcategoryName;
          }
        } catch (e) {}

        return {
          ...p,
          categoria: categoriaLabel,
          subcategoria: subcategoriaLabel,
          categoriaId: p.categoria,
          subcategoriaId: p.subcategoria,
        };
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

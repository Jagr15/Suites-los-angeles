import { query } from "../_generated/server";
import { v } from "convex/values";

export const listCategories = query({
  args: {
    type: v.union(v.literal("ingreso"), v.literal("egreso")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bodega_categorias")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const listIngresos = query({
  args: {},
  handler: async (ctx) => {
    const ingresos = await ctx.db.query("bodega_ingresos").order("desc").collect();
    return Promise.all(
      ingresos.map(async (ingreso) => {
        const category = await ctx.db.get(ingreso.categoryId);
        const subcategory = ingreso.subcategoryId ? await ctx.db.get(ingreso.subcategoryId) : null;
        return {
          ...ingreso,
          categoryName: category?.name || "S/C",
          subcategoryName: subcategory?.name || "",
        };
      })
    );
  },
});

export const listEgresos = query({
  args: {},
  handler: async (ctx) => {
    const egresos = await ctx.db.query("bodega_egresos").order("desc").collect();
    return Promise.all(
      egresos.map(async (egreso) => {
        const category = await ctx.db.get(egreso.categoryId);
        const subcategory = egreso.subcategoryId ? await ctx.db.get(egreso.subcategoryId) : null;
        return {
          ...egreso,
          categoryName: category?.name || "S/C",
          subcategoryName: subcategory?.name || "",
        };
      })
    );
  },
});


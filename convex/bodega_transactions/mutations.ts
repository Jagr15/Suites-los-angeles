import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { bodegaIngresosFields, bodegaEgresosFields } from "./schema";
import { requireIdentity, requirePermission } from "../common/utils";

export const createCategory = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("ingreso"), v.literal("egreso")),
    parentCategoryId: v.optional(v.id("bodega_categorias")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const categoryId = await ctx.db.insert("bodega_categorias", args);
    return categoryId;
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("bodega_categorias"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const removeCategory = mutation({
  args: {
    id: v.id("bodega_categorias"),
  },
  handler: async (ctx, args) => {
    // En lugar de borrar físicamente, podemos desactivarla para no romper historial
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const createIngreso = mutation({
  args: bodegaIngresosFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "warehouse_money:allow_income",
      "Acceso denegado: no puedes registrar ingresos de bodega."
    );
    return await ctx.db.insert("bodega_ingresos", args);
  },
});

export const createEgreso = mutation({
  args: bodegaEgresosFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "warehouse_money:allow_expense",
      "Acceso denegado: no puedes registrar egresos de bodega."
    );
    return await ctx.db.insert("bodega_egresos", args);
  },
});

export const removeIngreso = mutation({
  args: { id: v.id("bodega_ingresos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeEgreso = mutation({
  args: { id: v.id("bodega_egresos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});


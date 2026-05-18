import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { bodegaIngresosFields, bodegaEgresosFields } from "./schema";
import { hasPermission, isAdmin, requireIdentity, requirePermission } from "../common/utils";

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

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
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const restrictDateEdit = await hasPermission(ctx, "warehouse_money:restrict_date_edit");
      if (restrictDateEdit && args.date !== getTodayISO()) {
        throw new Error("Acceso denegado: no puedes modificar la fecha en ingresos de bodega.");
      }
    }
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
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const restrictDateEdit = await hasPermission(ctx, "warehouse_money:restrict_date_edit");
      if (restrictDateEdit && args.date !== getTodayISO()) {
        throw new Error("Acceso denegado: no puedes modificar la fecha en egresos de bodega.");
      }
      const requireEvidence = await hasPermission(ctx, "evidence:require_photos_for_entries_expenses");
      if (requireEvidence && !args.evidenceStorageId) {
        throw new Error("Acceso denegado: se requiere evidencia fotográfica para registrar egresos.");
      }
    }
    return await ctx.db.insert("bodega_egresos", args);
  },
});

export const removeIngreso = mutation({
  args: { id: v.id("bodega_ingresos") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const hasDeleteRestriction = await hasPermission(ctx, "records:restrict_delete");
      if (hasDeleteRestriction) {
        throw new Error("Acceso denegado: tu rol no permite eliminar registros.");
      }
    }
    await ctx.db.delete(args.id);
  },
});

export const removeEgreso = mutation({
  args: { id: v.id("bodega_egresos") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const hasDeleteRestriction = await hasPermission(ctx, "records:restrict_delete");
      if (hasDeleteRestriction) {
        throw new Error("Acceso denegado: tu rol no permite eliminar registros.");
      }
    }
    await ctx.db.delete(args.id);
  },
});

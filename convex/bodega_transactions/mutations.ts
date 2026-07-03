import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { bodegaIngresosFields, bodegaEgresosFields } from "./schema";
import { hasPermission, isAdmin, requireIdentity, requirePermission, requireWarehouseAccess, resolveCurrentStaffUser } from "../common/utils";
import { ensureWarehouseMovementSequence, getNextWarehouseMovementFolio } from "../common/warehouseFolios";

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

async function applyLinkedBodegaBalance(ctx: any, bodegaId: any, delta: number) {
  if (!bodegaId) return;
  const account = await ctx.db
    .query("finance_accounts")
    .withIndex("by_linked_entity", (q: any) =>
      q.eq("linkedEntityType", "bodega").eq("linkedEntityId", String(bodegaId))
    )
    .first();
  if (!account) return;
  await ctx.db.patch(account._id, {
    currentBalance: (account.currentBalance || 0) + delta,
  });
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
    await requireIdentity(ctx);
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const hasDeleteRestriction = await hasPermission(ctx, "records:restrict_delete");
      if (hasDeleteRestriction) {
        throw new Error("Acceso denegado: tu rol no permite eliminar registros.");
      }
    }
    // En lugar de borrar físicamente, podemos desactivarla para no romper historial
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const createIngreso = mutation({
  args: {
    ...bodegaIngresosFields,
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    operationalDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveCurrentStaffUser(ctx);
    if (!currentUser.user) throw new Error("No autenticado");
    if (!args.bodegaId) throw new Error("Debes seleccionar una bodega para registrar el ingreso.");
    await requireWarehouseAccess(ctx, args.bodegaId);
    const generatedFolio = await getNextWarehouseMovementFolio(ctx, args.bodegaId, "ingreso");
    const responsibleId = args.responsibleId ?? currentUser.user.profileId ?? undefined;
    const responsibleName = args.responsibleName ?? currentUser.user.name ?? currentUser.email ?? "Usuario";
    const categoryName = args.category?.trim();
    const categoryId = categoryName
      ? await ctx.db
          .query("bodega_categorias")
          .withIndex("by_type", (q) => q.eq("type", "ingreso"))
          .filter((q) => q.eq(q.field("name"), categoryName))
          .unique()
          .then((existing) => existing?._id ?? ctx.db.insert("bodega_categorias", { name: categoryName, type: "ingreso", isActive: true }))
      : args.categoryId;
    if (!categoryId) throw new Error("La categoría es obligatoria");
    const id = await ctx.db.insert("bodega_ingresos", {
      bodegaId: args.bodegaId,
      amount: args.amount,
      categoryId,
      subcategoryId: args.subcategoryId,
      date: args.operationalDate?.trim() || args.date,
      responsibleId,
      responsibleName,
      responsibleGroup: args.responsibleGroup,
      clientName: args.clientName,
      evidenceStorageId: args.evidenceStorageId,
      notes: args.notes ?? args.description,
      folio: args.folio || generatedFolio.folio,
      folioNumber: args.folioNumber || generatedFolio.folioNumber,
      status: "pending",
    });
    await applyLinkedBodegaBalance(ctx, args.bodegaId, args.amount);
    return id;
  },
});

export const createEgreso = mutation({
  args: {
    ...bodegaEgresosFields,
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    operationalDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveCurrentStaffUser(ctx);
    if (!currentUser.user) throw new Error("No autenticado");
    if (!args.bodegaId) throw new Error("Debes seleccionar una bodega para registrar el egreso.");
    await requireWarehouseAccess(ctx, args.bodegaId);
    const generatedFolio = await getNextWarehouseMovementFolio(ctx, args.bodegaId, "egreso");
    const responsibleId = args.responsibleId ?? currentUser.user.profileId ?? undefined;
    const responsibleName = args.responsibleName ?? currentUser.user.name ?? currentUser.email ?? "Usuario";
    const categoryName = args.category?.trim();
    const categoryId = categoryName
      ? await ctx.db
          .query("bodega_categorias")
          .withIndex("by_type", (q) => q.eq("type", "egreso"))
          .filter((q) => q.eq(q.field("name"), categoryName))
          .unique()
          .then((existing) => existing?._id ?? ctx.db.insert("bodega_categorias", { name: categoryName, type: "egreso", isActive: true }))
      : args.categoryId;
    if (!categoryId) throw new Error("La categoría es obligatoria");
    const id = await ctx.db.insert("bodega_egresos", {
      bodegaId: args.bodegaId,
      amount: args.amount,
      categoryId,
      subcategoryId: args.subcategoryId,
      date: args.operationalDate?.trim() || args.date,
      responsibleId,
      responsibleName,
      responsibleGroup: args.responsibleGroup,
      provider: args.provider,
      evidenceStorageId: args.evidenceStorageId,
      notes: args.notes ?? args.description,
      folio: args.folio || generatedFolio.folio,
      folioNumber: args.folioNumber || generatedFolio.folioNumber,
      status: "pending",
    });
    await applyLinkedBodegaBalance(ctx, args.bodegaId, -args.amount);
    return id;
  },
});

export const ensureWarehouseMovementSequences = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    if (!(await isAdmin(ctx))) {
      throw new Error("Acceso denegado: Se requieren permisos de administrador");
    }
    const bodegas = await ctx.db.query("bodegas").collect();
    for (const bodega of bodegas) {
      await ensureWarehouseMovementSequence(ctx, bodega._id, "entrada");
      await ensureWarehouseMovementSequence(ctx, bodega._id, "salida");
      await ensureWarehouseMovementSequence(ctx, bodega._id, "ingreso");
      await ensureWarehouseMovementSequence(ctx, bodega._id, "egreso");
    }
    return { ok: true, bodegas: bodegas.length };
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
    const ingreso = await ctx.db.get(args.id);
    if (!ingreso) return;
    await applyLinkedBodegaBalance(ctx, ingreso.bodegaId, -ingreso.amount);
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
    const egreso = await ctx.db.get(args.id);
    if (!egreso) return;
    await applyLinkedBodegaBalance(ctx, egreso.bodegaId, egreso.amount);
    await ctx.db.delete(args.id);
  },
});

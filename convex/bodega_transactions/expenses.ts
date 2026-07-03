import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { resolveCurrentStaffUser, requireWarehouseAccess, isAdmin } from "../common/utils";

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export const listDailyForCurrentUser = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const current = await resolveCurrentStaffUser(ctx);
    if (!current.user) return { items: [], total: 0, count: 0 };
    const targetDate = args.date?.trim() || getTodayISO();
    const bodegaId = current.operationalBodegaId ?? current.assignedBodegaId ?? current.profile?.assignedBodegaId ?? null;
    const rows = bodegaId
      ? await ctx.db.query("bodega_egresos").withIndex("by_bodegaId", (q) => q.eq("bodegaId", bodegaId)).collect()
      : await ctx.db.query("bodega_egresos").collect();
    const filtered = rows.filter((row) => row.date === targetDate && row.status !== "cancelled");
    const items = await Promise.all(filtered.map(async (expense) => {
      const category = await ctx.db.get(expense.categoryId);
      return {
        ...expense,
        categoryName: category?.name ?? "Sin categoría",
        description: expense.notes ?? category?.name ?? "Sin descripción",
      };
    }));
    return { items, total: filtered.reduce((sum, item) => sum + item.amount, 0), count: filtered.length };
  },
});

export const createExpense = mutation({
  args: {
    routeId: v.optional(v.id("routes")),
    userId: v.optional(v.id("users")),
    profileId: v.optional(v.id("profiles")),
    bodegaId: v.optional(v.id("bodegas")),
    category: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    operationalDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const current = await resolveCurrentStaffUser(ctx);
    if (!current.user) throw new Error("No autenticado");
    const resolvedProfileId = args.profileId ?? current.user.profileId ?? undefined;
    const resolvedProfile = resolvedProfileId ? await ctx.db.get(resolvedProfileId) : current.profile;
    const resolvedBodegaId = args.bodegaId ?? resolvedProfile?.assignedBodegaId ?? current.operationalBodegaId ?? undefined;
    if (!resolvedBodegaId) throw new Error("No se encontró una bodega asignada para registrar el gasto");
    await requireWarehouseAccess(ctx, resolvedBodegaId);
    const categoryId = await ctx.db
      .query("bodega_categorias")
      .withIndex("by_type", (q) => q.eq("type", "egreso"))
      .filter((q) => q.eq(q.field("name"), args.category.trim()))
      .unique()
      .then((existing) => existing?._id ?? ctx.db.insert("bodega_categorias", { name: args.category.trim(), type: "egreso", isActive: true }));
    const id = await ctx.db.insert("bodega_egresos", {
      bodegaId: resolvedBodegaId,
      amount: args.amount,
      categoryId,
      date: args.operationalDate?.trim() || new Date().toISOString().split("T")[0],
      responsibleId: resolvedProfileId,
      responsibleName: current.user.name ?? resolvedProfile?.fullName ?? "Usuario",
      responsibleGroup: resolvedProfile?.group,
      evidenceStorageId: args.evidenceUrl,
      notes: args.description?.trim() || undefined,
      status: "pending",
    });
    return await ctx.db.get(id);
  },
});

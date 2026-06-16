import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { bodegaFields } from "./schema";
import { requireAdmin } from "../common/utils";
import { numberToWarehouseCode } from "../common/warehouseFolios";

function compactDefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, current]) => current !== undefined)
  ) as Partial<T>;
}

async function resolveResponsible(
  ctx: any,
  profileId?: any,
  userId?: any,
  existing?: { responsibleProfileId?: any; responsibleUserId?: any }
) {
  const profile = profileId ? await ctx.db.get(profileId) : null;
  const user = userId ? await ctx.db.get(userId) : null;
  const userProfile = user?.profileId ? await ctx.db.get(user.profileId) : null;
  if (profile && profile.status !== "Activo" && String(existing?.responsibleProfileId || "") !== String(profileId)) {
    throw new Error("No se puede asignar un perfil inactivo.");
  }
  if (user && user.isActive === false && String(existing?.responsibleUserId || "") !== String(userId)) {
    throw new Error("No se puede asignar un usuario inactivo.");
  }
  if (userProfile && userProfile.status !== "Activo" && String(existing?.responsibleProfileId || "") !== String(userProfile._id)) {
    throw new Error("No se puede asignar un perfil inactivo.");
  }
  return {
    responsibleProfileId: profile?._id || userProfile?._id,
    responsibleUserId: user?._id,
    responsibleName: profile?.fullName || userProfile?.fullName || user?.name || user?.email || undefined,
  };
}

async function syncBodegaLinkedAccount(ctx: any, bodegaId: any, data: any, currentBodega?: any) {
  const existing = await ctx.db
    .query("finance_accounts")
    .withIndex("by_linked_entity", (q: any) =>
      q.eq("linkedEntityType", "bodega").eq("linkedEntityId", String(bodegaId))
    )
    .first();
  const responsible = await resolveResponsible(
    ctx,
    data.managerProfileId,
    data.managerUserId,
    existing
      ? {
          responsibleProfileId: existing.responsibleProfileId,
          responsibleUserId: existing.responsibleUserId,
        }
      : currentBodega
        ? {
            responsibleProfileId: currentBodega.managerProfileId,
            responsibleUserId: currentBodega.managerUserId,
          }
        : undefined
  );
  const payload = compactDefined({
    alias: `Caja de ${data.name}`,
    type: "Caja Chica" as const,
    currency: "MXN",
    isActive: data.isActive,
    linkedEntityType: "bodega" as const,
    linkedEntityId: String(bodegaId),
    isSystemLinked: true,
    ...responsible,
  });
  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return;
  }
  await ctx.db.insert("finance_accounts", {
    ...payload,
    initialBalance: 0,
    currentBalance: 0,
  });
}

/**
 * Crea una nueva bodega.
 */
export const create = mutation({
  args: bodegaFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const allBodegas = await ctx.db.query("bodegas").collect();
    const code = args.code || numberToWarehouseCode(allBodegas.length + 1);
    const id = await ctx.db.insert("bodegas", compactDefined({ ...args, code }) as any);
    await syncBodegaLinkedAccount(ctx, id, args);
    return id;
  },
});

export const assignWarehouseCodes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bodegas = await ctx.db.query("bodegas").collect();
    const ordered = [...bodegas].sort((a, b) => a._creationTime - b._creationTime);
    let patched = 0;
    for (let i = 0; i < ordered.length; i++) {
      const bodega = ordered[i];
      if ((bodega as any).code) continue;
      const code = numberToWarehouseCode(i + 1);
      await ctx.db.patch(bodega._id, { code });
      patched++;
    }
    return { patched };
  },
});

/**
 * Actualiza la información de una bodega.
 */
export const update = mutation({
  args: {
    id: v.id("bodegas"),
    ...bodegaFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const current = await ctx.db.get(args.id);
    const { id, ...data } = args;
    await ctx.db.patch(id, compactDefined({ ...data }) as any);
    await syncBodegaLinkedAccount(ctx, id, data, current);
    return id;
  },
});

/**
 * Elimina una bodega.
 */
export const remove = mutation({
  args: { id: v.id("bodegas") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const linkedAccount = await ctx.db
      .query("finance_accounts")
      .withIndex("by_linked_entity", (q: any) =>
        q.eq("linkedEntityType", "bodega").eq("linkedEntityId", String(args.id))
      )
      .first();
    if (linkedAccount) {
      throw new Error("No se puede eliminar la bodega porque tiene una caja vinculada.");
    }
    const ingreso = await ctx.db
      .query("bodega_ingresos")
      .withIndex("by_bodegaId", (q: any) => q.eq("bodegaId", args.id))
      .first();
    if (ingreso) {
      throw new Error("No se puede eliminar la bodega porque tiene ingresos vinculados.");
    }
    const egreso = await ctx.db
      .query("bodega_egresos")
      .withIndex("by_bodegaId", (q: any) => q.eq("bodegaId", args.id))
      .first();
    if (egreso) {
      throw new Error("No se puede eliminar la bodega porque tiene egresos vinculados.");
    }
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_bodegaId", (q: any) => q.eq("bodegaId", args.id))
      .first();
    if (purchase) {
      throw new Error("No se puede eliminar la bodega porque tiene compras o movimientos vinculados.");
    }
    const salida = await ctx.db
      .query("salidas")
      .withIndex("by_bodegaId", (q: any) => q.eq("bodegaId", args.id))
      .first();
    if (salida) {
      throw new Error("No se puede eliminar la bodega porque tiene salidas o movimientos vinculados.");
    }
    await ctx.db.delete(args.id);
  },
});

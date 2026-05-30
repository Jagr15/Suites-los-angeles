import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { bodegaFields } from "./schema";
import { requireAdmin } from "../common/utils";
import { numberToWarehouseCode } from "../common/warehouseFolios";

async function resolveResponsible(ctx: any, profileId?: any, userId?: any) {
  const profile = profileId ? await ctx.db.get(profileId) : null;
  const user = userId ? await ctx.db.get(userId) : null;
  const userProfile = user?.profileId ? await ctx.db.get(user.profileId) : null;
  return {
    responsibleProfileId: profile?._id || userProfile?._id,
    responsibleUserId: user?._id,
    responsibleName: profile?.fullName || userProfile?.fullName || user?.name || user?.email || undefined,
  };
}

async function syncBodegaLinkedAccount(ctx: any, bodegaId: any, data: any) {
  const existing = await ctx.db
    .query("finance_accounts")
    .withIndex("by_linked_entity", (q: any) =>
      q.eq("linkedEntityType", "bodega").eq("linkedEntityId", String(bodegaId))
    )
    .first();
  const responsible = await resolveResponsible(ctx, data.managerProfileId, data.managerUserId);
  const payload = {
    alias: `Caja de ${data.name}`,
    type: "Caja Chica" as const,
    currency: "MXN",
    isActive: data.isActive,
    linkedEntityType: "bodega" as const,
    linkedEntityId: String(bodegaId),
    isSystemLinked: true,
    ...responsible,
  };
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
    const id = await ctx.db.insert("bodegas", { ...args, code });
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
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    await syncBodegaLinkedAccount(ctx, id, data);
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
    const account = await ctx.db
      .query("finance_accounts")
      .withIndex("by_linked_entity", (q: any) =>
        q.eq("linkedEntityType", "bodega").eq("linkedEntityId", String(args.id))
      )
      .first();
    if (account) {
      await ctx.db.patch(account._id, {
        isActive: false,
        alias: `${account.alias} (Bodega eliminada)`,
      });
    }
    await ctx.db.delete(args.id);
  },
});

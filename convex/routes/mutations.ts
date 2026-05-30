import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { routeFields } from "./schema";
import { requireAdmin } from "../common/utils";

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

async function syncRouteLinkedAccount(ctx: any, routeId: any, data: any) {
  const existing = await ctx.db
    .query("finance_accounts")
    .withIndex("by_linked_entity", (q: any) =>
      q.eq("linkedEntityType", "route").eq("linkedEntityId", String(routeId))
    )
    .first();
  const responsible = await resolveResponsible(ctx, data.assignedProfileId, data.assignedUserId);
  const payload = {
    alias: `Caja de ${data.name}`,
    type: "Caja Chica" as const,
    currency: "MXN",
    isActive: data.isActive,
    linkedEntityType: "route" as const,
    linkedEntityId: String(routeId),
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
 * Crea una nueva ruta.
 */
export const create = mutation({
  args: routeFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const payload = {
      ...args,
      routeType: args.routeType || "Interna",
    };
    const id = await ctx.db.insert("routes", payload);
    await syncRouteLinkedAccount(ctx, id, payload);
    return id;
  },
});

/**
 * Actualiza la información de una ruta.
 */
export const update = mutation({
  args: {
    id: v.id("routes"),
    ...routeFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    const payload = {
      ...data,
      routeType: data.routeType || "Interna",
    };
    await ctx.db.patch(id, payload);
    await syncRouteLinkedAccount(ctx, id, payload);
    return id;
  },
});

/**
 * Elimina una ruta.
 */
export const remove = mutation({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const account = await ctx.db
      .query("finance_accounts")
      .withIndex("by_linked_entity", (q: any) =>
        q.eq("linkedEntityType", "route").eq("linkedEntityId", String(args.id))
      )
      .first();
    if (account) {
      await ctx.db.patch(account._id, {
        isActive: false,
        alias: `${account.alias} (Ruta eliminada)`,
      });
    }
    await ctx.db.delete(args.id);
  },
});

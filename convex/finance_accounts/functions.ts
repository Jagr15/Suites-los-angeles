import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { financeAccountFields } from "./schema";
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

async function upsertSystemLinkedAccount(
  ctx: any,
  args: {
    linkedEntityType: "bodega" | "route";
    linkedEntityId: string;
    alias: string;
    responsibleProfileId?: any;
    responsibleUserId?: any;
    isActive?: boolean;
  }
) {
  const existing = await ctx.db
    .query("finance_accounts")
    .withIndex("by_linked_entity", (q: any) =>
      q.eq("linkedEntityType", args.linkedEntityType).eq("linkedEntityId", args.linkedEntityId)
    )
    .first();

  const responsible = await resolveResponsible(ctx, args.responsibleProfileId, args.responsibleUserId);
  const payload = {
    alias: args.alias,
    type: "Caja Chica" as const,
    currency: "MXN",
    isActive: args.isActive ?? true,
    linkedEntityType: args.linkedEntityType,
    linkedEntityId: args.linkedEntityId,
    isSystemLinked: true,
    ...responsible,
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return await ctx.db.insert("finance_accounts", {
    ...payload,
    initialBalance: 0,
    currentBalance: 0,
  });
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("finance_accounts").collect();
  },
});

export const create = mutation({
  args: {
    ...financeAccountFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("finance_accounts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("finance_accounts"),
    ...financeAccountFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("finance_accounts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const account = await ctx.db.get(args.id);
    if (!account) return;
    if (account.isSystemLinked || (account.linkedEntityType && account.linkedEntityType !== "manual")) {
      throw new Error("No se puede eliminar una caja vinculada a bodega o ruta.");
    }
    await ctx.db.delete(args.id);
  },
});

export const ensureLinkedAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bodegas = await ctx.db.query("bodegas").collect();
    const routes = await ctx.db.query("routes").collect();

    let createdOrUpdated = 0;
    for (const bodega of bodegas) {
      await upsertSystemLinkedAccount(ctx, {
        linkedEntityType: "bodega",
        linkedEntityId: String(bodega._id),
        alias: `Caja de ${bodega.name}`,
        responsibleProfileId: (bodega as any).managerProfileId,
        responsibleUserId: (bodega as any).managerUserId,
        isActive: bodega.isActive,
      });
      createdOrUpdated++;
    }

    for (const route of routes) {
      await upsertSystemLinkedAccount(ctx, {
        linkedEntityType: "route",
        linkedEntityId: String(route._id),
        alias: `Caja de ${route.name}`,
        responsibleProfileId: route.assignedProfileId,
        responsibleUserId: route.assignedUserId,
        isActive: route.isActive,
      });
      createdOrUpdated++;
    }

    const allAccounts = await ctx.db.query("finance_accounts").collect();
    for (const account of allAccounts) {
      if (!account.linkedEntityType) {
        await ctx.db.patch(account._id, {
          linkedEntityType: "manual",
          isSystemLinked: false,
        });
      }
    }

    return { createdOrUpdated };
  },
});

export const applyLinkedAccountMovement = mutation({
  args: {
    linkedEntityType: v.union(v.literal("bodega"), v.literal("route")),
    linkedEntityId: v.string(),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const account = await ctx.db
      .query("finance_accounts")
      .withIndex("by_linked_entity", (q) =>
        q.eq("linkedEntityType", args.linkedEntityType).eq("linkedEntityId", args.linkedEntityId)
      )
      .first();
    if (!account) return null;
    const nextBalance = (account.currentBalance || 0) + args.delta;
    await ctx.db.patch(account._id, { currentBalance: nextBalance });
    return account._id;
  },
});

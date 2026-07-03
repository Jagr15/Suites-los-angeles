import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { hasPermission, isAdmin, resolveCurrentStaffUser } from "../common/utils";

async function getRouteIdsForUser(
  ctx: any,
  user: { _id: Id<"users">; profileId?: Id<"profiles"> }
): Promise<Set<Id<"routes">>> {
  const routesByUser = await ctx.db
    .query("routes")
    .withIndex("by_assignedUserId", (q: any) => q.eq("assignedUserId", user._id))
    .collect();

  const routesByProfile = user.profileId
    ? await ctx.db
        .query("routes")
        .withIndex("by_assignedProfileId", (q: any) => q.eq("assignedProfileId", user.profileId))
        .collect()
    : [];

  return new Set([...routesByUser, ...routesByProfile].map((r: any) => r._id));
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    try {
      const clients = await ctx.db.query("clients").collect();
      if (await isAdmin(ctx)) return clients;
      const restrictToOwnCustomers = await hasPermission(ctx, "customers:restrict_view_other_salesmen");
      if (!restrictToOwnCustomers) return clients;
      const resolved = await resolveCurrentStaffUser(ctx);
      if (!resolved.user) return [];
      const allowedRouteIds = await getRouteIdsForUser(ctx, resolved.user);
      return clients.filter((client) => client.assignedRouteId && allowedRouteIds.has(client.assignedRouteId));
    } catch {
      return [];
    }
  },
});

export const listActiveForSelection = query({
  args: {},
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    return clients.filter((client: any) => client.isActive !== false && client.status !== "Inactivo");
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) return null;
    if (await isAdmin(ctx)) return client;
    const restrictToOwnCustomers = await hasPermission(ctx, "customers:restrict_view_other_salesmen");
    if (!restrictToOwnCustomers) return client;
    const user = (await resolveCurrentStaffUser(ctx)).user;
    if (!user) return null;
    const allowedRouteIds = await getRouteIdsForUser(ctx, user);
    if (!client.assignedRouteId || !allowedRouteIds.has(client.assignedRouteId)) {
      throw new Error("Acceso denegado: no puedes consultar clientes de otros vendedores.");
    }
    return client;
  },
});

export const listByRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    return clients.filter((client) => String(client.assignedRouteId || "") === String(args.routeId));
  },
});

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const resolved = await resolveCurrentStaffUser(ctx);
    if (!resolved.user) return [];
    if (resolved.routes.length === 0) return [];
    const routeIds = new Set(resolved.routes.map((route) => route._id));
    const clients = await ctx.db.query("clients").collect();
    return clients
      .filter((client) => client.assignedRouteId && routeIds.has(client.assignedRouteId))
      .sort((a, b) => (a.visitOrder ?? Number.MAX_SAFE_INTEGER) - (b.visitOrder ?? Number.MAX_SAFE_INTEGER));
  },
});

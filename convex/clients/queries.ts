import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission, isAdmin } from "../common/utils";
import type { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

async function getCurrentUserByEmail(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase() || "";
  if (!email) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
}

async function getRouteIdsForUser(
  ctx: QueryCtx,
  user: { _id: Id<"users">; profileId?: Id<"profiles"> }
): Promise<Set<Id<"routes">>> {
  const routesByUser = await ctx.db
    .query("routes")
    .withIndex("by_assignedUserId", (q) => q.eq("assignedUserId", user._id))
    .collect();

  const routesByProfile = user.profileId
    ? await ctx.db
        .query("routes")
        .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", user.profileId))
        .collect()
    : [];

  return new Set([...routesByUser, ...routesByProfile].map((r) => r._id));
}

/**
 * Lista todos los clientes.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    if (await isAdmin(ctx)) return clients;

    const restrictToOwnCustomers = await hasPermission(ctx, "customers:restrict_view_other_salesmen");
    if (!restrictToOwnCustomers) return clients;

    const user = await getCurrentUserByEmail(ctx);
    if (!user) return [];
    const allowedRouteIds = await getRouteIdsForUser(ctx, user);
    return clients.filter((client) => client.assignedRouteId && allowedRouteIds.has(client.assignedRouteId));
  },
});

/**
 * Obtiene un cliente por su ID.
 */
export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) return null;
    if (await isAdmin(ctx)) return client;

    const restrictToOwnCustomers = await hasPermission(ctx, "customers:restrict_view_other_salesmen");
    if (!restrictToOwnCustomers) return client;

    const user = await getCurrentUserByEmail(ctx);
    if (!user) return null;
    const allowedRouteIds = await getRouteIdsForUser(ctx, user);
    if (!client.assignedRouteId || !allowedRouteIds.has(client.assignedRouteId)) {
      throw new Error("Acceso denegado: no puedes consultar clientes de otros vendedores.");
    }
    return client;
  },
});
/**
 * Lista clientes asignados a una ruta específica.
 */
export const listByRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("assignedRouteId"), args.routeId))
      .collect();
  },
});

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Lista todos los clientes.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clients").collect();
  },
});

/**
 * Obtiene un cliente por su ID.
 */
export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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

import { query } from "../_generated/server";
import { v } from "convex/values";

export const OPERATIONAL_ROLE_NAMES = ["SuperAdmin", "Admin", "Bodeguero", "Vendedor"] as const;
const ALLOWED_ROLE_NAMES = new Set<string>(OPERATIONAL_ROLE_NAMES);
const ASSIGNABLE_ROLE_NAMES = new Set<string>(["Admin", "Bodeguero", "Vendedor"]);
const ROLE_ORDER = new Map<string, number>([
  ["SuperAdmin", 0],
  ["Admin", 1],
  ["Bodeguero", 2],
  ["Vendedor", 3],
]);

/**
 * Lista todos los roles disponibles.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles
      .filter((role) => ALLOWED_ROLE_NAMES.has(role.name))
      .sort((a, b) => (ROLE_ORDER.get(a.name) ?? 999) - (ROLE_ORDER.get(b.name) ?? 999));
  },
});

/**
 * Lista roles asignables desde UI normal (excluye SuperAdmin).
 */
export const listAssignable = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles
      .filter((role) => ASSIGNABLE_ROLE_NAMES.has(role.name))
      .sort((a, b) => (ROLE_ORDER.get(a.name) ?? 999) - (ROLE_ORDER.get(b.name) ?? 999));
  },
});

/**
 * Obtiene un rol por su ID.
 */
export const getById = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

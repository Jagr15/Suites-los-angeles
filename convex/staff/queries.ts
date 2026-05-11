import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

/**
 * Lista todos los empleados con sus perfiles de RRHH y sus roles.
 * Solo accesible para Administradores.
 */
export const listDetailedStaff = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    // Combinamos la información de User + Profile + Role
    return await Promise.all(
      users.map(async (user) => {
        const profile = user.profileId ? await ctx.db.get(user.profileId) : null;
        const role = user.roleId ? await ctx.db.get(user.roleId) : null;

        return {
          ...user,
          profile,
          roleData: role,
        };
      })
    );
  },
});

/**
 * Obtiene un empleado específico por su ID.
 */
export const getStaffById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const profile = user.profileId ? await ctx.db.get(user.profileId) : null;

    return { ...user, profile };
  },
});

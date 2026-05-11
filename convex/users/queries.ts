import { query } from "../_generated/server";
import { requireAdmin, requireIdentity } from "../common/utils";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireIdentity(ctx);

    let user = await ctx.db.get(userId);
    
    // SIEMPRE BUSCAMOS SI HAY UN PERFIL REAL POR EMAIL PARA EVITAR DUPLICADOS
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email) {
      const staffUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email))
        .filter((q) => q.neq(q.field("role"), "user")) // Ignorar el duplicado vacío
        .unique();
      
      if (staffUser) {
        user = staffUser;
      }
    }

    if (!user) return null;

    // Buscamos el rol completo
    const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;

    return {
      ...user,
      roleData,
    };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;
        return {
          ...user,
          roleData,
        };
      })
    );

    return usersWithRoles;
  },
});

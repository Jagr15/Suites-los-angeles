import { query } from "../_generated/server";
import { requireAdmin } from "../common/utils";
import { getAuthUserId } from "@convex-dev/auth/server";

function rolePriority(role?: string) {
  const normalized = (role || "").trim().toLowerCase();
  if (normalized === "superadmin" || normalized === "super admin") return 4;
  if (normalized === "admin" || normalized === "administrador") return 3;
  if (normalized === "bodeguero" || normalized === "bodega" || normalized === "rutas") return 2;
  if (normalized === "vendedor") return 1;
  return 0;
}

function pickBestUserCandidate<T extends { role?: string; roleId?: string; isActive?: boolean }>(users: T[]) {
  return [...users].sort((a, b) => {
    const activeA = a.isActive ? 1 : 0;
    const activeB = b.isActive ? 1 : 0;
    if (activeA !== activeB) return activeB - activeA;

    const roleIdA = a.roleId ? 1 : 0;
    const roleIdB = b.roleId ? 1 : 0;
    if (roleIdA !== roleIdB) return roleIdB - roleIdA;

    return rolePriority(b.role) - rolePriority(a.role);
  })[0] ?? null;
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let user = null;

    // 1) Fuente primaria: email (evita IDs inválidos y resuelve duplicados auth<->staff)
    const email = identity.email?.trim().toLowerCase() || "";
    if (email) {
      const usersByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      if (usersByEmail.length > 0) {
        user = pickBestUserCandidate(usersByEmail);
      }
    }

    // 2) Fallback: userId autenticado validado por Convex Auth (Id<"users"> seguro)
    if (!user) {
      const authUserId = await getAuthUserId(ctx);
      if (authUserId) {
        user = await ctx.db.get(authUserId);
      }
    }

    if (!user) return null;

    // Buscamos rol y perfil completos
    const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;
    const profileData = user.profileId ? await ctx.db.get(user.profileId) : null;

    return {
      ...user,
      roleData,
      profileData,
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
        const profileData = user.profileId ? await ctx.db.get(user.profileId) : null;
        return {
          ...user,
          roleData,
          profileData,
        };
      })
    );

    return usersWithRoles;
  },
});

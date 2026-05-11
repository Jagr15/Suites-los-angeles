import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";

function isAdminRoleName(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
}

/**
 * Verifica si el usuario actual tiene rol de administrador.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);

  // 1) Verificación directa por el userId autenticado (si existe y es válido)
  if (userId) {
    const currentUser = await ctx.db.get(userId);
    if (currentUser) {
      if (isAdminRoleName(currentUser.role)) return true;
      if (currentUser.roleId) {
        const roleDoc = await ctx.db.get(currentUser.roleId);
        if (isAdminRoleName(roleDoc?.name)) return true;
      }
    }
  }

  // 2) Fallback por email para casos de duplicado auth user<->staff user
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase() || "";
  if (email) {
    const usersByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const user of usersByEmail) {
      if (isAdminRoleName(user.role)) return true;
      if (user.roleId) {
        const roleDoc = await ctx.db.get(user.roleId);
        if (isAdminRoleName(roleDoc?.name)) return true;
      }
    }
  }

  return false;
}

/**
 * Lanza un error si el usuario actual no es administrador.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  if (!(await isAdmin(ctx))) {
    throw new Error("Acceso denegado: Se requieren permisos de administrador");
  }
}

/**
 * Lanza un error si el usuario no está autenticado.
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("No autenticado");
  }
  return userId;
}

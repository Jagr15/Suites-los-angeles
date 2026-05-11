import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Verifica si el usuario actual tiene rol de administrador.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  
  // 1. Verificar por string directo
  if (user?.role === "admin") return true;

  // 2. Verificar por tabla de roles
  if (user?.roleId) {
    const roleDoc = await ctx.db.get(user.roleId);
    if (roleDoc?.name.toLowerCase() === "admin") return true;
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

import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";

function looksLikeConvexId(value: string) {
  const trimmed = value.trim();
  return /^[a-z0-9]+$/i.test(trimmed) && trimmed.length >= 20 && trimmed.length <= 40;
}

function isAdminRoleName(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "superadmin" || normalized === "super admin";
}

/**
 * Verifica si el usuario actual tiene rol de administrador.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);

  // 1) Verificación directa por el userId autenticado (si existe y es válido)
  if (userId && looksLikeConvexId(String(userId))) {
    try {
      const currentUser = await ctx.db.get(userId);
      if (currentUser) {
        if (isAdminRoleName(currentUser.role)) return true;
        if (currentUser.roleId) {
          const roleDoc = await ctx.db.get(currentUser.roleId);
          if (isAdminRoleName(roleDoc?.name)) return true;
        }
      }
    } catch {
      // Subject inválido o no decodificable: seguimos con fallback seguro por email.
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
 * Permite ejecutar migraciones desde CLI únicamente en DEV cuando
 * ALLOW_DEV_MIGRATIONS=true y CONVEX_DEPLOYMENT indica entorno dev.
 * En cualquier otro caso exige admin autenticado.
 */
export async function requireAdminOrDevMigration(ctx: QueryCtx | MutationCtx) {
  if (await isAdmin(ctx)) return;

  const allowDevMigrations = (process.env.ALLOW_DEV_MIGRATIONS || "").trim().toLowerCase() === "true";
  const deployment = (process.env.CONVEX_DEPLOYMENT || "").trim().toLowerCase();
  const isDevDeployment = deployment.startsWith("dev:");

  if (allowDevMigrations && isDevDeployment) {
    return;
  }

  throw new Error(
    "Acceso denegado: se requieren permisos de administrador o ALLOW_DEV_MIGRATIONS=true en deployment dev."
  );
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
